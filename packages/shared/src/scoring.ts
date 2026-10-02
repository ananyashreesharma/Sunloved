// The one implementation of "how risky is this ingredient list". Web and mobile used to carry
// their own copies, which drifted: web counted unrecognised ingredients as "caution" in the score,
// mobile left them out, so the same label scored differently on each platform.

import type { AnalyzeIngredientsResponse, ProductDetail } from "./types"

export type Zone = "RED" | "YELLOW" | "GREEN"
/** NONE = not in our database. Never styled or scored as safe. */
export type RowZone = Zone | "NONE"

/** Below this share of ingredients recognised, no verdict is shown at all. */
export const COVERAGE_THRESHOLD = 0.7

export const NOTE_IN_REFERENCE = "In our ingredient reference."
export const NOTE_UNKNOWN = "Not yet in our database — verify on the product pack."
const NOTE_PARABEN = "Paraben — consider avoiding for daily leave-on use."
const NOTE_FRAGRANCE = "Fragrance — can trigger irritation for sensitive skin."

export type IngredientRow = { name: string; zone: RowZone; note: string }

export type IngredientBreakdown = {
  high: number
  med: number
  safe: number
  /** Ingredients we couldn't identify; excluded from the score. */
  unknown: number
  /** 18–96, higher is safer. Meaningless when verdictFor() returns null. */
  score: number
  /** Share of ingredients recognised, 0–1. */
  coverage: number
  warnings: Array<{ name: string; tag: string; body: string }>
}

type ZoneSource = {
  zone?: string | null
  safetyRating?: string | null
  isParaben?: boolean
  isFragrance?: boolean
  isIrritant?: boolean
}

/**
 * Zone for an ingredient row. NONE when the database has the name but no rating for it — that is
 * "no info", never "fine". (Treating unrated as green made unrated fragrance read as safe.)
 */
export function zoneOf(src: ZoneSource): RowZone {
  const z = (src.zone || "").toLowerCase()
  if (z === "red") return "RED"
  if (z === "yellow") return "YELLOW"
  if (z === "green") return "GREEN"
  const rating = (src.safetyRating || "").toLowerCase()
  if (rating === "avoid") return "RED"
  if (rating === "caution") return "YELLOW"
  if (src.isParaben) return "RED"
  if (src.isFragrance || src.isIrritant) return "YELLOW"
  return "NONE"
}

export function rowsFromAnalyze(api: AnalyzeIngredientsResponse): IngredientRow[] {
  return [
    ...api.foundIngredients.map((fi) => ({
      name: fi.name,
      zone: zoneOf(fi),
      note: fi.shortDescription || fi.function || NOTE_IN_REFERENCE,
    })),
    ...api.unknownIngredients.map((name) => ({ name, zone: "NONE" as RowZone, note: NOTE_UNKNOWN })),
  ]
}

export function rowsFromProduct(p: ProductDetail): IngredientRow[] {
  return (p.ingredientRows ?? []).map((r) => ({
    name: r.displayName?.trim() || r.inciName,
    zone: zoneOf(r),
    note:
      r.shortDescription ||
      (r.isParaben ? NOTE_PARABEN : r.isFragrance ? NOTE_FRAGRANCE : NOTE_IN_REFERENCE),
  }))
}

/**
 * Score + counts + top warnings for any list of rows. Coverage counts only ingredients we could
 * actually rate; `coverage` (e.g. the backend's name-match rate) can only lower it, never raise it.
 */
export function breakdownFromRows(rows: IngredientRow[], coverage = 1): IngredientBreakdown {
  const high = rows.filter((r) => r.zone === "RED").length
  const med = rows.filter((r) => r.zone === "YELLOW").length
  const safe = rows.filter((r) => r.zone === "GREEN").length
  const unknown = rows.filter((r) => r.zone === "NONE").length
  const known = high + med + safe
  const raw = 100 - ((high * 28 + med * 12) / Math.max(known, 1)) * 2.2
  // One avoid-level ingredient is enough to avoid the product — averaging let a single
  // hydroquinone among five harmless ingredients score 81 ("looks fine").
  const score = capForRed(Math.max(18, Math.min(96, Math.round(raw))), high)

  const warnings: IngredientBreakdown["warnings"] = []
  for (const r of rows) {
    if (warnings.length >= 3) break
    if (r.zone === "RED") warnings.push({ name: r.name, tag: "High risk", body: r.note })
  }
  for (const r of rows) {
    if (warnings.length >= 3) break
    if (r.zone === "YELLOW") warnings.push({ name: r.name, tag: "Caution", body: r.note })
  }
  const rated = rows.length > 0 ? known / rows.length : 0
  return { high, med, safe, unknown, score, coverage: Math.min(coverage, rated), warnings }
}

/** Highest score a product with an avoid-level ingredient can get (inside the HIGH RISK band). */
const RED_SCORE_CAP = 40

function capForRed(score: number, high: number): number {
  return high > 0 ? Math.min(score, RED_SCORE_CAP) : score
}

export function breakdownFromAnalyze(api: AnalyzeIngredientsResponse): IngredientBreakdown {
  return breakdownFromRows(rowsFromAnalyze(api), api.coverage)
}

/**
 * A catalogue product with no ingredient list has coverage 0, so verdictFor() refuses it —
 * it used to get a made-up mid score of 55 ("use with care").
 */
export function breakdownFromProduct(p: ProductDetail): IngredientBreakdown {
  const rows = rowsFromProduct(p)
  const bd = breakdownFromRows(rows)
  if (rows.length > 0 && p.overallScore != null) bd.score = capForRed(Math.round(Number(p.overallScore)), bd.high)
  return bd
}

export type Risk = "HIGH RISK" | "CAUTION" | "SAFE"

export function riskFromScore(score: number): Risk {
  if (score < 45) return "HIGH RISK"
  if (score < 70) return "CAUTION"
  return "SAFE"
}

export function zoneFromRisk(risk: Risk): Zone {
  return risk === "HIGH RISK" ? "RED" : risk === "CAUTION" ? "YELLOW" : "GREEN"
}

/** "Looks fine" needs at least this share of the label rated; between 70% and this, it's "caution". */
export const FINE_COVERAGE = 0.9

/**
 * The verdict to show, or null when we must not show one: nothing analysed yet, or too little of
 * the label rated. Callers render the "can't judge yet" state for null — never a default.
 *
 * Unrated ingredients are never called fine individually (they show as "No information"), and the
 * result text must name them. A label that is only 70–90% rated can't be "looks fine" overall: too
 * much of it is unknown to vouch for.
 */
export function verdictFor(bd: IngredientBreakdown): Zone | null {
  if (bd.high + bd.med + bd.safe === 0) return null
  if (bd.coverage < COVERAGE_THRESHOLD) return null
  const zone = zoneFromRisk(riskFromScore(bd.score))
  return zone === "GREEN" && bd.coverage < FINE_COVERAGE ? "YELLOW" : zone
}

/** Flagged rows worst-first (avoid before caution), label order within each. */
export function flaggedRows(rows: IngredientRow[]): IngredientRow[] {
  return [...rows.filter((r) => r.zone === "RED"), ...rows.filter((r) => r.zone === "YELLOW")]
}

export const EMPTY_BREAKDOWN: IngredientBreakdown = {
  high: 0,
  med: 0,
  safe: 0,
  unknown: 0,
  score: 0,
  coverage: 0,
  warnings: [],
}
