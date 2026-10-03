// What onboarding asks about the user's skin. Codes are what the backend stores.

export const SKIN_TYPES = [
  { code: "oily", label: "Oily" },
  { code: "dry", label: "Dry" },
  { code: "combination", label: "Combination" },
  { code: "normal", label: "Normal" },
  { code: "unsure", label: "Not sure" },
] as const

/** Sensitivity is a concern, not a skin type: oily or dry skin can be sensitive too. */
export const CONCERNS = [
  { code: "acne", label: "Acne" },
  { code: "pigmentation", label: "Dark spots" },
  { code: "sensitivity", label: "Sensitivity" },
  { code: "dryness", label: "Dryness" },
  { code: "redness", label: "Redness" },
  { code: "aging", label: "Fine lines" },
  { code: "pores", label: "Large pores" },
] as const

/** Codes earlier app versions offered. Still stored for older profiles, so still understood. */
export const LEGACY_SKIN_TYPES = ["sensitive"] as const
export const LEGACY_CONCERNS = ["texture", "dullness"] as const

/** Two keeps summaries specific. */
export const MAX_CONCERNS = 2

export type SkinTypeCode = (typeof SKIN_TYPES)[number]["code"]
export type ConcernCode = (typeof CONCERNS)[number]["code"]

export const SKIN_TYPE_LABELS: Record<string, string> = Object.fromEntries(SKIN_TYPES.map((s) => [s.code, s.label]))
export const CONCERN_LABELS: Record<string, string> = Object.fromEntries(CONCERNS.map((c) => [c.code, c.label]))
