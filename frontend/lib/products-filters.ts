export const PRICE_RANGES = [
  { label: "< $10", min: 0, max: 10 },
  { label: "$10 - $25", min: 10, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50+", min: 50, max: Infinity },
] as const

export const CATEGORY_MAP: Record<string, string> = {
  Serums: "Serum",
  "Face Cleansers": "Cleanser",
  Toners: "Toner",
  Moisturizers: "Moisturizer",
  Sunscreens: "Sunscreen",
  Exfoliators: "Exfoliator",
  Masks: "Mask",
}

export function normalizeCategoryForApi(headerCategory: string): string {
  return CATEGORY_MAP[headerCategory] || headerCategory
}
