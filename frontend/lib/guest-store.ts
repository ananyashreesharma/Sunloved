"use client"

// Local-only "account" for guests — everything a signed-in user would have on the server
// (routine steps, done state, streak history, reminder prefs, skin profile) lives here instead,
// scoped to this device/browser. When a guest signs in, OumaOnboardingClient's resume effect
// reads this store and pushes it all to the backend in one shot, then clears it.

export type GuestStep = {
  id: string
  name: string
  brand: string | null
  when: "morning" | "night" | "both"
  frequency: "daily" | "alternate" | "twice_weekly"
  productId?: string
}

export type GuestData = {
  skinType: string | null
  concerns: string[]
  steps: GuestStep[]
  morningTime: string
  nightTime: string
  channel: "push" | "whatsapp"
  reminderTone: "coach" | "plain" | "off"
  muted: boolean
  doneToday: Record<string, boolean>
  doneDate: string
  history: Record<string, "both" | "one">
}

const KEY = "skinlens_guest_data"

// Same ordering intent as backend's CATEGORY_STEP_ORDER (backend/src/modules/ouma/ouma.service.ts).
export const STEP_ORDER: Record<string, number> = { Cleanser: 0, Toner: 2, Serum: 4, Moisturiser: 6, SPF: 7 }

// Mirrors the code/label pairs OumaOnboardingClient collects skinType/concerns from.
export const SKIN_TYPE_LABELS: Record<string, string> = { oily: "Oily", dry: "Dry", combination: "Combination", sensitive: "Sensitive" }
export const CONCERN_LABELS: Record<string, string> = { acne: "Acne", pigmentation: "Pigmentation", redness: "Redness", texture: "Texture", dullness: "Dullness" }

export function stepSortKey(name: string): number {
  return STEP_ORDER[name] ?? 99
}

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime()
  const db = new Date(`${b}T00:00:00Z`).getTime()
  return Math.round((db - da) / 86400000)
}

function defaults(): GuestData {
  return {
    skinType: null,
    concerns: [],
    steps: [],
    morningTime: "07:30",
    nightTime: "21:30",
    channel: "push",
    reminderTone: "coach",
    muted: false,
    doneToday: {},
    doneDate: todayKey(),
    history: {},
  }
}

function computeDayStatus(data: GuestData): "both" | "one" | null {
  const nightSteps = data.steps.filter((s) => s.when !== "morning")
  const morningSteps = data.steps.filter((s) => s.when !== "night")
  const nightDone = nightSteps.length > 0 && nightSteps.every((s) => data.doneToday[s.id])
  const morningDone = morningSteps.length > 0 && morningSteps.every((s) => data.doneToday[s.id])
  if (!nightDone && !morningDone) return null
  return nightDone && morningDone ? "both" : "one"
}

// If the stored day has rolled over, file yesterday's status into history and reset today's checks.
function rollDay(data: GuestData): GuestData {
  const today = todayKey()
  if (data.doneDate === today) return data
  const status = computeDayStatus(data)
  const history = status ? { ...data.history, [data.doneDate]: status } : data.history
  return { ...data, doneDate: today, doneToday: {}, history }
}

function readRaw(): GuestData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults()
    return { ...defaults(), ...(JSON.parse(raw) as Partial<GuestData>) }
  } catch {
    return defaults()
  }
}

function write(data: GuestData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable — the app still works, it just won't remember between visits */
  }
}

export function loadGuestData(): GuestData {
  const rolled = rollDay(readRaw())
  write(rolled)
  return rolled
}

export function hasGuestData(): boolean {
  const data = loadGuestData()
  return data.steps.length > 0 || !!data.skinType || data.concerns.length > 0
}

export function clearGuestData() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clean up */
  }
}

export function updateGuestData(patch: Partial<GuestData>): GuestData {
  const next = { ...loadGuestData(), ...patch }
  write(next)
  return next
}

export function addGuestStep(input: { name: string; when: GuestStep["when"]; frequency: GuestStep["frequency"]; productId?: string; brand?: string | null }): GuestData {
  const data = loadGuestData()
  if (data.steps.some((s) => s.name.toLowerCase() === input.name.toLowerCase())) return data
  const id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const steps = [...data.steps, { id, name: input.name, brand: input.brand ?? null, when: input.when, frequency: input.frequency, productId: input.productId }]
  const next = { ...data, steps }
  write(next)
  return next
}

export function toggleGuestStep(stepId: string): GuestData {
  const data = loadGuestData()
  const next = { ...data, doneToday: { ...data.doneToday, [stepId]: !data.doneToday[stepId] } }
  write(next)
  return next
}

export type GuestRoutineStepView = {
  id: string
  productId: string | null
  name: string
  brand: string | null
  position: number
  frequency: GuestStep["frequency"]
  waitAfterMins: null
  done: boolean
  enrich: false
}

export type GuestRoutineView = {
  routineId: "guest"
  type: "morning" | "night"
  steps: GuestRoutineStepView[]
  allDone: boolean
  conflicts: []
}

export function getGuestRoutine(type: "morning" | "night"): GuestRoutineView {
  const data = loadGuestData()
  const ordered = data.steps
    .filter((s) => s.when === type || s.when === "both")
    .sort((a, b) => stepSortKey(a.name) - stepSortKey(b.name))
  const steps: GuestRoutineStepView[] = ordered.map((s, i) => ({
    id: s.id,
    productId: s.productId ?? null,
    name: s.name,
    brand: s.brand,
    position: i,
    frequency: s.frequency,
    waitAfterMins: null,
    done: !!data.doneToday[s.id],
    enrich: false,
  }))
  return { routineId: "guest", type, steps, allDone: steps.length > 0 && steps.every((s) => s.done), conflicts: [] }
}

function streakFromDates(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }
  const sorted = [...dates].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    run = daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }
  const today = todayKey()
  const lastDate = sorted[sorted.length - 1]
  if (daysBetween(lastDate, today) > 1) return { current: 0, longest }
  let current = 1
  for (let i = sorted.length - 1; i > 0; i--) {
    if (daysBetween(sorted[i - 1], sorted[i]) === 1) current++
    else break
  }
  return { current, longest }
}

export function getGuestStreak(): { currentStreak: number; longestStreak: number; totalDaysCompleted: number } {
  const data = loadGuestData()
  const todayStatus = computeDayStatus(data)
  const dates = Object.keys(data.history)
  if (todayStatus) dates.push(data.doneDate)
  const { current, longest } = streakFromDates(dates)
  return { currentStreak: current, longestStreak: longest, totalDaysCompleted: dates.length }
}

export type GuestStreakDay = { date: string; status: "both" | "one" | "paused" | "future" }

export function getGuestStreakHistory(month: string): { days: GuestStreakDay[] } {
  const data = loadGuestData()
  const todayStatus = computeDayStatus(data)
  const [y, m] = month.split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const today = todayKey()
  const days: GuestStreakDay[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    let status: GuestStreakDay["status"]
    if (date > today) status = "future"
    else if (date === data.doneDate && todayStatus) status = todayStatus
    else if (data.history[date]) status = data.history[date]
    else status = "paused"
    days.push({ date, status })
  }
  return { days }
}

export type GuestScan = {
  id: string
  title: string
  brand: string
  savedAt: string
  flagCount: number
  coverage: number
  score: number
  productId?: string
  rawIngredientText?: string
}

const SCANS_KEY = "skinlens_guest_scans"
const MAX_GUEST_SCANS = 20

export function saveGuestScan(scan: Omit<GuestScan, "id" | "savedAt">): void {
  try {
    const raw = localStorage.getItem(SCANS_KEY)
    const list: GuestScan[] = raw ? JSON.parse(raw) : []
    const entry: GuestScan = { ...scan, id: `guest-scan-${Date.now()}`, savedAt: new Date().toISOString() }
    localStorage.setItem(SCANS_KEY, JSON.stringify([entry, ...list].slice(0, MAX_GUEST_SCANS)))
  } catch {
    /* storage unavailable */
  }
}

export function getGuestScans(): GuestScan[] {
  try {
    const raw = localStorage.getItem(SCANS_KEY)
    return raw ? (JSON.parse(raw) as GuestScan[]) : []
  } catch {
    return []
  }
}

export function clearGuestScans() {
  try {
    localStorage.removeItem(SCANS_KEY)
  } catch {
    /* nothing to clean up */
  }
}
