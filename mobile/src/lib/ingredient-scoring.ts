// Port of frontend/lib/ouma-ingredient-ui.ts's breakdownFromAnalyze() + frontend/lib/
// ouma-recent-scans.ts's riskFromScore() — the scoring logic that turns a raw
// AnalyzeIngredientsResponse into the zone/score/warnings shape the result screen renders.

import type { AnalyzeIngredientsResponse } from "./api-client"

export type Zone = "RED" | "YELLOW" | "GREEN"

export type IngredientRow = { name: string; zone: Zone; note: string }

export type IngredientBreakdown = {
  high: number
  med: number
  safe: number
  score: number
  warnings: Array<{ name: string; tag: string; body: string }>
}

function zoneFromFound(fi: AnalyzeIngredientsResponse["foundIngredients"][number]): Zone {
  const z = (fi.zone || "").toLowerCase()
  if (z === "red") return "RED"
  if (z === "yellow") return "YELLOW"
  if (z === "green") return "GREEN"
  if (fi.safetyRating === "avoid") return "RED"
  if (fi.safetyRating === "caution") return "YELLOW"
  if (fi.isParaben) return "RED"
  if (fi.isFragrance || fi.isIrritant) return "YELLOW"
  return "GREEN"
}

export function rowsFromAnalyze(api: AnalyzeIngredientsResponse): IngredientRow[] {
  return [
    ...api.foundIngredients.map((fi) => ({
      name: fi.name,
      zone: zoneFromFound(fi),
      note: fi.shortDescription || fi.function || "In our ingredient reference.",
    })),
    ...api.unknownIngredients.map((u) => ({
      name: u,
      zone: "YELLOW" as Zone,
      note: "Not yet in our database — verify on the product pack.",
    })),
  ]
}

export function breakdownFromAnalyze(api: AnalyzeIngredientsResponse): IngredientBreakdown {
  const rows = rowsFromAnalyze(api)
  // Unknown ingredients count toward "no info", not toward the red/yellow/green split used for scoring.
  const known = rows.filter((r) => !api.unknownIngredients.includes(r.name))
  const high = known.filter((r) => r.zone === "RED").length
  const med = known.filter((r) => r.zone === "YELLOW").length
  const safe = known.filter((r) => r.zone === "GREEN").length
  const total = high + med + safe
  const raw = 100 - ((high * 28 + med * 12) / Math.max(total, 1)) * 2.2
  const score = Math.max(18, Math.min(96, Math.round(raw)))

  const warnings: IngredientBreakdown["warnings"] = []
  for (const r of known.filter((r) => r.zone === "RED").slice(0, 4)) {
    warnings.push({ name: r.name, tag: "High risk", body: r.note })
  }
  for (const r of known.filter((r) => r.zone === "YELLOW")) {
    if (warnings.length >= 3) break
    warnings.push({ name: r.name, tag: "Caution", body: r.note })
  }
  return { high, med, safe, score, warnings: warnings.slice(0, 3) }
}

export function riskFromScore(score: number): "HIGH RISK" | "CAUTION" | "SAFE" {
  if (score < 45) return "HIGH RISK"
  if (score < 70) return "CAUTION"
  return "SAFE"
}
