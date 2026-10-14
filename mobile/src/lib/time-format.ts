// Reminder times are stored and typed as unambiguous 24-hour "HH:MM" (see guest-store.ts /
// formatTimeInput in OnboardingWizard.tsx and ProfileScreen.tsx) — but displaying that raw string
// back to someone whose phone is set to a 12-hour clock reads as unfamiliar military time. This
// doesn't guess a format from country (a device's 12h/24h setting is a personal preference, not
// something tied to where its owner lives) — it defers to Intl.DateTimeFormat with no explicit
// locale, which uses whatever the device itself is already set to.
export function formatTimeForDisplay(hhmm: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!match) return hhmm
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return hhmm
  const d = new Date(2000, 0, 1, hours, minutes)
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d)
}

export type Period = "AM" | "PM"

// Splits a stored 24-hour "HH:MM" into 12-hour parts for an AM/PM entry widget — typing "21:30"
// to set a reminder was the same unfamiliar-military-time problem formatTimeForDisplay fixes for
// reading it back, just on the input side.
export function to12Hour(hhmm: string): { hour: number; minute: number; period: Period } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!match) return { hour: 12, minute: 0, period: "AM" }
  const h24 = Number(match[1])
  const minute = Number(match[2])
  if (h24 > 23 || minute > 59) return { hour: 12, minute: 0, period: "AM" }
  const period: Period = h24 >= 12 ? "PM" : "AM"
  const hour = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour, minute, period }
}

export function from12Hour(hour: number, minute: number, period: Period): string {
  // A half-typed field can hand over NaN; that reads as 12 and :00 rather than "NaN:05".
  const clampedHour = Number.isFinite(hour) ? Math.min(12, Math.max(1, Math.trunc(hour))) : 12
  const clampedMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, Math.trunc(minute))) : 0
  let h24 = clampedHour % 12
  if (period === "PM") h24 += 12
  return `${String(h24).padStart(2, "0")}:${String(clampedMinute).padStart(2, "0")}`
}
