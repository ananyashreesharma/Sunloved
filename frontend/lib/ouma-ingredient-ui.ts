import type { DemoAnalysis, ParsedIngredient, Zone } from "@/components/ouma/demo-ingredients"
import type { AnalyzeIngredientsResponse, ProductDetail } from "@/lib/api"

function toZoneFromFound(ing: AnalyzeIngredientsResponse["foundIngredients"][number]): Zone {
  const z = (ing.zone || "").toLowerCase()
  if (z === "red") return "RED"
  if (z === "yellow") return "YELLOW"
  if (z === "green") return "GREEN"
  if (ing.safetyRating === "avoid") return "RED"
  if (ing.safetyRating === "caution") return "YELLOW"
  if (ing.isParaben) return "RED"
  if (ing.isFragrance || ing.isIrritant) return "YELLOW"
  return "GREEN"
}

/** Maps POST /ingredients/analyze → Live Analysis card shape */
export function mapApiAnalysisToDemo(api: AnalyzeIngredientsResponse): DemoAnalysis {
  const ingredients: ParsedIngredient[] = []
  for (const fi of api.foundIngredients) {
    const zone = toZoneFromFound(fi)
    ingredients.push({
      name: fi.name,
      zone,
      scaryLine:
        fi.shortDescription ||
        fi.function ||
        "Listed in the Ouma ingredient reference.",
    })
  }
  for (const u of api.unknownIngredients) {
    ingredients.push({
      name: u,
      zone: "YELLOW",
      scaryLine: "Not yet in our database — confirm on your product packaging.",
    })
  }
  const red = ingredients.filter((i) => i.zone === "RED")
  const yellow = ingredients.filter((i) => i.zone === "YELLOW").length
  const green = ingredients.filter((i) => i.zone === "GREEN").length
  return {
    ingredients,
    red,
    yellow,
    green,
    unknownCount: api.unknownIngredients.length,
  }
}

function zoneFromRow(r: NonNullable<ProductDetail["ingredientRows"]>[number]): Zone {
  const z = (r.zone || "").toLowerCase()
  if (z === "red") return "RED"
  if (z === "yellow") return "YELLOW"
  if (z === "green") return "GREEN"
  if (r.safetyRating === "avoid") return "RED"
  if (r.safetyRating === "caution") return "YELLOW"
  if (r.isParaben) return "RED"
  if (r.isFragrance) return "YELLOW"
  return "GREEN"
}

export type IngredientBreakdown = {
  high: number
  med: number
  safe: number
  score: number
  warnings: Array<{ name: string; tag: string; body: string }>
}

/** Derive score + pill counts + top warnings from catalog ingredient rows */
export function breakdownFromProduct(p: ProductDetail): IngredientBreakdown {
  const rows = p.ingredientRows
  if (!rows?.length) {
    const s = p.overallScore != null ? Math.round(Number(p.overallScore)) : 55
    return { high: 0, med: 0, safe: 0, score: s, warnings: [] }
  }
  let high = 0
  let med = 0
  let safe = 0
  const warn: IngredientBreakdown["warnings"] = []
  for (const r of rows) {
    const z = zoneFromRow(r)
    if (z === "RED") high++
    else if (z === "YELLOW") med++
    else safe++
    if (warn.length < 4 && (z === "RED" || r.isParaben || r.isFragrance)) {
      warn.push({
        name: r.inciName,
        tag: r.isFragrance ? "Fragrance" : r.isParaben ? "Paraben" : "Flagged",
        body:
          r.shortDescription ||
          (z === "RED"
            ? "Flagged in our reference — review if you have sensitivities."
            : "Use caution depending on your skin barrier and routine."),
      })
    }
  }
  const total = rows.length
  const raw = 100 - ((high * 28 + med * 12) / Math.max(total, 1)) * 2.2
  const score =
    p.overallScore != null
      ? Math.round(Number(p.overallScore))
      : Math.max(18, Math.min(96, Math.round(raw)))
  return { high, med, safe, score, warnings: warn.slice(0, 3) }
}

/** Same shape as `breakdownFromProduct`, for INCI-only analysis results */
export function breakdownFromAnalyze(api: AnalyzeIngredientsResponse): IngredientBreakdown {
  const demo = mapApiAnalysisToDemo(api)
  const high = demo.red.length
  const med = demo.yellow
  const safe = demo.green
  const total = high + med + safe
  const raw = 100 - ((high * 28 + med * 12) / Math.max(total, 1)) * 2.2
  const score = Math.max(18, Math.min(96, Math.round(raw)))
  const warnings: IngredientBreakdown["warnings"] = []
  for (const ing of demo.red.slice(0, 4)) {
    warnings.push({
      name: ing.name,
      tag: "High risk",
      body: ing.scaryLine,
    })
  }
  for (const ing of demo.ingredients.filter((i) => i.zone === "YELLOW")) {
    if (warnings.length >= 3) break
    warnings.push({
      name: ing.name,
      tag: "Caution",
      body: ing.scaryLine,
    })
  }
  return { high, med, safe, score, warnings: warnings.slice(0, 3) }
}
