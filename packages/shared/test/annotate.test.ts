import { annotateLabel } from "../src/annotate"
import type { AnalyzeIngredientsResponse } from "../src/types"

const label = (zones: Record<string, string>): AnalyzeIngredientsResponse => ({
  input: Object.keys(zones).join(", "),
  parsed: Object.keys(zones),
  foundIngredients: Object.entries(zones).map(([name, zone]) => ({ name, zone, found: true }) as never),
  unknownIngredients: [],
  summary: "",
  tags: [],
  actives: [],
  coverage: 1,
})

describe("annotateLabel summary", () => {
  // Regression: a label where everything was flagged opened with "Mostly gentle".
  it("doesn't call an all-flagged label gentle", () => {
    const s = annotateLabel(label({ Parfum: "yellow", "Alcohol Denat": "yellow" })).summary
    expect(s).not.toMatch(/gentle/i)
  })
  it("calls a mostly safe label mostly gentle", () => {
    const s = annotateLabel(label({ Aqua: "green", Glycerin: "green", Panthenol: "green", Parfum: "yellow" })).summary
    expect(s).toMatch(/^Most of this is gentle/)
  })
})

describe("life stage (pregnant, breastfeeding, child)", () => {
  const states = (zones: Record<string, string>, profile: Parameters<typeof annotateLabel>[1]) =>
    Object.fromEntries(annotateLabel(label(zones), profile).items.map((i) => [i.name, i.state]))

  it("flags retinoids in pregnancy and while breastfeeding", () => {
    for (const lifeStage of ["pregnant", "breastfeeding"] as const)
      expect(states({ Aqua: "green", Retinol: "yellow" }, { lifeStage })).toEqual({ Aqua: "fine", Retinol: "nfy" })
  })
  it("outranks an earlier 'fine for me'", () => {
    expect(states({ Retinol: "yellow" }, { lifeStage: "pregnant", overrides: { retinol: "fine" } }).Retinol).toBe("nfy")
  })
  it("flags strong acids in pregnancy but not while breastfeeding", () => {
    expect(states({ "Salicylic Acid": "yellow" }, { lifeStage: "pregnant" })["Salicylic Acid"]).toBe("nfy")
    expect(states({ "Salicylic Acid": "yellow" }, { lifeStage: "breastfeeding" })["Salicylic Acid"]).toBe("caution")
  })
  it("flags actives and strong scent oils for a child", () => {
    expect(states({ Retinol: "yellow", "Glycolic Acid": "yellow", Camphor: "green", Glycerin: "green" }, { lifeStage: "child" })).toEqual({
      Retinol: "nfy",
      "Glycolic Acid": "nfy",
      Camphor: "nfy",
      Glycerin: "fine",
    })
  })
  it("changes nothing without a life stage", () => {
    expect(states({ Retinol: "yellow" }, { lifeStage: null }).Retinol).toBe("caution")
  })
})

// Stopping a strong steroid suddenly after long use can cause withdrawal (UK MHRA 2021), so steroid
// advice must not be a flat "stop now"; toxic substances still are.
describe("hazard advice", () => {
  const hazard = (names: string[]) => annotateLabel(label(Object.fromEntries(names.map((n) => [n, "red"])))).hazard

  it("tells steroid users to get help before stopping after long use", () => {
    const h = hazard(["Clobetasol Propionate"])
    expect(h).not.toContain("stopNow")
    expect(h.slice(0, 2)).toEqual(["steroidLongUse", "steroidShortUse"])
    expect(h).toContain("steroidDontRestart")
  })
  it("says stop now for mercury, with safe disposal", () => {
    expect(hazard(["Mercurous Chloride"]).slice(0, 2)).toEqual(["stopNow", "mercuryDisposal"])
  })
  it("says stop now for hydroquinone, without mercury disposal", () => {
    const h = hazard(["Hydroquinone"])
    expect(h[0]).toBe("stopNow")
    expect(h).not.toContain("mercuryDisposal")
  })
  it("warns about a flare when a toxic cream also had a steroid", () => {
    expect(hazard(["Hydroquinone", "Betamethasone Valerate"])).toEqual(
      expect.arrayContaining(["stopNow", "steroidAlsoInside", "steroidDontRestart"]),
    )
  })
  it("has no hazard advice for an ordinary avoid ingredient", () => {
    expect(hazard(["Formaldehyde"])).toEqual([])
  })
})
