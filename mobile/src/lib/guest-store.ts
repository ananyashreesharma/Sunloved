// Local-only "account" for guests, backed by AsyncStorage. The routine/streak logic is shared with
// the web app (packages/shared/src/guest.ts); this file only handles storage. When a guest signs in,
// the onboarding wizard's resume effect reads this store and pushes it to the backend, then clears it.

import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  GUEST_DATA_KEY,
  GUEST_SCANS_KEY,
  defaultGuestData,
  guestRoutine,
  guestStreak,
  guestStreakHistory,
  hasGuestProfile,
  parseGuestData,
  parseGuestScans,
  rollDay,
  withScan,
  withStep,
  withStepFrequency,
  withStepToggled,
  type GuestData,
  type GuestRoutineView,
  type GuestScan,
  type GuestStep,
  type GuestStreakDay,
  type NewGuestStep,
  type RoutineKind,
  type StreakSummary,
} from "@skinlens/shared"

export {
  STEP_ORDER,
  stepSortKey,
  type GuestData,
  type GuestStep,
  type GuestRoutineStepView,
  type GuestRoutineView,
  type GuestStreakDay,
  type GuestScan,
} from "@skinlens/shared"

// In-memory cache so callers within one app session can read synchronously after the first load —
// AsyncStorage has no sync API, unlike localStorage on web.
let cache: GuestData | null = null

async function readRaw(): Promise<GuestData> {
  try {
    return parseGuestData(await AsyncStorage.getItem(GUEST_DATA_KEY))
  } catch {
    return defaultGuestData()
  }
}

async function write(data: GuestData): Promise<void> {
  cache = data
  try {
    await AsyncStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data))
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
    const next = fn(rollDay(current))
    await write(next)
    return next
  })
}

export function loadGuestData(): Promise<GuestData> {
  return mutate((data) => data)
}

/** Synchronous snapshot of the last-loaded data, or defaults if nothing has been loaded yet this session. */
export function peekGuestData(): GuestData {
  return cache ?? defaultGuestData()
}

export async function hasGuestData(): Promise<boolean> {
  return hasGuestProfile(await loadGuestData())
}

export function clearGuestData(): Promise<void> {
  return enqueue(async () => {
    cache = null
    try {
      await AsyncStorage.removeItem(GUEST_DATA_KEY)
    } catch {
      /* nothing to clean up */
    }
  })
}

export function updateGuestData(patch: Partial<GuestData>): Promise<GuestData> {
  return mutate((data) => ({ ...data, ...patch }))
}

export function addGuestStep(input: NewGuestStep): Promise<GuestData> {
  return mutate((data) => withStep(data, input))
}

export function setGuestStepFrequency(stepId: string, frequency: GuestStep["frequency"]): Promise<GuestData> {
  return mutate((data) => withStepFrequency(data, stepId, frequency))
}

export function toggleGuestStep(stepId: string, period: RoutineKind): Promise<GuestData> {
  return mutate((data) => withStepToggled(data, stepId, period))
}

export async function getGuestRoutine(type: RoutineKind): Promise<GuestRoutineView> {
  return guestRoutine(await loadGuestData(), type)
}

export async function getGuestStreak(): Promise<StreakSummary> {
  return guestStreak(await loadGuestData())
}

export async function getGuestStreakHistory(month: string): Promise<{ days: GuestStreakDay[] }> {
  return guestStreakHistory(await loadGuestData(), month)
}

export function saveGuestScan(scan: Omit<GuestScan, "id" | "savedAt">): Promise<void> {
  // Shares the same queue as the guest data mutations above — a different AsyncStorage key, but
  // serializing it too closes off the identical read-then-write race for back-to-back scans.
  return enqueue(async () => {
    try {
      const list = parseGuestScans(await AsyncStorage.getItem(GUEST_SCANS_KEY))
      await AsyncStorage.setItem(GUEST_SCANS_KEY, JSON.stringify(withScan(list, scan)))
    } catch {
      /* storage unavailable */
    }
  })
}

export async function getGuestScans(): Promise<GuestScan[]> {
  try {
    return parseGuestScans(await AsyncStorage.getItem(GUEST_SCANS_KEY))
  } catch {
    return []
  }
}

export function clearGuestScans(): Promise<void> {
  return enqueue(async () => {
    try {
      await AsyncStorage.removeItem(GUEST_SCANS_KEY)
    } catch {
      /* nothing to clean up */
    }
  })
}
