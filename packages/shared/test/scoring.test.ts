import { breakdownFromProduct, breakdownFromRows, verdictFor, type IngredientRow, type RowZone } from "../src/scoring"
import type { ProductDetail } from "../src/types"

const rows = (zones: RowZone[]): IngredientRow[] => zones.map((zone, i) => ({ name: `i${i}`, zone, note: "" }))
const verdict = (zones: RowZone[]) => verdictFor(breakdownFromRows(rows(zones)))
const many = (zone: RowZone, n: number): RowZone[] => Array(n).fill(zone)

describe("verdictFor", () => {
  it("calls an all-safe label fine", () => {
    expect(verdict(["GREEN", "GREEN"])).toBe("GREEN")
  })
  it("avoids a product with one avoid-level ingredient among many safe ones", () => {
    expect(verdict(["RED", ...many("GREEN", 5)])).toBe("RED")
  })
  // Regression: averaging capped an all-caution label at 74, inside the "looks fine" band.
  it("never calls an all-caution label fine", () => {
    expect(verdict(many("YELLOW", 4))).toBe("YELLOW")
    expect(verdict(["YELLOW"])).toBe("YELLOW")
  })
  it("treats a quarter or more caution as caution", () => {
    expect(verdict(["YELLOW", "GREEN", "GREEN", "GREEN"])).toBe("YELLOW")
    expect(verdict(["YELLOW", "YELLOW", "GREEN", "GREEN"])).toBe("YELLOW")
  })
  it("still calls a long safe label with one fragrance fine", () => {
    expect(verdict(["YELLOW", ...many("GREEN", 9)])).toBe("GREEN")
  })
  it("gives no verdict when nothing is rated or coverage is under 70%", () => {
    expect(verdict(["NONE", "NONE"])).toBeNull()
    expect(verdict([...many("GREEN", 69), ...many("NONE", 31)])).toBeNull()
  })
  it("downgrades fine to caution between 70% and 90% coverage", () => {
    expect(verdict([...many("GREEN", 8), ...many("NONE", 2)])).toBe("YELLOW")
  })
})

describe("breakdownFromProduct", () => {
  const product = (overallScore: unknown, zones: string[]) =>
    ({ overallScore, ingredientRows: zones.map((zone, i) => ({ inciName: `i${i}`, zone })) }) as unknown as ProductDetail

  it("ignores a stored score that isn't a number", () => {
    expect(Number.isFinite(breakdownFromProduct(product("abc", ["green"])).score)).toBe(true)
  })
  it("caps a stored high score for an all-caution product", () => {
    expect(verdictFor(breakdownFromProduct(product(90, ["yellow", "yellow"])))).toBe("YELLOW")
  })
  it("caps a stored high score when an avoid-level ingredient is present", () => {
    expect(verdictFor(breakdownFromProduct(product(90, ["red", "green"])))).toBe("RED")
  })
  it("refuses a verdict for a product with no ingredient list", () => {
    expect(verdictFor(breakdownFromProduct(product(80, [])))).toBeNull()
  })
})

// Regression: seeds stored retailer star ratings (out of 5) in overallScore, so a product of water,
// glycerin and niacinamide rated 4.4 stars scored 4 and showed "high risk".
describe("stored scores that aren't safety scores", () => {
  const safeProduct = (overallScore: unknown) =>
    ({
      overallScore,
      ingredientRows: ["Aqua", "Glycerin", "Niacinamide"].map((inciName) => ({ inciName, zone: "green" })),
    }) as unknown as ProductDetail

  it.each([4.4, 5, 0, 120, -3])("ignores %p and scores from the ingredients", (s) => {
    expect(verdictFor(breakdownFromProduct(safeProduct(s)))).toBe("GREEN")
  })
  it("still uses a real stored safety score", () => {
    expect(breakdownFromProduct(safeProduct(60)).score).toBe(60)
  })
})
