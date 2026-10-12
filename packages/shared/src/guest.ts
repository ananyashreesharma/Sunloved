// Guest mode: everything a signed-in user keeps on the server lives on the device instead.
// This module is the pure logic; each app wraps it with its own storage (frontend/lib/guest-store.ts
// over localStorage, mobile/src/lib/guest-store.ts over AsyncStorage).

import type { StepFrequency, StreakDayStatus, StreakSummary, RoutineKind } from "./types"
import { daysBetween, streakFromDates, todayKey } from "./streak"
import { isDueOn } from "./schedule"
import { stepKind, type StepKind } from "./kinds"
import type { IngredientOverride } from "./personal"

export type GuestStep = {
  id: string
  name: string
  brand: string | null
  when: RoutineKind | "both"
  frequency: StepFrequency
  productId?: string
  /** Known when the step was picked from a list; otherwise guessed from the name. */
  kind?: StepKind
}

export type GuestData = {
  /** ISO 3166-1 alpha-2, e.g. "IN". Formulas, regulations and prices depend on it. */
  country: string | null
  skinType: string | null
  concerns: string[]
  steps: GuestStep[]
  morningTime: string
  nightTime: string
  channel: "push" | "whatsapp"
  reminderTone: "coach" | "plain" | "off"
  /** Each routine's reminder can be turned off on its own. */
  remindMorning: boolean
  remindNight: boolean
  muted: boolean
  /** Streak milestones (see MILESTONES) whose celebration has been shown, so each appears once. */
  milestonesSeen: number[]
  /** What the night routine comes right after, so reminders can name it: an existing habit is a
   * stronger cue than a clock time. Null until the person picks one. */
  nightAnchor: NightAnchor | null
  /** Set once the "keep reminders?" question has been asked (after 14 nights done). */
  reminderCheckDone: boolean
  /** "Fine for me" / "I react to this", keyed by the ingredient's standard name in lower case. */
  ingredientOverrides: Record<string, IngredientOverride>
  /** How skin felt after the night routine, by day (YYYY-MM-DD). */
  skinLog: Record<string, SkinFeel>
  doneToday: Record<string, boolean>
  doneDate: string
  history: Record<string, "both" | "one">
}

export type SkinFeel = "calm" | "same" | "irritated"
export const SKIN_FEELS: SkinFeel[] = ["calm", "same", "irritated"]

export const NIGHT_ANCHORS = ["teeth", "shower", "dinner", "bed"] as const
export type NightAnchor = (typeof NIGHT_ANCHORS)[number]

/** Nights done after which reminders are checked in on once. */
export const REMINDER_CHECK_NIGHTS = 14

export const GUEST_DATA_KEY = "skinlens_guest_data"
export const GUEST_SCANS_KEY = "skinlens_guest_scans"
export const MAX_GUEST_SCANS = 20

// Same ordering intent as the backend's CATEGORY_STEP_ORDER (backend/src/modules/ouma/ouma.service.ts):
// thinnest first, SPF last.
export const STEP_ORDER: Record<string, number> = { Cleanser: 0, Toner: 2, Serum: 4, Moisturiser: 6, SPF: 7 }

// Slots between the quick-step positions above (Cleanser 0, Toner 2, Serum 4, Moisturiser 6, SPF 7).
const KIND_SORT: Record<StepKind, number> = { cleanse: 0, exfoliate: 2, serum: 4, treat: 5, moisturise: 6, seal: 6.5, sunscreen: 7 }

/** Sort key for a step: its known kind, else exact quick-step names, else the kind guessed from its name. */
export function stepSortKey(name: string, known?: StepKind): number {
  if (known) return KIND_SORT[known]
  const exact = STEP_ORDER[name]
  if (exact !== undefined) return exact
  const kind = stepKind(name)
  return kind ? KIND_SORT[kind] : 99
}

export function defaultGuestData(): GuestData {
  return {
    country: null,
    skinType: null,
    concerns: [],
    steps: [],
    morningTime: "07:30",
    nightTime: "21:30",
    channel: "push",
    reminderTone: "coach",
    remindMorning: true,
    remindNight: true,
    muted: false,
    milestonesSeen: [],
    nightAnchor: null,
    reminderCheckDone: false,
    ingredientOverrides: {},
    skinLog: {},
    doneToday: {},
    doneDate: todayKey(),
    history: {},
  }
}

/** Parse stored JSON, filling fields added since it was written. Corrupt data → defaults. */
export function parseGuestData(raw: string | null): GuestData {
  if (!raw) return defaultGuestData()
  try {
    return { ...defaultGuestData(), ...(JSON.parse(raw) as Partial<GuestData>) }
  } catch {
    return defaultGuestData()
  }
}

export function hasGuestProfile(data: GuestData): boolean {
  return data.steps.length > 0 || !!data.skinType || data.concerns.length > 0
}

/** "both" when every routine with steps due today is done, "one" when only some are, else null. */
export function dayStatus(data: GuestData): "both" | "one" | null {
  // Only steps due that day count; rest days of every-other-day steps never block "done".
  const due = data.steps.filter((s) => isDueOn(s.frequency, data.doneDate))
  const nightSteps = due.filter((s) => s.when !== "morning")
  const morningSteps = due.filter((s) => s.when !== "night")
  const nightDone = nightSteps.length > 0 && nightSteps.every((s) => data.doneToday[doneKey(s.id, "night")])
  const morningDone = morningSteps.length > 0 && morningSteps.every((s) => data.doneToday[doneKey(s.id, "morning")])
  if (!nightDone && !morningDone) return null
  // A routine with nothing due today (none set up, or all rest days) doesn't count against the day.
  const nightOk = nightDone || nightSteps.length === 0
  const morningOk = morningDone || morningSteps.length === 0
  return nightOk && morningOk ? "both" : "one"
}

/** If the stored day has rolled over, file its status into history and reset today's checks. */
export function rollDay(data: GuestData, today: string = todayKey()): GuestData {
  if (data.doneDate === today) return data
  const status = dayStatus(data)
  const history = status ? { ...data.history, [data.doneDate]: status } : data.history
  return { ...data, doneDate: today, doneToday: {}, history }
}

export type NewGuestStep = {
  name: string
  when: GuestStep["when"]
  frequency: StepFrequency
  productId?: string
  brand?: string | null
  kind?: StepKind
}

/** Adds a step unless one with the same name exists. */
export function withStep(data: GuestData, input: NewGuestStep): GuestData {
  if (data.steps.some((s) => s.name.toLowerCase() === input.name.toLowerCase())) return data
  const id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const step: GuestStep = {
    id,
    name: input.name,
    brand: input.brand ?? null,
    when: input.when,
    frequency: input.frequency,
    productId: input.productId,
    ...(input.kind ? { kind: input.kind } : {}),
  }
  return { ...data, steps: [...data.steps, step] }
}

export function withStepFrequency(data: GuestData, stepId: string, frequency: StepFrequency): GuestData {
  return { ...data, steps: data.steps.map((s) => (s.id === stepId ? { ...s, frequency } : s)) }
}

/** A step used morning and night is ticked separately for each, so ticks are keyed by period. */
export function doneKey(stepId: string, period: RoutineKind): string {
  return `${stepId}@${period}`
}

export type GuestStepPatch = Partial<Pick<GuestStep, "name" | "when" | "frequency" | "kind">>

export function withStepUpdated(data: GuestData, stepId: string, patch: GuestStepPatch): GuestData {
  return { ...data, steps: data.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }
}

/** Removes a step and its ticks for today. */
export function withoutStep(data: GuestData, stepId: string): GuestData {
  const doneToday = Object.fromEntries(Object.entries(data.doneToday).filter(([k]) => !k.startsWith(`${stepId}@`)))
  return { ...data, steps: data.steps.filter((s) => s.id !== stepId), doneToday }
}

/**
 * Where a step lands in a routine: the steps just before and after it once sorted ("Goes after
 * cleanser, before moisturiser"). `stepId` excludes the step being edited from its own neighbours.
 */
export function stepNeighbours(
  data: GuestData,
  period: RoutineKind,
  candidate: { name: string; kind?: StepKind },
  stepId?: string,
): { before: string | null; after: string | null } {
  const key = stepSortKey(candidate.name, candidate.kind)
  const others = data.steps
    .filter((s) => s.id !== stepId && (s.when === period || s.when === "both"))
    .map((s) => ({ name: s.name, key: stepSortKey(s.name, s.kind) }))
    .sort((a, b) => a.key - b.key)
  const prev = [...others].reverse().find((o) => o.key <= key)
  const next = others.find((o) => o.key > key)
  return { after: prev?.name ?? null, before: next?.name ?? null }
}

export function withStepToggled(data: GuestData, stepId: string, period: RoutineKind): GuestData {
  const key = doneKey(stepId, period)
  return { ...data, doneToday: { ...data.doneToday, [key]: !data.doneToday[key] } }
}

export type GuestRoutineStepView = {
  id: string
  productId: string | null
  name: string
  brand: string | null
  position: number
  frequency: StepFrequency
  waitAfterMins: null
  done: boolean
  enrich: false
  /** Not due today (rest day of an every-other-day or twice-a-week step). */
  rest: boolean
  kind: StepKind | null
}

export type GuestRoutineView = {
  routineId: "guest"
  type: RoutineKind
  steps: GuestRoutineStepView[]
  allDone: boolean
  conflicts: []
}

/** Same shape as the backend's RoutineResponse, so screens render guests and users alike. */
export function guestRoutine(data: GuestData, type: RoutineKind): GuestRoutineView {
  const steps: GuestRoutineStepView[] = data.steps
    .filter((s) => s.when === type || s.when === "both")
    .sort((a, b) => stepSortKey(a.name, a.kind) - stepSortKey(b.name, b.kind))
    .map((s, i) => ({
      id: s.id,
      productId: s.productId ?? null,
      name: s.name,
      brand: s.brand,
      position: i,
      frequency: s.frequency,
      waitAfterMins: null,
      done: !!data.doneToday[doneKey(s.id, type)],
      enrich: false,
      rest: !isDueOn(s.frequency, data.doneDate),
      kind: s.kind ?? stepKind(s.name),
    }))
  const due = steps.filter((s) => !s.rest)
  return { routineId: "guest", type, steps, allDone: due.length > 0 && due.every((s) => s.done), conflicts: [] }
}

function completedDates(data: GuestData): string[] {
  const dates = Object.keys(data.history)
  if (dayStatus(data)) dates.push(data.doneDate)
  return dates
}

export function guestStreak(data: GuestData, today: string = todayKey()): StreakSummary {
  const dates = completedDates(data)
  const { current, longest } = streakFromDates(dates, today)
  return { currentStreak: current, longestStreak: longest, totalDaysCompleted: dates.length }
}

export type GuestStreakDay = { date: string; status: StreakDayStatus }

/** One entry per day of `month` (YYYY-MM). */
export function guestStreakHistory(data: GuestData, month: string, today: string = todayKey()): { days: GuestStreakDay[] } {
  const todayStatus = dayStatus(data)
  const [y, m] = month.split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const days: GuestStreakDay[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    let status: StreakDayStatus
    if (daysBetween(today, date) > 0) status = "future"
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
  /** Verdict at the time of saving; null = no verdict (too little rated). Missing on older saves. */
  verdict?: "GREEN" | "YELLOW" | "RED" | null
}

export function parseGuestScans(raw: string | null): GuestScan[] {
  if (!raw) return []
  try {
    const list = JSON.parse(raw)
    return Array.isArray(list) ? (list as GuestScan[]) : []
  } catch {
    return []
  }
}

/** Newest first, capped at MAX_GUEST_SCANS. */
export function withScan(list: GuestScan[], scan: Omit<GuestScan, "id" | "savedAt">): GuestScan[] {
  const entry: GuestScan = { ...scan, id: `guest-scan-${Date.now()}`, savedAt: new Date().toISOString() }
  return [entry, ...list].slice(0, MAX_GUEST_SCANS)
}
