// The routine, streak, profile and saved checks, from wherever they live: on this phone when
// signed out (guest-store), in the account when signed in (the same API the website uses). Screens
// call these instead of guest-store directly, so they work the same either way.
//
// Signed in, the last routine seen is kept on the phone, so the routine still shows offline.

import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  isDueOn,
  stepKind,
  stepSortKey,
  todayKey,
  type GuestData,
  type GuestRoutineStepView,
  type GuestRoutineView,
  type GuestScan,
  type GuestStep,
  type GuestStepPatch,
  type NewGuestStep,
  type RoutineKind,
  type RoutineResponse,
  type StepFrequency,
  type StreakSummary,
  type StreakHistoryDay,
} from "@skinlens/shared"
import { api } from "./api-client"
import { isSignedIn } from "./account"
import * as guest from "./guest-store"

/** A step as the editing screens see it. Signed in, a morning-and-night step is two rows on the server. */
export type EditableStep = GuestStep & { ids: string[] }

const CACHE_KEY = (type: RoutineKind) => `skinlens_account_routine_${type}`

function toView(r: RoutineResponse): GuestRoutineView {
  const today = todayKey()
  const steps: GuestRoutineStepView[] = [...r.steps]
    .sort((a, b) => stepSortKey(a.name) - stepSortKey(b.name))
    .map((s, i) => ({
      id: s.id,
      productId: s.productId,
      name: s.name,
      brand: s.brand,
      position: i,
      frequency: s.frequency,
      waitAfterMins: null,
      done: s.done,
      enrich: false,
      rest: s.rest ?? !isDueOn(s.frequency, today),
      kind: stepKind(s.name),
    }))
  const due = steps.filter((s) => !s.rest)
  return { routineId: "guest", type: r.type, steps, allDone: due.length > 0 && due.every((s) => s.done), conflicts: [] }
}

export async function getRoutine(type: RoutineKind): Promise<GuestRoutineView> {
  if (!isSignedIn()) return guest.getGuestRoutine(type)
  try {
    const view = toView(await api.get<RoutineResponse>(`/ouma/routine?type=${type}`))
    AsyncStorage.setItem(CACHE_KEY(type), JSON.stringify(view)).catch(() => {})
    return view
  } catch (e) {
    const cached = await AsyncStorage.getItem(CACHE_KEY(type)).catch(() => null)
    if (cached) return JSON.parse(cached) as GuestRoutineView
    throw e
  }
}

export async function toggleStep(stepId: string, period: RoutineKind): Promise<void> {
  if (!isSignedIn()) {
    await guest.toggleGuestStep(stepId, period)
    return
  }
  await api.patch(`/ouma/routine/steps/${stepId}/toggle`)
}

export async function getStreak(): Promise<StreakSummary> {
  if (!isSignedIn()) return guest.getGuestStreak()
  return api.get<StreakSummary>("/ouma/streak")
}

export async function getStreakHistory(month: string): Promise<{ days: StreakHistoryDay[] }> {
  if (!isSignedIn()) return guest.getGuestStreakHistory(month)
  return api.get<{ days: StreakHistoryDay[] }>(`/ouma/streak/history?month=${month}`)
}

/** Every step, for My products and the step sheet. */
export async function listSteps(): Promise<EditableStep[]> {
  if (!isSignedIn()) return (await guest.loadGuestData()).steps.map((s) => ({ ...s, ids: [s.id] }))
  const [m, n] = await Promise.all([getRoutine("morning"), getRoutine("night")])
  const out: EditableStep[] = []
  for (const [when, list] of [
    ["morning", m.steps],
    ["night", n.steps],
  ] as const) {
    for (const s of list) {
      const same = out.find((o) => o.name.toLowerCase() === s.name.toLowerCase())
      if (same) {
        same.when = "both"
        same.ids.push(s.id)
      } else {
        out.push({ id: s.id, ids: [s.id], name: s.name, brand: s.brand, when, frequency: s.frequency, kind: s.kind ?? undefined })
      }
    }
  }
  return out
}

/** Steps shaped like guest data, for "goes after X, before Y". */
export async function stepsAsGuestData(): Promise<GuestData> {
  const g = await guest.loadGuestData()
  if (!isSignedIn()) return g
  return { ...g, steps: await listSteps() }
}

export async function addStep(input: NewGuestStep): Promise<void> {
  if (!isSignedIn()) {
    await guest.addGuestStep(input)
    return
  }
  await api.post("/ouma/routine/steps", { type: input.when, customName: input.name, frequency: input.frequency })
}

export async function updateStep(step: EditableStep, patch: GuestStepPatch): Promise<void> {
  if (!isSignedIn()) {
    await guest.updateGuestStep(step.id, patch)
    return
  }
  // The server can't move a step between routines: changing morning/night re-creates it.
  if (patch.when && patch.when !== step.when) {
    await Promise.all(step.ids.map((id) => api.del(`/ouma/routine/steps/${id}`)))
    await api.post("/ouma/routine/steps", { type: patch.when, customName: patch.name ?? step.name, frequency: patch.frequency ?? step.frequency })
    return
  }
  await Promise.all(step.ids.map((id) => api.patch(`/ouma/routine/steps/${id}`, { customName: patch.name, frequency: patch.frequency })))
}

export async function removeStep(step: EditableStep): Promise<void> {
  if (!isSignedIn()) {
    await guest.removeGuestStep(step.id)
    return
  }
  await Promise.all(step.ids.map((id) => api.del(`/ouma/routine/steps/${id}`)))
}

export async function setStepFrequency(stepId: string, frequency: StepFrequency): Promise<void> {
  if (!isSignedIn()) {
    await guest.setGuestStepFrequency(stepId, frequency)
    return
  }
  await api.patch(`/ouma/routine/steps/${stepId}`, { frequency })
}

export type Profile = { country: string | null; skinType: string | null; concerns: string[] }

/** The skin profile. Always mirrored on the phone (verdicts read it offline). */
export async function saveProfile(p: Partial<Profile>): Promise<void> {
  const next = await guest.updateGuestData(p)
  if (isSignedIn() && next.skinType) {
    await api
      .patch("/auth/onboarding", { skinType: next.skinType, concerns: next.concerns, ...(next.country ? { country: next.country } : {}) })
      .catch(() => {})
  }
}

type ServerScan = { id: string; name: string; rawIngredientText: string | null; verdict?: "GREEN" | "YELLOW" | "RED" | null; coverage: number | null; score: number | null; flagCount: number; scannedAt: string }

export async function saveScan(scan: Omit<GuestScan, "id" | "savedAt">): Promise<void> {
  await guest.saveGuestScan(scan)
  if (isSignedIn() && scan.rawIngredientText) {
    await api
      .post("/ouma/scans", {
        rawIngredientText: scan.rawIngredientText,
        flagCount: scan.flagCount,
        scanResult: { title: scan.title, verdict: scan.verdict ?? null, coverage: scan.coverage, score: scan.score },
      })
      .catch(() => {})
  }
}

export async function getScans(): Promise<GuestScan[]> {
  if (!isSignedIn()) return guest.getGuestScans()
  try {
    const rows = await api.get<ServerScan[]>("/ouma/scans/recent")
    return rows.map((r) => ({
      id: r.id,
      title: r.name,
      brand: "",
      savedAt: r.scannedAt,
      flagCount: r.flagCount,
      coverage: r.coverage ?? 0,
      score: r.score ?? 0,
      rawIngredientText: r.rawIngredientText ?? undefined,
      verdict: r.verdict,
    }))
  } catch {
    return guest.getGuestScans()
  }
}
