// Which routine steps are due on a given day. "Every other day" and "twice a week" steps have
// rest days; those don't count toward the moon, "done" or the streak.

import type { StepFrequency } from "./types"
import { daysBetween } from "./streak"

const EPOCH = "2026-01-05" // a Monday; anchors the every-other-day rhythm

/** YYYY-MM-DD → whether a step with this frequency is due that day. */
export function isDueOn(frequency: StepFrequency, date: string): boolean {
  if (frequency === "daily") return true
  if (frequency === "alternate") return Math.abs(daysBetween(EPOCH, date)) % 2 === 0
  // twice_weekly: Mondays and Thursdays
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return weekday === 1 || weekday === 4
}
