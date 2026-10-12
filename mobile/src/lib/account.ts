// Who's signed in on this phone, and moving the phone's routine into an account.
//
// Signing in is optional. Signed out, everything lives on the phone (guest-store). Signed in, the
// routine, streak, profile and saved checks live in the account (lib/data.ts routes there), so they
// follow the person to a new phone and to the website. At sign-in, whatever was built on the phone
// moves into the account: steps (the server skips any it already has), skin profile, the days
// completed so far (so the streak survives), and saved checks.

import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { GuestStep, MeResponse, RoutineResponse } from "@skinlens/shared"
import { api } from "./api-client"
import { clearTokens, getRefreshToken, setTokens } from "./auth-tokens"
import { track } from "./analytics"
import { clearGuestData, clearGuestScans, getGuestScans, loadGuestData, updateGuestData } from "./guest-store"

type State = { signedIn: boolean; email: string | null; ready: boolean }

let state: State = { signedIn: false, email: null, ready: false }
const listeners = new Set<(s: State) => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l(state))
}

export function isSignedIn(): boolean {
  return state.signedIn
}

export function useAccount(): State {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    setS(state)
    return () => {
      listeners.delete(setS)
    }
  }, [])
  return s
}

/** Called once at startup, before screens load data. */
export async function initAccount(): Promise<void> {
  const signedIn = !!(await getRefreshToken().catch(() => null))
  set({ signedIn, ready: true })
  if (signedIn) {
    api
      .get<MeResponse>("/auth/me")
      .then((me) => set({ email: me.email }))
      .catch(() => {})
  }
}

const SYNCED_SCANS_KEY = "skinlens_synced_scan_ids"

/** After a successful email code: store the session and move this phone's data into the account. */
export async function completeSignIn(accessToken: string, refreshToken: string, isNew = false): Promise<void> {
  await setTokens(accessToken, refreshToken)
  set({ signedIn: true })
  if (isNew) track("account_created")
  const me = await api.get<MeResponse>("/auth/me")
  set({ email: me.email })
  const g = await loadGuestData()

  // Skin profile: the account's wins if it has one; otherwise the phone's goes up.
  if (me.onboardingDone && me.skinType) {
    await updateGuestData({ country: me.country ?? g.country, skinType: me.skinType.code, concerns: me.concerns.map((c) => c.code) })
  } else if (g.skinType) {
    await api.patch("/auth/onboarding", { skinType: g.skinType, concerns: g.concerns, ...(g.country ? { country: g.country } : {}) })
  }

  // Steps (the server ignores ones it already has).
  for (const s of g.steps) {
    await api.post("/ouma/routine/steps", { type: s.when, customName: s.name, frequency: s.frequency })
  }

  // Days completed on this phone, so the streak carries over.
  const days = Object.entries(g.history).map(([date, status]) => ({ date, status }))
  if (days.length) await api.post("/ouma/streak/import", { days })

  // Saved checks, once each.
  const synced = new Set<string>(JSON.parse((await AsyncStorage.getItem(SYNCED_SCANS_KEY)) ?? "[]"))
  for (const scan of await getGuestScans()) {
    if (synced.has(scan.id) || !scan.rawIngredientText) continue
    await api.post("/ouma/scans", {
      rawIngredientText: scan.rawIngredientText,
      flagCount: scan.flagCount,
      scanResult: { title: scan.title, verdict: scan.verdict ?? null, coverage: scan.coverage, score: scan.score },
    })
    synced.add(scan.id)
  }
  await AsyncStorage.setItem(SYNCED_SCANS_KEY, JSON.stringify([...synced]))
}

/** Sign out on this phone. The account keeps everything; the phone keeps its own copy too. */
export async function signOut(): Promise<void> {
  // Leave this phone with the account's current steps, so it works the same after signing out.
  try {
    const [m, n] = await Promise.all([api.get<RoutineResponse>("/ouma/routine?type=morning"), api.get<RoutineResponse>("/ouma/routine?type=night")])
    const g = await loadGuestData()
    const steps: GuestStep[] = []
    for (const [when, list] of [["morning", m.steps], ["night", n.steps]] as const) {
      for (const s of list) {
        const same = steps.find((x) => x.name.toLowerCase() === s.name.toLowerCase())
        if (same) same.when = "both"
        else steps.push({ id: g.steps.find((x) => x.name.toLowerCase() === s.name.toLowerCase())?.id ?? `guest-${s.id}`, name: s.name, brand: s.brand, when, frequency: s.frequency })
      }
    }
    await updateGuestData({ steps })
  } catch {
    /* offline: keep the phone's copy as it is */
  }
  const refreshToken = await getRefreshToken().catch(() => null)
  if (refreshToken) await api.post("/auth/logout", { refreshToken }).catch(() => {})
  await clearTokens()
  set({ signedIn: false, email: null })
}

/** Permanently delete the account, then clear this phone too. Throws if the server can't be reached. */
export async function deleteAccount(): Promise<void> {
  await api.del("/auth/me")
  await clearTokens()
  await Promise.all([clearGuestData(), clearGuestScans(), AsyncStorage.removeItem(SYNCED_SCANS_KEY)])
  set({ signedIn: false, email: null })
}
