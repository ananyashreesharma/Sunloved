"use client"

// Local-only "account" for guests, backed by localStorage. The routine/streak logic is shared with
// the mobile app (packages/shared/src/guest.ts); this file only handles storage. When a guest signs
// in, OumaOnboardingClient's resume effect reads this store and pushes it to the backend, then clears it.

import {
  GUEST_DATA_KEY,
  GUEST_SCANS_KEY,
  guestRoutine,
  guestStreak,
  guestStreakHistory,
  hasGuestProfile,
  parseGuestData,
  parseGuestScans,
  rollDay,
  withScan,
  withStep,
  withStepToggled,
  type GuestData,
  type GuestRoutineView,
  type GuestScan,
  type GuestStreakDay,
  type NewGuestStep,
  type RoutineKind,
  type StreakSummary,
} from "@skinlens/shared"

export {
  STEP_ORDER,
  SKIN_TYPE_LABELS,
  CONCERN_LABELS,
  stepSortKey,
  type GuestData,
  type GuestStep,
  type GuestRoutineStepView,
  type GuestRoutineView,
  type GuestStreakDay,
  type GuestScan,
} from "@skinlens/shared"

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — the app still works, it just won't remember between visits */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* nothing to clean up */
  }
}

function save(data: GuestData): GuestData {
  write(GUEST_DATA_KEY, JSON.stringify(data))
  return data
}

export function loadGuestData(): GuestData {
  return save(rollDay(parseGuestData(read(GUEST_DATA_KEY))))
}

export function hasGuestData(): boolean {
  return hasGuestProfile(loadGuestData())
}

export function clearGuestData() {
  remove(GUEST_DATA_KEY)
}

export function updateGuestData(patch: Partial<GuestData>): GuestData {
  return save({ ...loadGuestData(), ...patch })
}

export function addGuestStep(input: NewGuestStep): GuestData {
  return save(withStep(loadGuestData(), input))
}

export function toggleGuestStep(stepId: string): GuestData {
  return save(withStepToggled(loadGuestData(), stepId))
}

export function getGuestRoutine(type: RoutineKind): GuestRoutineView {
  return guestRoutine(loadGuestData(), type)
}

export function getGuestStreak(): StreakSummary {
  return guestStreak(loadGuestData())
}

export function getGuestStreakHistory(month: string): { days: GuestStreakDay[] } {
  return guestStreakHistory(loadGuestData(), month)
}

export function saveGuestScan(scan: Omit<GuestScan, "id" | "savedAt">): void {
  write(GUEST_SCANS_KEY, JSON.stringify(withScan(parseGuestScans(read(GUEST_SCANS_KEY)), scan)))
}

export function getGuestScans(): GuestScan[] {
  return parseGuestScans(read(GUEST_SCANS_KEY))
}

export function clearGuestScans() {
  remove(GUEST_SCANS_KEY)
}
