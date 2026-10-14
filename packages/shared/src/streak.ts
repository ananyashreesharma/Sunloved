// Streak rules, matching the promise in the app: "Streak paused, not broken."
// One missed day pauses the streak; the next completed day continues it. Two missed days in a row
// end it. The backend applies the same rule in backend/src/modules/ouma/ouma.service.ts.

/** Days that may be missed between two completed days without ending the streak. */
export const PAUSE_DAYS_ALLOWED = 1

const MAX_GAP = PAUSE_DAYS_ALLOWED + 1

/** Local calendar day as YYYY-MM-DD. */
export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Whole days from a to b (YYYY-MM-DD), b later = positive. */
export function daysBetween(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`)
  const db = Date.parse(`${b}T00:00:00Z`)
  return Math.round((db - da) / 86400000)
}

/** Current and longest streak from the set of completed days. */
export function streakFromDates(dates: string[], today: string = todayKey()): { current: number; longest: number } {
  // Malformed keys and days after today (a phone clock set ahead) never count.
  const sorted = Array.from(new Set(dates))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && daysBetween(d, today) >= 0)
    .sort()
  if (sorted.length === 0) return { current: 0, longest: 0 }
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    run = daysBetween(sorted[i - 1], sorted[i]) <= MAX_GAP ? run + 1 : 1
    longest = Math.max(longest, run)
  }
  const last = sorted[sorted.length - 1]
  // `run` is the streak ending on the last completed day; it is still alive while today is within
  // the allowed gap of that day.
  const current = daysBetween(last, today) <= MAX_GAP ? run : 0
  return { current, longest }
}

/** A stored streak counter is stale once the allowed gap has passed without a completed day. */
export function isStreakAlive(lastActiveDate: string | null | undefined, today: string = todayKey()): boolean {
  if (!lastActiveDate) return false
  return daysBetween(lastActiveDate, today) <= MAX_GAP
}

/** Streak lengths that get a celebration: a week, a lunar month, 66 nights (the median time for a
 * habit to become automatic, Lally et al. 2010), a hundred nights. */
export const MILESTONES = [7, 30, 66, 100] as const

/** The milestone the streak has just reached and that hasn't been celebrated yet, if any. */
export function newMilestone(current: number, seen: number[]): number | null {
  const hit = [...MILESTONES].reverse().find((m) => current >= m && !seen.includes(m))
  return hit ?? null
}
