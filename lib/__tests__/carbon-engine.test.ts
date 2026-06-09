import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { parseActivityInput, parseCommunitySaving } from "@/lib/actions/gemini-parser";
import { TRANSPORT_FACTORS, FOOD_FACTORS, getEmissionFactorContext } from "@/lib/data/emission-factors";
import { sanitizeData } from "@/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";

describe("🌿 Aura Carbon Engine — Core Calculations & Heuristics", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    // Force unconfigured API key to guarantee offline local heuristic runs
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: "your-gemini-api-key-placeholder",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("1. Local Heuristic Transport Calculations", () => {
    test("Asserts correct calculations for Auto-rickshaws", async () => {
      const input = "I traveled 10km by auto";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);
      expect(result.isOfflineFallback).toBe(true);
      
      const autoActivity = result.activities.find(act => act.name.includes("Auto-rickshaw"));
      expect(autoActivity).toBeDefined();
      
      // 10km * 0.08 factor = 0.80 kg CO2
      expect(autoActivity!.co2).toBeCloseTo(10 * TRANSPORT_FACTORS.autoRickshaw.factor, 2);
    });

    test("Asserts correct calculations for Metro Rail commutes", async () => {
      const input = "Took local metro for 15km to office";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);
      
      const metroActivity = result.activities.find(act => act.name.toLowerCase().includes("metro"));
      expect(metroActivity).toBeDefined();

      // 15km * 0.04 factor = 0.60 kg CO2
      expect(metroActivity!.co2).toBeCloseTo(15 * TRANSPORT_FACTORS.metro.factor, 2);
    });

    test("Asserts correct calculations for Two-wheelers / Bikes", async () => {
      const input = "Rode my motorcycle for 8kms to the store";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);

      const bikeActivity = result.activities.find(act => act.name.toLowerCase().includes("two-wheeler"));
      expect(bikeActivity).toBeDefined();

      // 8km * 0.05 factor = 0.40 kg CO2
      expect(bikeActivity!.co2).toBeCloseTo(8 * TRANSPORT_FACTORS.twoWheeler.factor, 2);
    });

    test("Asserts correct calculations for Cab commutes (Ola/Uber)", async () => {
      const input = "Commuted 12km by cab";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);

      const cabActivity = result.activities.find(act => act.name.toLowerCase().includes("cab"));
      expect(cabActivity).toBeDefined();

      // 12km * 0.15 factor = 1.80 kg CO2
      expect(cabActivity!.co2).toBeCloseTo(12 * TRANSPORT_FACTORS.cab.factor, 2);
    });
  });

  describe("2. Regional Diets & Food Footprint Calculations", () => {
    test("Asserts correct weights for Chicken Biryani serving", async () => {
      const input = "Had chicken biryani for lunch";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);

      const foodActivity = result.activities.find(act => act.name.toLowerCase().includes("chicken biryani"));
      expect(foodActivity).toBeDefined();
      expect(foodActivity!.co2).toBeCloseTo(FOOD_FACTORS.chickenBiryani.factor, 2);
    });

    test("Asserts correct weights for local staple Dal Rice / Roti Sabzi", async () => {
      const input = "Had dal rice for dinner";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);

      const foodActivity = result.activities.find(act => act.name.toLowerCase().includes("lentil rice"));
      expect(foodActivity).toBeDefined();
      expect(foodActivity!.co2).toBeCloseTo(FOOD_FACTORS.dalRice.factor, 2);
    });
  });

  describe("3. Community Savings Calculations", () => {
    test("Asserts net savings comparing Metro vs Cab", async () => {
      const input = "Took metro instead of cab for 12km";
      const result = await parseCommunitySaving(input);

      expect(result.success).toBe(true);
      expect(result.isOfflineFallback).toBe(true);

      // Expected avoided = 12 * 0.15 = 1.80; green action = 12 * 0.04 = 0.48; Net savings = 1.32 kg
      const expectedSavings = 12 * (TRANSPORT_FACTORS.cab.factor - TRANSPORT_FACTORS.metro.factor);
      expect(result.co2Saved).toBeCloseTo(expectedSavings, 2);
      expect(result.actionTaken).toContain("Metro ride instead of Cab/Car");
    });

    test("Asserts net savings for Vegetarian transition", async () => {
      const input = "Had veg meal instead of chicken biryani";
      const result = await parseCommunitySaving(input);

      expect(result.success).toBe(true);

      // Expected savings: Chicken Biryani (3.20) - Dal Rice (0.50) = 2.70 kg
      const expectedSavings = FOOD_FACTORS.chickenBiryani.factor - FOOD_FACTORS.dalRice.factor;
      expect(result.co2Saved).toBeCloseTo(expectedSavings, 2);
      expect(result.actionTaken).toContain("Vegetarian meal instead of Chicken/Mutton Biryani");
    });
  });

  describe("4. Edge Cases, Boundaries, & Chaotic Inputs", () => {
    test("Gracefully handles completely empty input strings", async () => {
      const input = "";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);
      expect(result.totalCO2).toBeGreaterThan(0); // general carbon overhead fallback
    });

    test("Handles zero-bound distance variables", async () => {
      const input = "traveled 0km in car";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);
      // Because distance is 0, it falls back to general carbon activity
      const hasGeneral = result.activities.some(act => act.name.includes("General"));
      expect(hasGeneral).toBe(true);
    });

    test("Resolves chaotic strings with zero identified metrics to default category", async () => {
      const input = "blabla random text and stuff xyz";
      const result = await parseActivityInput(input);

      expect(result.success).toBe(true);
      expect(result.activities[0].category).toBe("other");
      expect(result.totalCO2).toBe(1.2); // standard general fallback
    });
  });

  describe("5. Caching Layer Optimization", () => {
    test("Retrieves results from cache for duplicate inputs", async () => {
      const input = "Took metro for 10km to office";
      
      // First call (runs heuristic or AI and caches result)
      const firstResult = await parseActivityInput(input);
      
      // Temporarily change environment variables to check cache usage
      process.env.GEMINI_API_KEY = "invalid-key-that-normally-would-cause-something-else";
      
      // Second call with same input should hit the cache and return identical result
      const secondResult = await parseActivityInput(input);
      
      expect(secondResult.success).toBe(firstResult.success);
      expect(secondResult.totalCO2).toBe(firstResult.totalCO2);
      expect(secondResult.activities).toEqual(firstResult.activities);
    });
  });

  describe("6. Context Generation Verification", () => {
    test("getEmissionFactorContext generates descriptive text containing standard factors", () => {
      const context = getEmissionFactorContext();
      
      expect(context).toContain("=== INDIAN EMISSION FACTORS ===");
      expect(context).toContain("Transport");
      expect(context).toContain("Food");
      expect(context).toContain("Energy");
      expect(context).toContain("Auto-rickshaw");
      expect(context).toContain("Chicken Biryani");
      expect(context).toContain("AC (1.5 ton)");
      expect(context).toContain("5.2 kg CO2/day");
    });
  });

  describe("7. Firestore Sanitization Utility", () => {
    test("sanitizeData strips undefined and null values while preserving arrays and Firestore Timestamp instances", () => {
      const mockTimestamp = Timestamp.fromDate(new Date());
      const rawData = {
        userId: "user-123",
        displayName: "John Doe",
        photoURL: undefined,
        co2Saved: null,
        createdDate: "2026-06-09",
        createdAt: mockTimestamp,
        tips: ["Tip A", "Tip B"],
        nested: {
          foo: "bar",
          baz: undefined,
          innerArray: [1, 2, 3],
          innerTimestamp: mockTimestamp
        }
      };

      const sanitized = sanitizeData(rawData);

      // Verify defined fields are preserved
      expect(sanitized.userId).toBe("user-123");
      expect(sanitized.displayName).toBe("John Doe");
      expect(sanitized.createdDate).toBe("2026-06-09");
      expect(sanitized.createdAt).toBe(mockTimestamp);
      expect(sanitized.tips).toEqual(["Tip A", "Tip B"]);

      // Verify undefined and null fields are stripped
      expect(sanitized.photoURL).toBeUndefined();
      expect(sanitized.co2Saved).toBeUndefined();

      // Verify nested objects are recursively sanitized
      expect(sanitized.nested).toBeDefined();
      const nested = sanitized.nested as Record<string, unknown>;
      expect(nested.foo).toBe("bar");
      expect(nested.baz).toBeUndefined();
      expect(nested.innerArray).toEqual([1, 2, 3]);
      expect(nested.innerTimestamp).toBe(mockTimestamp);
    });
  });
});
