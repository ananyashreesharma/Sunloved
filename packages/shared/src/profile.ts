// What onboarding asks about the user's skin. Codes are what the backend stores.

export const SKIN_TYPES = [
  { code: "oily", label: "Oily" },
  { code: "dry", label: "Dry" },
  { code: "combination", label: "Combination" },
  { code: "sensitive", label: "Sensitive" },
] as const

export const CONCERNS = [
  { code: "acne", label: "Acne" },
  { code: "pigmentation", label: "Pigmentation" },
  { code: "redness", label: "Redness" },
  { code: "texture", label: "Texture" },
  { code: "dullness", label: "Dullness" },
] as const

/** Two keeps summaries specific. */
export const MAX_CONCERNS = 2

export type SkinTypeCode = (typeof SKIN_TYPES)[number]["code"]
export type ConcernCode = (typeof CONCERNS)[number]["code"]

export const SKIN_TYPE_LABELS: Record<string, string> = Object.fromEntries(SKIN_TYPES.map((s) => [s.code, s.label]))
export const CONCERN_LABELS: Record<string, string> = Object.fromEntries(CONCERNS.map((c) => [c.code, c.label]))
