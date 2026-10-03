import type {
  AnalyzeIngredientsResponse,
  MeResponse,
  RoutineResponse,
  StreakHistoryDay,
} from "@skinlens/shared"

// Response shapes are shared with the mobile app; re-exported so existing imports keep working.
export type {
  AnalyzeIngredientsResponse,
  MeResponse,
  RoutineConflict,
  RoutineResponse,
  RoutineStepDto,
  StreakHistoryDay,
} from "@skinlens/shared"

/**
 * Thin HTTP layer for the Nest API. All routes assume the global `/api` prefix.
 * Set NEXT_PUBLIC_API_BASE in .env.local (see .env.example).
 *
 * Must be an **absolute** URL (include `http://`). If you use `/api` alone, the browser
 * calls the Next dev server and you get HTML 404 pages instead of JSON.
 */
const WRONG_HOST_HINT =
  "Keep NEXT_PUBLIC_API_BASE=http://localhost:3001/api in frontend/.env.local and restart `next dev` after edits."

function resolvePublicApiBase(): string {
  const fallback = "http://localhost:3001/api"
  let raw = (process.env.NEXT_PUBLIC_API_BASE ?? "").trim()
  if (!raw) return fallback
  raw = raw.replace(/\/+$/, "")
  if (raw.startsWith("/")) {
    if (typeof window !== "undefined") {
      console.warn(
        `[api] NEXT_PUBLIC_API_BASE="${raw}" is relative — requests would hit Next.js, not Nest. Using ${fallback}. ${WRONG_HOST_HINT}`,
      )
    }
    return fallback
  }
  if (!/^https?:\/\//i.test(raw)) {
    raw = `http://${raw}`
  }
  try {
    const u = new URL(raw)
    const path = (u.pathname || "").replace(/\/+$/, "") || ""
    if (path === "" || path === "/") {
      return `${u.origin}/api`
    }
    return `${u.origin}${path}`
  } catch {
    return fallback
  }
}

const API_BASE = resolvePublicApiBase()

/** Resolved Nest API root (for error copy / debugging). */
export function getPublicApiBase(): string {
  return API_BASE
}



/** Unwrap Nest `{ data, meta }` envelope */
async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = await res.json()
  if (body?.data !== undefined) return body.data as T
  return body as T
}




// ─── Same-origin Next.js route handlers (session-authenticated, no secrets in the browser) ──────
// These proxy to guarded Nest endpoints; see frontend/lib/server/backend-client.ts and the plan at
// .claude/plans for the auth-bridge design. Never call the Nest backend's /ouma/* directly from
// client code for these — the guard requires a server-resolved user id.




export async function getRoutine(type: "morning" | "night"): Promise<RoutineResponse> {
  const res = await fetch(`/api/routine?type=${type}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`routine ${res.status}`)
  return res.json()
}



export async function createRoutineStep(input: {
  type: "morning" | "night" | "both"
  productId?: string
  customName?: string
  frequency?: "daily" | "alternate" | "twice_weekly"
}): Promise<{ created: string[] }> {
  const res = await fetch(`/api/routine/steps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`create routine step ${res.status}`)
  return res.json()
}

export async function toggleRoutineStep(
  stepId: string,
): Promise<{ done: boolean; allDone: boolean; streak: { currentStreak: number; longestStreak: number } }> {
  const res = await fetch(`/api/routine/steps/${stepId}/toggle`, { method: "PATCH" })
  if (!res.ok) throw new Error(`toggle routine step ${res.status}`)
  return res.json()
}

export async function updateRoutineStep(
  stepId: string,
  input: { customName?: string; frequency?: "daily" | "alternate" | "twice_weekly" },
): Promise<{ id: string }> {
  const res = await fetch(`/api/routine/steps/${stepId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`update routine step ${res.status}`)
  return res.json()
}

export async function deleteRoutineStep(stepId: string): Promise<{ deleted: string }> {
  const res = await fetch(`/api/routine/steps/${stepId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`delete routine step ${res.status}`)
  return res.json()
}

export async function getStreak(): Promise<{ currentStreak: number; longestStreak: number; totalDaysCompleted: number }> {
  const res = await fetch(`/api/streak`, { cache: "no-store" })
  if (!res.ok) throw new Error(`streak ${res.status}`)
  return res.json()
}


export async function getStreakHistory(month: string): Promise<{ days: StreakHistoryDay[] }> {
  const res = await fetch(`/api/streak/history?month=${month}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`streak history ${res.status}`)
  return res.json()
}









export async function getMe(): Promise<MeResponse> {
  const res = await fetch(`/api/me`, { cache: "no-store" })
  if (!res.ok) throw new Error(`me ${res.status}`)
  return res.json()
}

export async function completeOnboarding(input: { skinType: string; concerns: string[]; country?: string }): Promise<{ onboardingDone: boolean }> {
  const res = await fetch(`/api/onboarding`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`onboarding ${res.status}`)
  return res.json()
}




export async function analyzeIngredients(ingredients: string): Promise<AnalyzeIngredientsResponse> {
  const res = await fetch(`${API_BASE}/ingredients/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  })
  if (!res.ok) throw new Error("Failed to analyze ingredients")
  return parseEnvelope<AnalyzeIngredientsResponse>(res)
}






export async function updateCountry(country: string): Promise<{ country: string }> {
  const res = await fetch(`/api/country`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country }),
  })
  if (!res.ok) throw new Error(`country ${res.status}`)
  return res.json()
}
