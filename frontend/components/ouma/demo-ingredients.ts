/**
 * Landing demo: deterministic INCI lookup (no fake loading — instant parse).
 * Extend with API later; unknown tokens get no row in demo mode.
 */

export const DEMO_DEFAULT_INCI = `Aqua, Cyclopentasiloxane, Dimethicone, Butylene Glycol, 
Glycerin, Phenoxyethanol, Parfum, Methylparaben, 
Propylparaben, Formaldehyde, Retinyl Palmitate, Citric Acid`

/** Mobile mock default — "Live Analysis" card */
export const DEMO_LIVE_MOCK_INCI = `Water, Glycerin, Phenoxyethanol, Fragrance (Parfum), Methylparaben, Dimethicone, Retinol`

export type Zone = "RED" | "YELLOW" | "GREEN"

export type ParsedIngredient = {
  name: string
  zone: Zone
  /** Shown for RED in demo; educational, not medical claims */
  scaryLine: string
}

/** Normalized keys → full display + zone + copy */
const KNOWN: Record<
  string,
  { display: string; zone: Zone; scaryLine?: string }
> = {
  aqua: { display: "Aqua", zone: "GREEN" },
  cyclopentasiloxane: {
    display: "Cyclopentasiloxane",
    zone: "YELLOW",
    scaryLine: "Silicone that can trap debris on acne-prone skin in humid climates.",
  },
  dimethicone: { display: "Dimethicone", zone: "GREEN" },
  butylene: { display: "Butylene Glycol", zone: "GREEN" },
  glycol: { display: "Butylene Glycol", zone: "GREEN" },
  glycerin: { display: "Glycerin", zone: "GREEN" },
  phenoxyethanol: {
    display: "Phenoxyethanol",
    zone: "YELLOW",
    scaryLine: "Preservative — usually fine in low %; can sting broken barrier skin.",
  },
  parfum: {
    display: "Parfum (Fragrance)",
    zone: "YELLOW",
    scaryLine: "Undisclosed fragrance mix — top trigger for sensitivity and contact dermatitis.",
  },
  methylparaben: {
    display: "Methylparaben",
    zone: "RED",
    scaryLine: "Paraben class preservative — flagged by many clean lists; EU allows within strict limits.",
  },
  propylparaben: {
    display: "Propylparaben",
    zone: "RED",
    scaryLine: "Paraben preservative — some people avoid during pregnancy or sensitivity.",
  },
  formaldehyde: {
    display: "Formaldehyde",
    zone: "RED",
    scaryLine: "Formaldehyde / formaldehyde-releasers are restricted; strong sensitizer risk.",
  },
  retinyl: {
    display: "Retinyl Palmitate",
    zone: "YELLOW",
    scaryLine: "Vitamin A derivative — photosensitising; not ideal with strong daytime UV for some routines.",
  },
  palmitate: { display: "Retinyl Palmitate", zone: "YELLOW" },
  citric: { display: "Citric Acid", zone: "GREEN" },
  acid: { display: "Citric Acid", zone: "GREEN" },
}

function normToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
}

function matchKnown(token: string): ParsedIngredient | null {
  const n = normToken(token)
  if (!n) return null

  const direct: Record<string, keyof typeof KNOWN> = {
    aqua: "aqua",
    cyclopentasiloxane: "cyclopentasiloxane",
    dimethicone: "dimethicone",
    "butylene glycol": "butylene",
    glycerin: "glycerin",
    phenoxyethanol: "phenoxyethanol",
    parfum: "parfum",
    fragrance: "parfum",
    methylparaben: "methylparaben",
    propylparaben: "propylparaben",
    formaldehyde: "formaldehyde",
    "retinyl palmitate": "retinyl",
    "citric acid": "citric",
  }

  const key = direct[n]
  if (key && KNOWN[key]) {
    const k = KNOWN[key]!
    return {
      name: k.display,
      zone: k.zone,
      scaryLine: k.scaryLine ?? "",
    }
  }

  if (n.includes("methylparaben")) return { name: "Methylparaben", zone: "RED", scaryLine: KNOWN.methylparaben.scaryLine! }
  if (n.includes("propylparaben")) return { name: "Propylparaben", zone: "RED", scaryLine: KNOWN.propylparaben.scaryLine! }
  if (n.includes("formaldehyde")) return { name: "Formaldehyde", zone: "RED", scaryLine: KNOWN.formaldehyde.scaryLine! }
  if (n.includes("parfum") || n.includes("fragrance"))
    return { name: "Parfum (Fragrance)", zone: "YELLOW", scaryLine: KNOWN.parfum.scaryLine! }
  if (n.includes("retinyl")) return { name: "Retinyl Palmitate", zone: "YELLOW", scaryLine: KNOWN.retinyl.scaryLine! }
  if (n.includes("retinol"))
    return {
      name: "Retinol",
      zone: "YELLOW",
      scaryLine: "Vitamin A active — powerful but increases sun sensitivity; spacing with acids matters.",
    }
  if (n.includes("phenoxyethanol"))
    return { name: "Phenoxyethanol", zone: "YELLOW", scaryLine: KNOWN.phenoxyethanol.scaryLine! }
  if (n.includes("cyclopentasiloxane"))
    return { name: "Cyclopentasiloxane", zone: "YELLOW", scaryLine: KNOWN.cyclopentasiloxane.scaryLine! }
  if (n.includes("dimethicone")) return { name: "Dimethicone", zone: "GREEN", scaryLine: "" }
  if (n.includes("butylene") && n.includes("glycol")) return { name: "Butylene Glycol", zone: "GREEN", scaryLine: "" }
  if (n.includes("glycerin")) return { name: "Glycerin", zone: "GREEN", scaryLine: "" }
  if (n.includes("citric")) return { name: "Citric Acid", zone: "GREEN", scaryLine: "" }
  if (n === "water") return { name: "Water", zone: "GREEN", scaryLine: "" }
  if (n === "aqua") return { name: "Aqua", zone: "GREEN", scaryLine: "" }

  return null
}

export type DemoAnalysis = {
  ingredients: ParsedIngredient[]
  red: ParsedIngredient[]
  yellow: number
  green: number
  /** Ingredients we couldn't classify in demo KB */
  unknownCount: number
}

export function analyzeDemoInci(text: string): DemoAnalysis {
  const parts = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
  if (parts.length < 3) {
    return { ingredients: [], red: [], yellow: 0, green: 0, unknownCount: parts.length }
  }

  const seen = new Set<string>()
  const ingredients: ParsedIngredient[] = []
  let unknownCount = 0

  for (const p of parts) {
    const row = matchKnown(p)
    if (!row) {
      unknownCount++
      continue
    }
    const dedupe = row.name.toLowerCase()
    if (seen.has(dedupe)) continue
    seen.add(dedupe)
    ingredients.push(row)
  }

  const red = ingredients.filter((i) => i.zone === "RED")
  const yellow = ingredients.filter((i) => i.zone === "YELLOW").length
  const green = ingredients.filter((i) => i.zone === "GREEN").length

  return { ingredients, red, yellow, green, unknownCount }
}
