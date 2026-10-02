import type {
  AnalyzeIngredientsResponse,
  ContributionResult,
  MeResponse,
  NotificationPreferences,
  ProductComparison,
  ProductDetail,
  RecentScanEntry,
  RoutineResponse,
  StreakHistoryDay,
} from "@skinlens/shared"

// Response shapes are shared with the mobile app; re-exported so existing imports keep working.
export type {
  AnalyzeIngredientsResponse,
  ContributionResult,
  MeResponse,
  NotificationPreferences,
  ProductComparison,
  ProductDetail,
  RecentScanEntry,
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

/** When fetch URL is correct but body is HTML, something on that port is not Nest (usually Next on 3001). */
function apiReturnedHtmlHelp(resUrl: string): string {
  const on3001 = /:3001(\/|$)/.test(resUrl)
  const portHint = on3001
    ? " Port 3001 is almost certainly not Nest: Next.js often binds there if 3000 is busy. Fix: stop whatever uses 3001 (`lsof -ti tcp:3001 | xargs kill`), run `cd backend && npm run start:dev`, then start the site on another port, e.g. `cd frontend && npx next dev -p 3000`. Verify in a terminal: `curl -s http://localhost:3001/api/health` should be JSON (\"status\":\"ok\"), not `<!DOCTYPE` HTML."
    : " Something on that host:port is serving a web app, not the Nest API."
  return `${WRONG_HOST_HINT}${portHint}`
}

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

function isProbablyHtmlError(res: Response, body: string): boolean {
  const ct = res.headers.get("content-type") || ""
  return ct.includes("text/html") || body.trimStart().startsWith("<!")
}

/** Quick reachability check (Nest `/api/health`). Times out so the UI does not sit on "Checking…" forever. */
export async function checkApiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return false
    const ct = res.headers.get("content-type") || ""
    if (ct.includes("text/html")) return false
    const text = await res.text()
    return !text.trimStart().startsWith("<!")
  } catch {
    return false
  }
}

const logApiDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") console.log("[api]", ...args)
}

/** Unwrap Nest `{ data, meta }` envelope */
async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = await res.json()
  if (body?.data !== undefined) return body.data as T
  return body as T
}

export type InsightsSummaryResponse = {
  catalogProducts: number
  catalogIngredients: number
  productsWithPrices: number
  avgProductScore: number | null
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


export async function contributeProduct(input: {
  productName: string
  brandName: string
  country: string
  category?: string
  rawIngredientText: string
}): Promise<ContributionResult> {
  const res = await fetch(`/api/contributions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`contribute product ${res.status}`)
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

export type MyProduct = {
  id: string
  name: string
  brand: string
  usage: string[]
  scan: Record<string, unknown> | null
}

export async function getMyProducts(): Promise<{ products: MyProduct[] }> {
  const res = await fetch(`/api/my-products`, { cache: "no-store" })
  if (!res.ok) throw new Error(`my-products ${res.status}`)
  return res.json()
}


export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await fetch(`/api/notification-preferences`, { cache: "no-store" })
  if (!res.ok) throw new Error(`notification-preferences ${res.status}`)
  return res.json()
}

export async function updateNotificationPreferences(
  input: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await fetch(`/api/notification-preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`update notification-preferences ${res.status}`)
  return res.json()
}

export async function saveScan(input: {
  rawIngredientText: string
  scanResult: Record<string, unknown>
  flagCount: number
  productId?: string
}): Promise<{ id: string }> {
  const res = await fetch(`/api/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`save scan ${res.status}`)
  return res.json()
}


export async function getRecentScans(): Promise<RecentScanEntry[]> {
  const res = await fetch(`/api/scans/recent`, { cache: "no-store" })
  if (!res.ok) throw new Error(`recent scans ${res.status}`)
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

export async function reportUnknownIngredient(name: string, context?: string): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/ingredients/report-unknown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, context }),
  })
  if (!res.ok) throw new Error(`report-unknown ${res.status}`)
  return parseEnvelope<{ ok: true }>(res)
}

export async function searchProducts(
  query: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: Record<string, unknown>
) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  if (query?.trim()) params.set("query", query.trim())

  if (filters?.brand) params.set("brand", String(filters.brand))
  if (filters?.category) params.set("category", String(filters.category))
  if (filters?.minPrice !== undefined) params.set("minPrice", String(filters.minPrice))
  if (filters?.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice))
  if (filters?.sort) params.set("sort", String(filters.sort))

  const url = `${API_BASE}/products/search?${params.toString()}`
  logApiDebug("GET", url)

  const res = await fetch(url, { cache: "no-store" })

  if (!res.ok) {
    const errorText = await res.text()
    console.error("[api] searchProducts failed:", res.status, res.url, errorText.slice(0, 200))
    if (isProbablyHtmlError(res, errorText)) {
      throw new Error(`Failed to search products: got HTML instead of JSON from ${res.url}. ${apiReturnedHtmlHelp(res.url)}`)
    }
    throw new Error(`Failed to search products: ${res.status} ${errorText.slice(0, 500)}`)
  }

  const result = (await res.json()) as {
    data: unknown
    meta?: {
      page?: number
      pageSize?: number
      total?: number
      totalPages?: number
      matchRanked?: boolean
      matchRankNote?: string
    }
  }

  const products = Array.isArray(result.data) ? result.data : []

  return {
    products,
    meta: result.meta,
  }
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const res = await fetch(`${API_BASE}/products/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch product")
  return parseEnvelope<ProductDetail>(res)
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

export async function getProductPrices(productId: string) {
  const res = await fetch(`${API_BASE}/prices/${productId}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch prices")
  return parseEnvelope<unknown[]>(res)
}

export async function getComparisons(productId: string) {
  const res = await fetch(`${API_BASE}/comparisons/${productId}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch comparisons")
  return parseEnvelope<unknown>(res)
}

export async function fetchInsightsSummary(): Promise<InsightsSummaryResponse> {
  const res = await fetch(`${API_BASE}/ouma/insights-summary`, { cache: "no-store" })
  if (!res.ok) throw new Error(`insights-summary ${res.status}`)
  return parseEnvelope<InsightsSummaryResponse>(res)
}

export async function browseProducts(page = 1, pageSize = 24, query = "", category?: string) {
  return searchProducts(query || "", page, pageSize, category ? { category } : undefined)
}

export async function getComparisonsList(productId: string): Promise<ProductComparison[]> {
  const res = await fetch(`${API_BASE}/comparisons/${productId}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`comparisons ${res.status}`)
  const data = await parseEnvelope<ProductComparison[]>(res)
  return Array.isArray(data) ? data : []
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
