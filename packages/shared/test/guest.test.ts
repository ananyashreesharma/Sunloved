import { dayStatus, defaultGuestData, guestStreak, hasGuestProfile, parseGuestData, rollDay, withScan, withStep, withStepToggled } from "../src/guest"

describe("parseGuestData", () => {
  it.each(["", "not json", "null", "[1,2]", "5", '"x"'])("falls back to defaults for %j", (raw) => {
    expect(parseGuestData(raw).steps).toEqual([])
  })
  // Regression: a null field crashed every screen reading it.
  it.each(["steps", "history", "doneToday", "concerns", "milestonesSeen", "skinLog", "ingredientOverrides"])(
    "survives %s: null",
    (field) => {
      const data = parseGuestData(JSON.stringify({ [field]: null }))
      expect(() => [hasGuestProfile(data), dayStatus(data), guestStreak(data)]).not.toThrow()
    },
  )
  it("drops malformed steps but keeps good ones", () => {
    const data = parseGuestData(JSON.stringify({ steps: [null, 3, { id: "a", name: "Cleanser", when: "both", frequency: "daily" }] }))
    expect(data.steps.map((s) => s.id)).toEqual(["a"])
  })
  it("keeps valid saved values", () => {
    const data = parseGuestData(JSON.stringify({ country: "IN", muted: true, nightTime: "22:00" }))
    expect([data.country, data.muted, data.nightTime]).toEqual(["IN", true, "22:00"])
  })
})

describe("withStep", () => {
  it("rejects blank names and duplicates differing only by spacing or case", () => {
    let d = withStep(defaultGuestData(), { name: "   ", when: "night", frequency: "daily" })
    expect(d.steps).toHaveLength(0)
    d = withStep(d, { name: "Serum", when: "night", frequency: "daily" })
    d = withStep(d, { name: " serum  ", when: "night", frequency: "daily" })
    expect(d.steps.map((s) => s.name)).toEqual(["Serum"])
  })
})

describe("days and streaks", () => {
  it("files a finished day and lets the streak lapse after two missed days", () => {
    let d = withStep(defaultGuestData(), { name: "Cleanser", when: "both", frequency: "daily" })
    const id = d.steps[0].id
    d = { ...d, doneDate: "2026-10-10" }
    d = withStepToggled(withStepToggled(d, id, "morning"), id, "night")
    d = rollDay(d, "2026-10-14")
    expect(d.history).toEqual({ "2026-10-10": "both" })
    expect(guestStreak(d, "2026-10-14").currentStreak).toBe(0)
  })
  it("counts a morning-only routine as a full day", () => {
    let d = withStep(defaultGuestData(), { name: "SPF", when: "morning", frequency: "daily" })
    d = withStepToggled(d, d.steps[0].id, "morning")
    expect(dayStatus(d)).toBe("both")
  })
  it("doesn't count a rest-day-only routine as done", () => {
    const d = withStep({ ...defaultGuestData(), doneDate: "2026-01-06" }, { name: "Retinol", when: "night", frequency: "alternate" })
    expect(dayStatus(d)).toBeNull()
  })
})

describe("withScan", () => {
  it("gives scans saved in the same millisecond different ids", () => {
    let list: ReturnType<typeof withScan> = []
    for (let i = 0; i < 5; i++) list = withScan(list, { title: "a", brand: "b", flagCount: 0, coverage: 1, score: 90 })
    expect(new Set(list.map((s) => s.id)).size).toBe(5)
  })
})

describe("lifeStage and shareLabels in saved data", () => {
  it("keeps valid values and drops anything else", () => {
    expect(parseGuestData('{"lifeStage":"pregnant","shareLabels":false}')).toMatchObject({ lifeStage: "pregnant", shareLabels: false })
    expect(parseGuestData('{"lifeStage":"astronaut","shareLabels":"yes"}')).toMatchObject({ lifeStage: null, shareLabels: null })
    expect(parseGuestData('{"country":true}').country).toBeNull()
  })
})
