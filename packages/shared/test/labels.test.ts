import { splitLabel } from "../src/labels"

describe("splitLabel", () => {
  it.each([
    ["Water, 1,2-Hexanediol, Glycerin", ["Water", "1,2-Hexanediol", "Glycerin"]],
    ["Ingredients: Aqua, Glycerin. May contain: CI 77891", ["Aqua", "Glycerin", "CI 77891"]],
    ["INGREDIENTS:WATER,GLYCERIN", ["WATER", "GLYCERIN"]],
    ["Avobenzone 3%, Zinc Oxide (20% w/w)", ["Avobenzone", "Zinc Oxide"]],
    ["2% Salicylic Acid", ["Salicylic Acid"]],
    ["Aloe*, Water\n*organic", ["Aloe", "Water"]],
    ["ماء، جليسرين", ["ماء", "جليسرين"]],
    ["PEG-100 Stearate, Polysorbate 20, C12-15 Alkyl Benzoate", ["PEG-100 Stearate", "Polysorbate 20", "C12-15 Alkyl Benzoate"]],
    ["Vitamin E (Tocopherol).", ["Vitamin E (Tocopherol)"]],
    // Regressions
    ["Iron Oxides (CI 77491, CI 77492), Mica", ["Iron Oxides (CI 77491, CI 77492)", "Mica"]],
    ["Pentylene Glycol. 1,2-Hexanediol", ["Pentylene Glycol", "1,2-Hexanediol"]],
    ["Rosa Damascena Flower Ext. Water", ["Rosa Damascena Flower Ext. Water"]],
    ["FD&C Red No. 40, Aqua", ["FD&C Red No. 40", "Aqua"]],
    ["Niacinamide 0.5%. Water", ["Niacinamide", "Water"]],
  ])("%j", (label, expected) => {
    expect(splitLabel(label)).toEqual(expected)
  })

  it("doesn't let an unclosed bracket swallow the rest of the label", () => {
    expect(splitLabel("Parfum (Fragrance, Linalool, Limonene")).toEqual(["Parfum Fragrance", "Linalool", "Limonene"])
  })
  it("returns nothing for empty or junk input", () => {
    expect(splitLabel("")).toEqual([])
    expect(splitLabel(",,,;;; . - *")).toEqual([])
  })
  it("stays fast on a huge paste", () => {
    const start = Date.now()
    splitLabel("Water, ".repeat(100000) + "(".repeat(2000))
    expect(Date.now() - start).toBeLessThan(2000)
  })
})
