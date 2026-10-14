// What to expect from a routine step, and what to do about a flagged ingredient. Grounded in the
// adherence research behind SkinLens: people stop treatments that seem slow or sting, so each active
// says how long it takes and what's normal; and warnings work best when they say what to do next.

import type { GuestStep } from "./guest"
import type { StepKind } from "./kinds"

/** A step's active, as far as its name tells us. Order = strongest first (what to ease off first). */
export type CareKey = "retinoid" | "acid" | "benzoyl" | "azelaic" | "vitaminC" | "niacinamide" | "sunscreen" | "moisture"

export const CARE_STRENGTH: CareKey[] = ["retinoid", "acid", "benzoyl", "azelaic", "vitaminC", "niacinamide", "sunscreen", "moisture"]

const CARE_RULES: Array<[CareKey, RegExp]> = [
  ["retinoid", /\b(retinol|retinal|retinaldehyde|retinoid|tretinoin|adapalene|retinyl|granactive|hydroxypinacolone)\b/i],
  ["benzoyl", /\bbenzoyl\b/i],
  ["azelaic", /\bazelaic\b/i],
  ["acid", /\b(glycolic|lactic|mandelic|salicylic|aha|bha|pha|peel|peeling|exfoliat\w*)\b/i],
  ["vitaminC", /\b(vitamin c|vit c|ascorbic|ascorbyl)\b/i],
  ["niacinamide", /\b(niacinamide|nicotinamide)\b/i],
]

/** The active a step carries, from its name first and its kind as a fallback. Cleansers have none. */
export function stepCare(name: string, kind?: StepKind | null): CareKey | null {
  for (const [key, re] of CARE_RULES) if (re.test(name)) return key
  if (kind === "sunscreen") return "sunscreen"
  if (kind === "exfoliate") return "acid"
  if (kind === "moisturise" || kind === "seal" || /\bhyaluronic\b/i.test(name)) return "moisture"
  return null
}

/** Actives that can sting while skin gets used to them; these get "try every other night". */
export function canEase(key: CareKey | null): boolean {
  return key === "retinoid" || key === "acid" || key === "benzoyl" || key === "azelaic" || key === "vitaminC"
}

/** The daily step most likely behind irritation tonight: the strongest active that can be eased. */
export function likelyIrritant(steps: Pick<GuestStep, "id" | "name" | "kind" | "frequency">[]): { id: string; name: string } | null {
  let best: { id: string; name: string; rank: number } | null = null
  for (const s of steps) {
    const key = stepCare(s.name, s.kind)
    if (!canEase(key) || s.frequency !== "daily") continue
    const rank = CARE_STRENGTH.indexOf(key!)
    if (!best || rank < best.rank) best = { id: s.id, name: s.name, rank }
  }
  return best ? { id: best.id, name: best.name } : null
}

/**
 * One concrete next step for a caution ingredient, in the same plain English as the ingredient
 * notes. `name` is the printed and standard name together.
 */
export function cautionNextStep(name: string, isFragrance?: boolean): string {
  if (/\b(retinol|retinal|retinyl|retinoid|tretinoin|adapalene|hydroxypinacolone)\b/i.test(name))
    return "Use it at night only, wear sunscreen by day, and skip it in pregnancy."
  if (/\b(glycolic|lactic|mandelic|salicylic|gluconolactone|pyruvic|lactobionic)\b/i.test(name))
    return "Wear sunscreen by day, and don't use it on the same night as a retinoid."
  if (/\b(methylisothiazolinone|methylchloroisothiazolinone|formaldehyde|bronopol|imidazolidinyl|imidurea|dmdm|quaternium-15|iodopropynyl|ipbc)\b/i.test(name))
    return "If a product has made your skin react before, check whether it had this in it, and avoid it if so."
  if (/\b(sodium lauryl sulfate|dodecylbenzene)/i.test(name)) return "Rinse it off well. It's better in a wash than in anything you leave on."
  if (/\b(alcohol denat|denatured alcohol|sd alcohol|isopropyl alcohol)\b/i.test(name))
    return "Fine low on the list. If your skin feels tight after using it, look for a version without it."
  if (isFragrance || /\b(parfum|fragrance|limonene|linalool|citral|geraniol|eugenol|cinnamal|essential oil|aroma)\b/i.test(name))
    return "If your skin is sensitive, patch-test first or pick a fragrance-free version."
  return "Patch-test it on your inner arm for two days before using it on your face."
}
