// The annotated label: every ingredient in the order printed on the pack, marked with its state,
// flagged and no-information items numbered, plus the verdict and a plain-language summary. This
// is what the V3 result screen (and the web checker) render.

import type { AnalyzeIngredientsResponse } from "./types"
import { breakdownFromRows, NOTE_IN_REFERENCE, verdictFor, zoneOf, type IngredientRow, type Zone } from "./scoring"
import { personalFlag, type IngredientOverride, type SkinProfile } from "./personal"
import { cautionNextStep } from "./care"

export type ItemState = "fine" | "caution" | "avoid" | "nfy" | "none"

export type LabelItem = {
  name: string
  state: ItemState
  /** One-line explanation for this person (what the sheet and margin note show). */
  line: string
  /** One-line explanation in general, when it differs from `line` (e.g. "not for you" items). */
  general?: string
  /** Where the rating comes from ("EU cosmetics rules (CosIng): …", "Checked by hand…"). */
  source?: string
  /** Footnote number for flagged and no-information items, in the order the notes list them. */
  num?: number
  /** For a caution or "not for you" item: one concrete thing to do about it. */
  next?: string
  /** The standard name, lower case: what a person's "fine for me" / "I react to this" is stored under. */
  key?: string
  /** What this person told us about this ingredient, when they did. */
  mine?: IngredientOverride
  /** Regulators that ban it outright in cosmetics, whatever the reader's country. */
  bannedIn?: string[]
}

export type AnnotatedLabel = {
  items: LabelItem[]
  /** Flagged items for the margin, worst first: avoid, not for you, caution. */
  flagged: LabelItem[]
  noData: LabelItem[]
  rated: number
  total: number
  coverage: number
  /** 0–100, same scale as everywhere else (saved checks keep it). */
  score: number
  /** null = "We can't judge this one yet". */
  verdict: Zone | null
  summary: string
  /**
   * The label contains a drug or toxic substance that turns up in illegal skin-lightening creams
   * (steroids, hydroquinone, mercury, lead, monobenzone). The apps then show what to do next.
   */
  lighteningHazard: boolean
}

// Prescription drugs and toxic metals found in illegal "fairness" and lightening creams.
const LIGHTENING_HAZARD = /hydroquinone|monobenz|merc(ur|ury)|calomel|\blead\b|clobetasol|betamethasone|mometasone|fluocinolone|hydrocortisone|dexamethasone|triamcinolone|beclomethasone|halobetasol|fluticasone|tretinoin/i

const NO_DATA_LINE = "We have no data on this one, so we're not calling it fine."
const MINE_REACT = "You told us your skin reacts to this."
const MINE_FINE = "You marked this as fine for you."
const SEVERITY: Record<ItemState, number> = { avoid: 0, nfy: 1, caution: 2, none: 3, fine: 4 }

function norm(s: string) {
  return s.trim().toLowerCase()
}

export function annotateLabel(api: AnalyzeIngredientsResponse, profile?: SkinProfile | null): AnnotatedLabel {
  const found = new Map(api.foundIngredients.map((f) => [norm(f.name), f]))
  const unknown = new Set(api.unknownIngredients.map(norm))
  const order = api.parsed.length ? api.parsed : [...api.foundIngredients.map((f) => f.name), ...api.unknownIngredients]

  const items: LabelItem[] = order.map((raw) => withBans(raw))

  function withBans(raw: string): LabelItem {
    const item = itemFor(raw)
    const f = found.get(norm(raw))
    return f?.bannedIn?.length && item.state !== "none" ? { ...item, bannedIn: f.bannedIn } : item
  }

  function itemFor(raw: string): LabelItem {
    const f = found.get(norm(raw))
    if (!f || unknown.has(norm(raw))) return { name: raw, state: "none", line: NO_DATA_LINE, num: 0 }
    const general = f.shortDescription || f.function || NOTE_IN_REFERENCE
    const zone = zoneOf(f)
    if (zone === "NONE") return { name: f.name, state: "none", line: NO_DATA_LINE, num: 0 }
    const source = f.source
    const both = `${f.name} ${f.scientificName ?? ""}`
    const key = norm(f.scientificName || f.name)
    const mine = profile?.overrides?.[key] ?? profile?.overrides?.[norm(f.name)]
    // Avoid stays avoid whatever anyone marks: these are bans and drugs, not preferences.
    if (zone === "RED") return { name: f.name, state: "avoid", line: general, num: 0, source, key }
    // What the person told us about their own skin comes first: people trust a reading they can correct.
    if (mine === "react") return { name: f.name, state: "nfy", line: MINE_REACT, general, num: 0, source, key, mine, next: "Leave out products that list it." }
    if (mine === "fine") return { name: f.name, state: "fine", line: MINE_FINE, general, source, key, mine }
    // Match on the printed name and the standard one ("Fragancia" is Parfum).
    const personal = personalFlag(both, profile)
    if (personal) return { name: f.name, state: "nfy", line: personal.reason, general, num: 0, source, key, next: cautionNextStep(both, f.isFragrance) }
    if (zone === "YELLOW") return { name: f.name, state: "caution", line: general, num: 0, source, key, next: cautionNextStep(both, f.isFragrance) }
    return { name: f.name, state: "fine", line: general, source, key }
  }

  // Same scoring as everywhere else; "not for you" weighs like caution.
  const rows: IngredientRow[] = items.map((it) => ({
    name: it.name,
    zone: it.state === "avoid" ? "RED" : it.state === "caution" || it.state === "nfy" ? "YELLOW" : it.state === "fine" ? "GREEN" : "NONE",
    note: it.line,
  }))
  const bd = breakdownFromRows(rows, api.coverage)
  const verdict = refineVerdict(verdictFor(bd), items)

  const flagged = items.filter((i) => i.state === "avoid" || i.state === "nfy" || i.state === "caution").sort((a, b) => SEVERITY[a.state] - SEVERITY[b.state])
  const noData = items.filter((i) => i.state === "none")
  const rated = items.length - noData.length
  // Footnotes follow the order the notes are read in (worst first, then no information), so the
  // list counts 1, 2, 3; the marks on the label point back to the same numbers.
  ;[...flagged, ...noData].forEach((it, i) => (it.num = i + 1))

  const lighteningHazard = items.some((i) => i.state === "avoid" && LIGHTENING_HAZARD.test(`${i.name} ${api.foundIngredients.find((f) => f.name === i.name)?.scientificName ?? ""}`))
  return {
    items,
    flagged,
    noData,
    rated,
    total: items.length,
    coverage: bd.coverage,
    score: bd.score,
    verdict,
    summary: summarize(verdict, flagged, noData, items),
    lighteningHazard,
  }
}

/**
 * The average-based score is too forgiving about what kind of flags a label has. "Looks fine" also
 * needs: nothing "not for you", and at most one caution ingredient, which must sit in the bottom two
 * thirds of the label (ingredients are listed by concentration).
 */
function refineVerdict(verdict: Zone | null, items: LabelItem[]): Zone | null {
  if (verdict !== "GREEN") return verdict
  if (items.some((i) => i.state === "nfy")) return "YELLOW"
  const top = Math.ceil(items.length / 3)
  const cautions = items.map((it, i) => ({ it, i })).filter(({ it }) => it.state === "caution")
  if (cautions.length >= 2 || cautions.some(({ i }) => i < top)) return "YELLOW"
  return verdict
}

function firstSentence(s: string) {
  const m = s.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : s).trim()
}

function lower(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/** A note's short "Fragrance: …" category tag repeats the name in a summary line; drop it. */
function withoutName(line: string) {
  const m = line.match(/^([^:.]{1,30}):\s+/)
  return m ? line.slice(m[0].length) : line
}

/** Plain-language paragraph under the verdict. Built only from what we know about this label. */
function summarize(verdict: Zone | null, flagged: LabelItem[], noData: LabelItem[], items: LabelItem[]): string {
  if (!verdict) return ""
  const parts: string[] = []
  const worst = flagged[0]
  if (verdict === "RED" && worst) {
    // The whole note, not just its first sentence: the reason to avoid it is the point.
    parts.push(`It contains ${worst.name}. ${worst.line}`)
  } else if (flagged.length === 0) {
    parts.push("Nothing here stands out for your skin.")
  } else {
    parts.push(flagged.length === 1 ? "Most of this is gentle." : "Mostly gentle, with a few things to know.")
    for (const f of flagged.slice(0, 2)) parts.push(`${f.name}: ${lower(firstSentence(withoutName(f.line)))}`)
  }
  if (noData.length === 1) parts.push("We have no data on one ingredient, so we can't vouch for it.")
  else if (noData.length > 1) parts.push(`We have no data on ${noData.length} ingredients, so we can't vouch for them.`)
  if (verdict !== "RED" && items.length > 0 && flagged.some((f) => f.state === "caution" || f.state === "nfy")) parts.push("Patch-test first.")
  return parts.join(" ")
}
