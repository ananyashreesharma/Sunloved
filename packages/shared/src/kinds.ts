// What a routine step is, guessed from its name, in application order ("thinnest first").
// Used to sort typed products ("Retinol 0.3% serum") and to label rows ("TREAT · DAILY").

export type StepKind = "cleanse" | "exfoliate" | "serum" | "treat" | "moisturise" | "seal" | "sunscreen"

export const STEP_KINDS: StepKind[] = ["cleanse", "exfoliate", "serum", "treat", "moisturise", "seal", "sunscreen"]

const RULES: Array<[StepKind, RegExp]> = [
  ["sunscreen", /\b(spf|sunscreen|sun ?screen|sunblock|sun cream|uv)\b/i],
  ["cleanse", /\b(cleanser|cleansing|face ?wash|wash|micellar|cleansing balm|soap)\b/i],
  ["exfoliate", /\b(glycolic|lactic|mandelic|salicylic|aha|bha|pha|peel|peeling|exfoliat\w*|toner)\b/i],
  ["treat", /\b(retinol|retinal|tretinoin|adapalene|retinoid|benzoyl|azelaic|spot|treatment)\b/i],
  ["serum", /\b(serum|essence|ampoule|niacinamide|vitamin c|hyaluronic)\b/i],
  ["seal", /\b(oil|balm)\b/i],
  ["moisturise", /\b(moisturi[sz]er|moisturi[sz]ing|cream|lotion|gel cream|emulsion)\b/i],
]

export function stepKind(name: string): StepKind | null {
  for (const [kind, re] of RULES) if (re.test(name)) return kind
  return null
}

/** Sort key: kind order, unknown kinds last. */
export function stepKindOrder(name: string): number {
  const k = stepKind(name)
  return k ? STEP_KINDS.indexOf(k) : STEP_KINDS.length
}
