// The five anonymous events behind the success numbers (see backend analytics module): first open,
// label checked, routine step ticked, routine completed, account created. A random install id, no
// ingredient text, no names. Fire-and-forget: never slows or breaks the app.

import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
import { getAccessToken } from "./auth-tokens"

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3001/api"
const INSTALL_KEY = "skinlens_install_id"

type EventType = "app_first_open" | "label_checked" | "routine_step_ticked" | "routine_completed" | "account_created"

let installId: string | null = null

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Called once at startup; records the first open the first time ever. */
export async function initAnalytics(): Promise<void> {
  try {
    installId = await AsyncStorage.getItem(INSTALL_KEY)
    if (!installId) {
      installId = randomId()
      await AsyncStorage.setItem(INSTALL_KEY, installId)
      track("app_first_open")
    }
  } catch {
    /* storage unavailable: skip analytics */
  }
}

export function track(type: EventType, detail?: string, country?: string | null): void {
  if (!installId) return
  const id = installId
  ;(async () => {
    const token = await getAccessToken().catch(() => null)
    await fetch(`${API_BASE}/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ type, installId: id, platform: Platform.OS === "ios" ? "ios" : "android", ...(detail ? { detail } : {}), ...(country ? { country } : {}) }),
    })
  })().catch(() => {})
}
