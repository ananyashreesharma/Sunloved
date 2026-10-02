// Local-only "account" for guests — mirrors frontend/lib/guest-store.ts exactly, but backed by
// AsyncStorage (async) instead of localStorage (sync). Everything a signed-in user would have on
// the server (routine steps, done state, streak history, reminder prefs, skin profile) lives here
// instead, scoped to this device. When a guest signs in, the onboarding wizard's resume effect
// reads this store and pushes it all to the backend in one shot, then clears it (not wired up yet —
// there's no mobile session/login flow built).

import AsyncStorage from "@react-native-async-storage/async-storage"

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

function rollDay(data: GuestData): GuestData {
  const today = todayKey()
  if (data.doneDate === today) return data
  const status = computeDayStatus(data)
  const history = status ? { ...data.history, [data.doneDate]: status } : data.history
  return { ...data, doneDate: today, doneToday: {}, history }
}

// In-memory cache so callers within one app session can read synchronously after the first load —
// AsyncStorage has no sync API, unlike localStorage on web.
let cache: GuestData | null = null

async function readRaw(): Promise<GuestData> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) return defaults()
    return { ...defaults(), ...(JSON.parse(raw) as Partial<GuestData>) }
  } catch {
    return defaults()
  }
}

async function write(data: GuestData): Promise<void> {
  cache = data
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable — the app still works, it just won't remember between visits */
  }
}

// Every read-modify-write below goes through this queue. AsyncStorage calls are async (a bridge
// round-trip), so without serializing, two calls started close together (e.g. tapping two routine
// steps in quick succession, or a toggle racing an add) can both read the same base state and the
// second write silently clobbers the first's change. Chaining onto one promise makes every
// operation wait for the previous one to finish reading+writing before it starts.
let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function mutate(fn: (data: GuestData) => GuestData): Promise<GuestData> {
  return enqueue(async () => {
    const current = cache ?? (await readRaw())
    const rolled = rollDay(current)
    const next = fn(rolled)
    await write(next)
    return next
  })
}

export function loadGuestData(): Promise<GuestData> {
  return mutate((data) => data)
}

/** Synchronous snapshot of the last-loaded data, or defaults if nothing has been loaded yet this session. */
export function peekGuestData(): GuestData {
  return cache ?? defaults()
}

export async function hasGuestData(): Promise<boolean> {
  const data = await loadGuestData()
  return data.steps.length > 0 || !!data.skinType || data.concerns.length > 0
}

export function clearGuestData(): Promise<void> {
  return enqueue(async () => {
    cache = null
    try {
      await AsyncStorage.removeItem(KEY)
    } catch {
      /* nothing to clean up */
    }
  })
}

export function updateGuestData(patch: Partial<GuestData>): Promise<GuestData> {
  return mutate((data) => ({ ...data, ...patch }))
}

export function addGuestStep(input: {
  name: string
  when: GuestStep["when"]
  frequency: GuestStep["frequency"]
  productId?: string
  brand?: string | null
}): Promise<GuestData> {
  return mutate((data) => {
    if (data.steps.some((s) => s.name.toLowerCase() === input.name.toLowerCase())) return data
    const id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const steps = [
      ...data.steps,
      { id, name: input.name, brand: input.brand ?? null, when: input.when, frequency: input.frequency, productId: input.productId },
    ]
    return { ...data, steps }
  })
}

export function toggleGuestStep(stepId: string): Promise<GuestData> {
  return mutate((data) => ({ ...data, doneToday: { ...data.doneToday, [stepId]: !data.doneToday[stepId] } }))
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

export async function getGuestRoutine(type: "morning" | "night"): Promise<GuestRoutineView> {
  const data = await loadGuestData()
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

export async function getGuestStreak(): Promise<{ currentStreak: number; longestStreak: number; totalDaysCompleted: number }> {
  const data = await loadGuestData()
  const todayStatus = computeDayStatus(data)
  const dates = Object.keys(data.history)
  if (todayStatus) dates.push(data.doneDate)
  const { current, longest } = streakFromDates(dates)
  return { currentStreak: current, longestStreak: longest, totalDaysCompleted: dates.length }
}

export type GuestStreakDay = { date: string; status: "both" | "one" | "paused" | "future" }

export async function getGuestStreakHistory(month: string): Promise<{ days: GuestStreakDay[] }> {
  const data = await loadGuestData()
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

export function saveGuestScan(scan: Omit<GuestScan, "id" | "savedAt">): Promise<void> {
  // Shares the same queue as the guest data mutations above — a different AsyncStorage key, but
  // serializing it too closes off the identical read-then-write race for back-to-back scans.
  return enqueue(async () => {
    try {
      const raw = await AsyncStorage.getItem(SCANS_KEY)
      const list: GuestScan[] = raw ? JSON.parse(raw) : []
      const entry: GuestScan = { ...scan, id: `guest-scan-${Date.now()}`, savedAt: new Date().toISOString() }
      await AsyncStorage.setItem(SCANS_KEY, JSON.stringify([entry, ...list].slice(0, MAX_GUEST_SCANS)))
    } catch {
      /* storage unavailable */
    }
  })
}

export async function getGuestScans(): Promise<GuestScan[]> {
  try {
    const raw = await AsyncStorage.getItem(SCANS_KEY)
    return raw ? (JSON.parse(raw) as GuestScan[]) : []
  } catch {
    return []
  }
}

export function clearGuestScans(): Promise<void> {
  return enqueue(async () => {
    try {
      await AsyncStorage.removeItem(SCANS_KEY)
    } catch {
      /* nothing to clean up */
    }
  })
}
