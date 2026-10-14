import { daysBetween, newMilestone, streakFromDates } from "../src/streak"
import { isDueOn } from "../src/schedule"
import { findRoutineClash } from "../src/conflicts"

const TODAY = "2026-10-14"

describe("streakFromDates", () => {
  it.each([
    [["2026-10-12", "2026-10-13", "2026-10-14"], { current: 3, longest: 3 }],
    [["2026-10-11", "2026-10-13"], { current: 2, longest: 2 }], // one missed day pauses
    [["2026-10-10", "2026-10-13"], { current: 1, longest: 1 }], // two missed days end it
    [["2026-10-12"], { current: 1, longest: 1 }],
    [["2026-10-11"], { current: 0, longest: 1 }],
    [[], { current: 0, longest: 0 }],
    // Regressions: days after today and garbage keys never count.
    [["2027-01-01"], { current: 0, longest: 0 }],
    [["banana", TODAY], { current: 1, longest: 1 }],
  ])("%j", (dates, expected) => {
    expect(streakFromDates(dates, TODAY)).toEqual(expected)
  })
  it("isn't thrown by daylight-saving changes", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2)
  })
  it("celebrates only the highest uncelebrated milestone", () => {
    expect(newMilestone(70, [7, 30])).toBe(66)
    expect(newMilestone(100, [])).toBe(100)
    expect(newMilestone(5, [])).toBeNull()
  })
})

describe("isDueOn", () => {
  it("alternates around the epoch", () => {
    expect(["2026-01-04", "2026-01-05", "2026-01-06"].map((d) => isDueOn("alternate", d))).toEqual([false, true, false])
  })
  it("runs twice-weekly steps on Mondays and Thursdays", () => {
    expect(["2026-10-12", "2026-10-15", "2026-10-14"].map((d) => isDueOn("twice_weekly", d))).toEqual([true, true, false])
  })
})

describe("findRoutineClash", () => {
  it("finds retinol with glycolic acid", () => {
    expect(findRoutineClash([{ id: "1", name: "Retinol serum" }, { id: "2", name: "Glycolic toner" }])?.b).toBe("glycolic acid")
  })
  it("ignores rest days", () => {
    expect(findRoutineClash([{ id: "1", name: "Retinol serum" }, { id: "2", name: "Glycolic toner", rest: true }])).toBeNull()
  })
  // Regression: "Retinol-free" was read as containing retinol.
  it.each([
    [{ id: "1", name: "Retinol-free cream" }, { id: "2", name: "Glycolic toner" }],
    [{ id: "1", name: "Retinol serum" }, { id: "2", name: "AHA free moisturiser" }],
    [{ id: "1", name: "Cream without retinol" }, { id: "2", name: "Lactic acid" }],
  ])("doesn't flag %j with %j", (a, b) => {
    expect(findRoutineClash([a, b])).toBeNull()
  })
  it("still flags a retinoid in an oil-free product", () => {
    expect(findRoutineClash([{ id: "1", name: "Oil-free retinol serum" }, { id: "2", name: "BHA liquid" }])?.a).toBe("Retinol")
  })
})
