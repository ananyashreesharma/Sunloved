import { from12Hour, to12Hour } from "../src/lib/time-format"

describe("12-hour time entry", () => {
  it.each([
    ["00:00", { hour: 12, minute: 0, period: "AM" }],
    ["12:30", { hour: 12, minute: 30, period: "PM" }],
    ["21:05", { hour: 9, minute: 5, period: "PM" }],
    // Regression: out-of-range input became "1:99 PM".
    ["25:99", { hour: 12, minute: 0, period: "AM" }],
    ["garbage", { hour: 12, minute: 0, period: "AM" }],
  ])("to12Hour(%j)", (input, expected) => {
    expect(to12Hour(input)).toEqual(expected)
  })
  it.each([
    [12, 0, "AM", "00:00"],
    [12, 30, "PM", "12:30"],
    [9, 5, "PM", "21:05"],
    [13, 75, "AM", "00:59"],
    // Regression: a half-typed field produced "NaN:05".
    [NaN, 5, "AM", "00:05"],
    [7, NaN, "AM", "07:00"],
  ] as const)("from12Hour(%p, %p, %p)", (h, m, p, expected) => {
    expect(from12Hour(h, m, p)).toBe(expected)
  })
  it("round-trips every minute of the day", () => {
    for (let h = 0; h < 24; h++)
      for (let m = 0; m < 60; m++) {
        const hhmm = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        const t = to12Hour(hhmm)
        expect(from12Hour(t.hour, t.minute, t.period)).toBe(hhmm)
      }
  })
})
