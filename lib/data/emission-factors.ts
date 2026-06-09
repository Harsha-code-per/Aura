// ---------------------------------------------------------------------------
// Indian Emission Factor Constants
// Based on India GHG Program, Bureau of Energy Efficiency, and IPCC defaults
// ---------------------------------------------------------------------------

export const TRANSPORT_FACTORS = {
  autoRickshaw: { factor: 0.08, unit: "kg CO2/km", label: "Auto-rickshaw" },
  cityBus: {
    factor: 0.03,
    unit: "kg CO2/km",
    label: "City Bus (MTC/DTC/BEST)",
  },
  metro: { factor: 0.04, unit: "kg CO2/km", label: "Metro Rail" },
  localTrain: {
    factor: 0.014,
    unit: "kg CO2/km",
    label: "Local/Suburban Train",
  },
  indianRailways: {
    factor: 0.014,
    unit: "kg CO2/km",
    label: "Indian Railways (AC)",
  },
  twoWheeler: {
    factor: 0.05,
    unit: "kg CO2/km",
    label: "Two-wheeler (Bike/Scooter)",
  },
  carPetrol: { factor: 0.15, unit: "kg CO2/km", label: "Car (Petrol)" },
  carDiesel: { factor: 0.17, unit: "kg CO2/km", label: "Car (Diesel)" },
  carEV: { factor: 0.05, unit: "kg CO2/km", label: "Electric Car" },
  cab: { factor: 0.15, unit: "kg CO2/km", label: "Cab/Taxi (Ola/Uber)" },
  flight: { factor: 0.255, unit: "kg CO2/km", label: "Domestic Flight" },
  walking: { factor: 0, unit: "kg CO2/km", label: "Walking" },
  cycling: { factor: 0, unit: "kg CO2/km", label: "Cycling" },
} as const;

export const FOOD_FACTORS = {
  chickenBiryani: {
    factor: 3.2,
    unit: "kg CO2e/serving",
    label: "Chicken Biryani",
  },
  muttonBiryani: {
    factor: 5.5,
    unit: "kg CO2e/serving",
    label: "Mutton Biryani",
  },
  vegBiryani: { factor: 0.9, unit: "kg CO2e/serving", label: "Veg Biryani" },
  paneerDish: { factor: 1.5, unit: "kg CO2e/serving", label: "Paneer Dish" },
  dalRice: { factor: 0.5, unit: "kg CO2e/serving", label: "Dal Rice" },
  vegThali: {
    factor: 0.8,
    unit: "kg CO2e/serving",
    label: "Vegetarian Thali",
  },
  nonVegThali: {
    factor: 2.5,
    unit: "kg CO2e/serving",
    label: "Non-Veg Thali",
  },
  dosa: { factor: 0.4, unit: "kg CO2e/serving", label: "Dosa/Idli" },
  rotiSabzi: {
    factor: 0.6,
    unit: "kg CO2e/serving",
    label: "Roti + Sabzi",
  },
  chai: { factor: 0.1, unit: "kg CO2e/cup", label: "Chai (Milk Tea)" },
  coffee: { factor: 0.15, unit: "kg CO2e/cup", label: "Coffee" },
  lassi: { factor: 0.3, unit: "kg CO2e/glass", label: "Lassi" },
} as const;

export const ENERGY_FACTORS = {
  electricity: {
    factor: 0.82,
    unit: "kg CO2/kWh",
    label: "Grid Electricity (India avg)",
  },
  lpg: { factor: 2.98, unit: "kg CO2/kg", label: "LPG Cooking Gas" },
  acUsage: { factor: 1.5, unit: "kg CO2/hour", label: "AC (1.5 ton)" },
} as const;

export const INDIA_CONTEXT = {
  avgAnnualPerCapita: 1.9, // tonnes CO2 per year
  avgDailyPerCapita: 5.2, // kg CO2 per day
  globalAvg: 4.7, // tonnes CO2 per year
} as const;

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------
export type TransportKey = keyof typeof TRANSPORT_FACTORS;
export type FoodKey = keyof typeof FOOD_FACTORS;
export type EnergyKey = keyof typeof ENERGY_FACTORS;

// ---------------------------------------------------------------------------
// LLM prompt context builder
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable, formatted string of all Indian emission factors.
 * Designed to be injected into an LLM system prompt so the model can accurately
 * calculate CO2 emissions from natural-language activity descriptions.
 */
export function getEmissionFactorContext(): string {
  const lines: string[] = [];

  lines.push("=== INDIAN EMISSION FACTORS ===");
  lines.push("");

  lines.push("## Transport (per km)");
  for (const [, v] of Object.entries(TRANSPORT_FACTORS)) {
    lines.push(`- ${v.label}: ${v.factor} ${v.unit}`);
  }
  lines.push("");

  lines.push("## Food (per serving/cup/glass)");
  for (const [, v] of Object.entries(FOOD_FACTORS)) {
    lines.push(`- ${v.label}: ${v.factor} ${v.unit}`);
  }
  lines.push("");

  lines.push("## Energy");
  for (const [, v] of Object.entries(ENERGY_FACTORS)) {
    lines.push(`- ${v.label}: ${v.factor} ${v.unit}`);
  }
  lines.push("");

  lines.push("## India Context");
  lines.push(
    `- Average annual per-capita emissions: ${INDIA_CONTEXT.avgAnnualPerCapita} tonnes CO2/year`
  );
  lines.push(
    `- Average daily per-capita emissions: ${INDIA_CONTEXT.avgDailyPerCapita} kg CO2/day`
  );
  lines.push(
    `- Global average annual per-capita: ${INDIA_CONTEXT.globalAvg} tonnes CO2/year`
  );

  return lines.join("\n");
}
