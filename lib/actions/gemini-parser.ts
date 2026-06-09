"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { TRANSPORT_FACTORS, FOOD_FACTORS, ENERGY_FACTORS } from "../data/emission-factors";

// Cache store structures for optimization
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

const activityCache = new Map<string, CacheEntry<ParseResult>>();
const savingsCache = new Map<string, CacheEntry<CommunitySavingsResult>>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_CACHE_SIZE = 100;

function getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeToCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { value, timestamp: Date.now() });
}

export interface ParseResult {
  success: boolean;
  activities: {
    name: string;
    category: string;
    detail: string;
    co2: number;
  }[];
  totalCO2: number;
  tips: string[];
  summary: string;
  error?: string;
  isOfflineFallback?: boolean;
}

const SYSTEM_PROMPT = `You are a carbon footprint calculator specialized for India. 
Given a user's description of their daily activities, extract each activity and estimate its CO2 emissions in kg.

Use India-specific emission factors:
- Auto-rickshaw: ~0.08 kg CO2/km
- City Bus (MTC/DTC/BEST): ~0.03 kg CO2/km
- Metro Rail: ~0.04 kg CO2/km
- Local/Suburban Train: ~0.014 kg CO2/km
- Indian Railways (AC): ~0.014 kg CO2/km
- Two-wheeler (Bike/Scooter): ~0.05 kg CO2/km
- Car (Petrol): ~0.15 kg CO2/km
- Car (Diesel): ~0.17 kg CO2/km
- Electric Car: ~0.05 kg CO2/km
- Cab/Taxi (Ola/Uber): ~0.15 kg CO2/km
- Domestic Flight: ~0.255 kg CO2/km
- Chicken Biryani: ~3.2 kg CO2e/serving
- Mutton Biryani: ~5.5 kg CO2e/serving
- Veg Biryani: ~0.9 kg CO2e/serving
- Paneer Dish: ~1.5 kg CO2e/serving
- Dal Rice: ~0.5 kg CO2e/serving
- Vegetarian Thali: ~0.8 kg CO2e/serving
- Non-Veg Thali: ~2.5 kg CO2e/serving
- Dosa/Idli: ~0.4 kg CO2e/serving
- Roti + Sabzi: ~0.6 kg CO2e/serving
- Chai (Milk Tea): ~0.1 kg CO2e/cup
- Coffee: ~0.15 kg CO2e/cup
- Lassi: ~0.3 kg CO2e/glass
- Grid Electricity (India avg): ~0.82 kg CO2/kWh
- LPG Cooking Gas: ~2.98 kg CO2/kg
- AC (1.5 ton): ~1.5 kg CO2/hour

Respond ONLY with valid JSON in this exact format:
{
  "activities": [
    {"name": "Activity name", "category": "transport|food|energy|other", "detail": "Brief detail with quantity", "co2": 0.5}
  ],
  "totalCO2": 1.0,
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "summary": "Brief summary of their impact"
}`;

/**
 * Heuristic Offline Parser (fallback when Gemini key is rate-limited, quota exceeded, or unconfigured)
 */
function parseOfflineHeuristic(input: string): ParseResult {
  const text = input.toLowerCase();
  const activities: ParseResult["activities"] = [];
  let totalCO2 = 0;
  const tips: string[] = [];
  const itemsFound: string[] = [];

  // Helper to extract numbers near keywords
  const extractQuantity = (keywords: string[], unitPattern: string, defaultValue = 1): number => {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        const regex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${unitPattern})?\\s*(?:of|for|near|in|by|on|at|with|using|to)?\\s*${keyword}|${keyword}\\s*(?:for|of|in|by|on|at|with|using|to)?\\s*(\\d+(?:\\.\\d+)?)`);
        const match = text.match(regex);
        if (match) {
          const val = match[1] || match[2];
          if (val) return parseFloat(val);
        }
        return defaultValue;
      }
    }
    return 0;
  };

  // --- Transport Parsing ---
  const autoDistance = extractQuantity(["auto", "rickshaw", "auto-rickshaw", "autorickshaw"], "km|kms|kilometer|kilometers|kilometre|kilometres");
  if (autoDistance > 0) {
    const co2 = autoDistance * TRANSPORT_FACTORS.autoRickshaw.factor;
    activities.push({
      name: "Auto-rickshaw Commute",
      category: "transport",
      detail: `${autoDistance.toFixed(1)} km ride`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("Auto-rickshaw");
    tips.push("Consider walking or cycling for short commutes under 2km to eliminate emissions.");
  }

  const metroDistance = extractQuantity(["metro", "train", "local train", "suburban"], "km|kms|kilometer|kilometers|kilometre|kilometres");
  if (metroDistance > 0) {
    const isMetro = text.includes("metro");
    const factor = isMetro ? TRANSPORT_FACTORS.metro.factor : TRANSPORT_FACTORS.localTrain.factor;
    const label = isMetro ? "Metro Commute" : "Local Train Commute";
    const co2 = metroDistance * factor;
    activities.push({
      name: label,
      category: "transport",
      detail: `${metroDistance.toFixed(1)} km ride`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push(isMetro ? "Metro" : "Train");
    tips.push("Local rails and metros are extremely carbon-efficient. Keep utilizing public transit!");
  }

  const carDistance = extractQuantity(["car", "petrol car", "diesel car", "cab", "uber", "ola", "taxi"], "km|kms|kilometer|kilometers|kilometre|kilometres");
  if (carDistance > 0) {
    const isCab = text.includes("cab") || text.includes("uber") || text.includes("ola") || text.includes("taxi");
    const factor = isCab ? TRANSPORT_FACTORS.cab.factor : (text.includes("diesel") ? TRANSPORT_FACTORS.carDiesel.factor : TRANSPORT_FACTORS.carPetrol.factor);
    const label = isCab ? "Cab/Taxi Ride" : "Personal Car Drive";
    const co2 = carDistance * factor;
    activities.push({
      name: label,
      category: "transport",
      detail: `${carDistance.toFixed(1)} km ride`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push(isCab ? "Cab" : "Car");
    tips.push("Pool rides or switch to the Chennai/Delhi Metro to reduce car transit emissions by up to 80%.");
  }

  const bikeDistance = extractQuantity(["bike", "motorcycle", "scooter", "two-wheeler", "activa", "bullet"], "km|kms|kilometer|kilometers|kilometre|kilometres");
  if (bikeDistance > 0) {
    const co2 = bikeDistance * TRANSPORT_FACTORS.twoWheeler.factor;
    activities.push({
      name: "Two-wheeler Ride",
      category: "transport",
      detail: `${bikeDistance.toFixed(1)} km ride`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("Scooter");
    tips.push("Maintain correct tire pressure on your bike to optimize fuel economy and cut carbon.");
  }

  // --- Diet Parsing ---
  const extractMealServings = (keywords: string[]): number => {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        const regex = new RegExp(`(\\d+)\\s*(?:serving|servings|plate|plates|bowl|bowls)?\\s*of\\s*${keyword}|${keyword}\\s*(\\d+)`);
        const match = text.match(regex);
        if (match) {
          const val = match[1] || match[2];
          if (val) return parseInt(val, 10);
        }
        return 1;
      }
    }
    return 0;
  };

  const biryaniServings = extractMealServings(["biryani", "chicken biryani", "mutton biryani"]);
  if (biryaniServings > 0) {
    const isMutton = text.includes("mutton");
    const isVeg = text.includes("veg") && !text.includes("chicken") && !text.includes("mutton");
    const factor = isMutton ? FOOD_FACTORS.muttonBiryani.factor : (isVeg ? FOOD_FACTORS.vegBiryani.factor : FOOD_FACTORS.chickenBiryani.factor);
    const label = isMutton ? "Mutton Biryani meal" : (isVeg ? "Vegetarian Biryani meal" : "Chicken Biryani meal");
    const co2 = biryaniServings * factor;
    activities.push({
      name: label,
      category: "food",
      detail: `${biryaniServings} plate(s)`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("Biryani");
    if (!isVeg) {
      tips.push("Animal farming accounts for higher carbon footprints. Try opting for vegetarian items like veg biryani or dal rice.");
    }
  }

  const paneerServings = extractMealServings(["paneer", "paneer dish", "paneer tikka", "paneer butter"]);
  if (paneerServings > 0) {
    const co2 = paneerServings * FOOD_FACTORS.paneerDish.factor;
    activities.push({
      name: "Paneer Meal",
      category: "food",
      detail: `${paneerServings} serving(s)`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("Paneer");
    tips.push("Dairy has moderate footprint. Balance it with low-impact grains and lentils.");
  }

  const mealServings = extractMealServings(["dal rice", "dal chawal", "veg meal", "thali", "roti", "sabzi"]);
  if (mealServings > 0) {
    const isThali = text.includes("thali");
    const factor = isThali ? FOOD_FACTORS.vegThali.factor : FOOD_FACTORS.dalRice.factor;
    const label = isThali ? "Vegetarian Thali meal" : "Lentil Rice / Roti meal";
    const co2 = mealServings * factor;
    activities.push({
      name: label,
      category: "food",
      detail: `${mealServings} plate(s)`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("Grains");
    tips.push("Lentil rice and rotis are extremely environment friendly local staples.");
  }

  const teaCups = extractMealServings(["chai", "tea", "coffee", "lassi"]);
  if (teaCups > 0) {
    const isLassi = text.includes("lassi");
    const isCoffee = text.includes("coffee");
    const factor = isLassi ? FOOD_FACTORS.lassi.factor : (isCoffee ? FOOD_FACTORS.coffee.factor : FOOD_FACTORS.chai.factor);
    const label = isLassi ? "Lassi glass" : (isCoffee ? "Coffee cup" : "Chai cup");
    const co2 = teaCups * factor;
    activities.push({
      name: label,
      category: "food",
      detail: `${teaCups} cup(s)`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("Beverage");
  }

  // --- Utilities Parsing ---
  const acHours = extractQuantity(["ac", "aircon", "air conditioner", "split ac"], "hour|hours|hr|hrs|h");
  if (acHours > 0) {
    const co2 = acHours * ENERGY_FACTORS.acUsage.factor;
    activities.push({
      name: "AC Usage",
      category: "energy",
      detail: `${acHours.toFixed(1)} hours usage`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("AC");
    tips.push("Setting your AC thermostat to 24°C rather than 18°C saves up to 24% in grid energy.");
  }

  const electricityUnits = extractQuantity(["electricity", "power", "grid", "kwh", "units", "unit"], "unit|units|kwh");
  if (electricityUnits > 0) {
    const co2 = electricityUnits * ENERGY_FACTORS.electricity.factor;
    activities.push({
      name: "Electricity Consumed",
      category: "energy",
      detail: `${electricityUnits.toFixed(1)} kWh/units`,
      co2: Number(co2.toFixed(2)),
    });
    totalCO2 += co2;
    itemsFound.push("Electricity");
    tips.push("Switch to LED bulbs and energy star rated appliances to conserve grid units.");
  }

  // Fallback if nothing is identified
  if (activities.length === 0) {
    activities.push({
      name: "General Activity",
      category: "other",
      detail: "Unspecified daily carbon overhead",
      co2: 1.2,
    });
    totalCO2 = 1.2;
    tips.push("Describe inputs clearly with numbers (e.g. '5km auto' or '2 hours AC') to get high-accuracy calculations.");
  }

  return {
    success: true,
    activities,
    totalCO2: Number(totalCO2.toFixed(2)),
    tips: tips.slice(0, 3),
    summary: `(AI Quota Exceeded - Local Calculation Fallback) Identified: ${itemsFound.length > 0 ? itemsFound.join(", ") : "general carbon metrics"}.`,
    isOfflineFallback: true,
  };
}

export async function parseActivityInput(
  input: string
): Promise<ParseResult> {
  const cacheKey = input.trim().toLowerCase();
  const cachedResult = getFromCache(activityCache, cacheKey);
  if (cachedResult) {
    console.log(`[Aura Cache] Cache hit for activity input: "${cacheKey}"`);
    return cachedResult;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  // LOG KEY STATUS TO TERMINAL
  console.log("\n=== 🌿 AURA GEMINI API DIAGNOSTICS ===");
  console.log("Input received:", input);
  console.log("API Key Source:", process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : (process.env.GOOGLE_GEMINI_API_KEY ? "GOOGLE_GEMINI_API_KEY" : (process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "NEXT_PUBLIC_GEMINI_API_KEY" : "NONE")));
  if (apiKey) {
    console.log("API Key loaded successfully!");
    console.log("Key preview:", apiKey.substring(0, 7) + "..." + apiKey.substring(apiKey.length - 4));
    console.log("Key placeholder check:", apiKey.includes("your-gemini") ? "❌ KEY IS A PLACEHOLDER!" : "✅ KEY LOOKS REAL");
  } else {
    console.log("❌ NO API KEY DETECTED! Next.js did not load any env vars.");
  }
  console.log("======================================\n");

  if (!apiKey || apiKey === "" || apiKey.includes("your-gemini")) {
    console.warn("Gemini API key is unconfigured. Falling back to Heuristic Parser.");
    const fallback = parseOfflineHeuristic(input);
    writeToCache(activityCache, cacheKey, fallback);
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];
    let lastError: Error | unknown = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Aura Parser] Querying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { text: SYSTEM_PROMPT },
          { text: `User's activities: ${input}` },
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
          responseText.match(/(\{[\s\S]*\})/);

        if (!jsonMatch) {
          throw new Error(`Invalid JSON format returned from model ${modelName}`);
        }

        const parsed = JSON.parse(jsonMatch[1]);
        console.log(`[Aura Parser] Successfully parsed with model: ${modelName}`);

        const finalResult: ParseResult = {
          success: true,
          activities: parsed.activities || [],
          totalCO2: parsed.totalCO2 || 0,
          tips: parsed.tips || [],
          summary: parsed.summary || "",
          isOfflineFallback: false,
        };
        writeToCache(activityCache, cacheKey, finalResult);
        return finalResult;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Aura Parser] Model ${modelName} failed:`, errMsg);
        lastError = err;
      }
    }

    const lastErrorMessage = lastError instanceof Error ? (lastError as Error).message : String(lastError || "");
    const isQuotaOrCapacity = lastErrorMessage.includes("429") || 
                              lastErrorMessage.includes("503") ||
                              lastErrorMessage.toLowerCase().includes("quota") ||
                              lastErrorMessage.toLowerCase().includes("demand");

    if (isQuotaOrCapacity) {
      console.warn("All Gemini models failed due to quota/capacity limits. Using local parser fallback.");
      const fallback = parseOfflineHeuristic(input);
      fallback.summary = `(AI capacity spike - local calculation) ${fallback.summary}`;
      writeToCache(activityCache, cacheKey, fallback);
      return fallback;
    }

    const corporateError: ParseResult = {
      success: false,
      activities: [],
      totalCO2: 0,
      tips: [],
      summary: "",
      error: "Unable to authorize or execute the carbon engine parse. Please retry later.",
    };
    return corporateError;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? (error as Error).message : String(error);
    console.error("Aura parser hit critical uncaught error:", errorMsg);
    return {
      success: false,
      activities: [],
      totalCO2: 0,
      tips: [],
      summary: "",
      error: "A critical diagnostic error occurred within the carbon calculation engine.",
    };
  }
}

// --- Community Savings Estimator ---

export interface CommunitySavingsResult {
  success: boolean;
  actionTaken: string;
  co2Saved: number; // in kg
  explanation: string;
  error?: string;
  isOfflineFallback?: boolean;
}

const SAVING_SYSTEM_PROMPT = `You are a carbon savings estimator specialized for India. 
Given a user's description of a green action they took (e.g. taking metro instead of cab, eating veg meal instead of biryani), estimate the net CO2 saved in kg.

Use these standard India GHG Program emission factors:
- Auto-rickshaw: ~0.08 kg CO2/km
- City Bus: ~0.03 kg CO2/km
- Metro Rail: ~0.04 kg CO2/km
- Local/Suburban Train: ~0.014 kg CO2/km
- Two-wheeler (Bike/Scooter): ~0.05 kg CO2/km
- Car (Petrol): ~0.15 kg CO2/km
- Cab/Taxi (Ola/Uber): ~0.15 kg CO2/km
- Chicken Biryani: ~3.2 kg CO2e/serving
- Mutton Biryani: ~5.5 kg CO2e/serving
- Veg meal / Veg Biryani: ~0.8 kg CO2e/serving
- Paneer Dish: ~1.5 kg CO2e/serving
- Dal Rice / Roti meal: ~0.5 kg CO2e/serving
- AC (1.5 ton): ~1.5 kg CO2/hour

Calculate:
1. Green action emissions.
2. High-carbon alternative avoided emissions.
3. Net CO2 saved (Difference: Avoided emissions - Green action emissions). E.g., choosing Chennai Metro over personal car for 10km = (10 * 0.15) - (10 * 0.04) = 1.1kg saved.

Respond ONLY with valid JSON in this exact format:
{
  "actionTaken": "Brief description of the action",
  "co2Saved": 1.1,
  "explanation": "Brief explanation of how the savings were calculated using the factors"
}`;

function parseOfflineSavingsHeuristic(input: string): CommunitySavingsResult {
  const text = input.toLowerCase();
  let co2Saved = 1.2;
  let actionTaken = "Carbon reduction effort";
  let explanation = "Calculated using local average benchmarks for eco-friendly lifestyle choices.";

  const extractDistance = (): number => {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:km|kms|kilometer|kilometers|kilometre|kilometres)/);
    return match ? parseFloat(match[1]) : 10;
  };

  if (text.includes("metro") && (text.includes("cab") || text.includes("taxi") || text.includes("car") || text.includes("uber") || text.includes("ola"))) {
    const dist = extractDistance();
    co2Saved = dist * (TRANSPORT_FACTORS.cab.factor - TRANSPORT_FACTORS.metro.factor);
    actionTaken = `Metro ride instead of Cab/Car for ${dist}km`;
    explanation = `Saved ${co2Saved.toFixed(2)} kg CO2 by taking Metro (${(dist * TRANSPORT_FACTORS.metro.factor).toFixed(2)} kg) instead of taxi/cab/car (${(dist * TRANSPORT_FACTORS.cab.factor).toFixed(2)} kg).`;
  } else if (text.includes("train") && (text.includes("car") || text.includes("cab") || text.includes("drive"))) {
    const dist = extractDistance();
    co2Saved = dist * (TRANSPORT_FACTORS.carPetrol.factor - TRANSPORT_FACTORS.localTrain.factor);
    actionTaken = `Local Train instead of Drive/Cab for ${dist}km`;
    explanation = `Saved ${co2Saved.toFixed(2)} kg CO2 by taking local train/rail (${(dist * TRANSPORT_FACTORS.localTrain.factor).toFixed(2)} kg) instead of driving (${(dist * TRANSPORT_FACTORS.carPetrol.factor).toFixed(2)} kg).`;
  } else if (text.includes("bus") && (text.includes("car") || text.includes("cab") || text.includes("drive"))) {
    const dist = extractDistance();
    co2Saved = dist * (TRANSPORT_FACTORS.carPetrol.factor - TRANSPORT_FACTORS.cityBus.factor);
    actionTaken = `City Bus commute instead of Driving/Cab for ${dist}km`;
    explanation = `Saved ${co2Saved.toFixed(2)} kg CO2 by riding the city bus (${(dist * TRANSPORT_FACTORS.cityBus.factor).toFixed(2)} kg) instead of driving (${(dist * TRANSPORT_FACTORS.carPetrol.factor).toFixed(2)} kg).`;
  } else if ((text.includes("veg") || text.includes("dal") || text.includes("dosa")) && (text.includes("chicken") || text.includes("mutton") || text.includes("biryani"))) {
    co2Saved = FOOD_FACTORS.chickenBiryani.factor - FOOD_FACTORS.dalRice.factor;
    actionTaken = "Vegetarian meal instead of Chicken/Mutton Biryani";
    explanation = `Saved ${co2Saved.toFixed(2)} kg CO2 by choosing a low-impact grain/lentil meal (~${FOOD_FACTORS.dalRice.factor} kg) over non-vegetarian biryani (~${FOOD_FACTORS.chickenBiryani.factor} kg).`;
  } else if (text.includes("ac") && (text.includes("off") || text.includes("fan") || text.includes("turned off"))) {
    co2Saved = ENERGY_FACTORS.acUsage.factor * 2;
    actionTaken = "Conserving cooling energy / AC off";
    explanation = `Saved ~${co2Saved.toFixed(2)} kg CO2 by keeping the 1.5 ton split AC off for approximately 2 hours.`;
  }

  return {
    success: true,
    actionTaken,
    co2Saved: Number(co2Saved.toFixed(2)),
    explanation,
    isOfflineFallback: true,
  };
}

export async function parseCommunitySaving(
  input: string
): Promise<CommunitySavingsResult> {
  const cacheKey = input.trim().toLowerCase();
  const cachedResult = getFromCache(savingsCache, cacheKey);
  if (cachedResult) {
    console.log(`[Aura Cache] Cache hit for community savings input: "${cacheKey}"`);
    return cachedResult;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey.includes("your-gemini")) {
    console.warn("Gemini API key is unconfigured. Estimating savings locally.");
    const fallback = parseOfflineSavingsHeuristic(input);
    writeToCache(savingsCache, cacheKey, fallback);
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];
    let lastError: Error | unknown = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Aura Savings Parser] Querying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { text: SAVING_SYSTEM_PROMPT },
          { text: `User's milestone: ${input}` },
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
          responseText.match(/(\{[\s\S]*\})/);

        if (!jsonMatch) {
          throw new Error(`Invalid JSON format returned from model ${modelName}`);
        }

        const parsed = JSON.parse(jsonMatch[1]);
        console.log(`[Aura Savings Parser] Successfully parsed with model: ${modelName}`);

        const finalResult: CommunitySavingsResult = {
          success: true,
          actionTaken: parsed.actionTaken || "Carbon savings action",
          co2Saved: parsed.co2Saved || 0,
          explanation: parsed.explanation || "No explanation provided",
          isOfflineFallback: false,
        };
        writeToCache(savingsCache, cacheKey, finalResult);
        return finalResult;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Aura Savings Parser] Model ${modelName} failed:`, errMsg);
        lastError = err;
      }
    }

    const lastErrorMessage = lastError instanceof Error ? (lastError as Error).message : String(lastError || "");
    const isQuotaOrCapacity = lastErrorMessage.includes("429") || 
                              lastErrorMessage.includes("503") ||
                              lastErrorMessage.toLowerCase().includes("quota") ||
                              lastErrorMessage.toLowerCase().includes("demand");

    if (isQuotaOrCapacity) {
      console.warn("All Gemini models failed. Using local heuristic savings fallback.");
      const fallback = parseOfflineSavingsHeuristic(input);
      writeToCache(savingsCache, cacheKey, fallback);
      return fallback;
    }

    const corporateError: CommunitySavingsResult = {
      success: false,
      actionTaken: "",
      co2Saved: 0,
      explanation: "",
      error: "Unable to authorize or execute the carbon savings audit. Please retry later.",
    };
    return corporateError;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? (error as Error).message : String(error);
    console.error("Aura savings parser hit critical uncaught error:", errorMsg);
    return {
      success: false,
      actionTaken: "",
      co2Saved: 0,
      explanation: "",
      error: "A critical diagnostic error occurred within the carbon calculation engine.",
    };
  }
}
