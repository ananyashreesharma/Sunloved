// Replaces the role of frontend/lib/server/backend-client.ts (which injected an internal shared-
// secret header after resolving identity from a same-origin cookie). There's no cookie here — every
// guarded call carries a real Bearer token, refreshed transparently on a 401. See the backend auth
// plan: this app never sends x-internal-api-key, only Authorization: Bearer <access token>.

import type { AnalyzeIngredientsResponse } from "@skinlens/shared"
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth-tokens"

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3001/api"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  // Coalesce concurrent 401s into a single refresh call.
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getRefreshToken()
      if (!refreshToken) return null
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) {
          await clearTokens()
          return null
        }
        // Wrapped in { data, meta, error } like every other backend response (see request()'s
        // comment) — this call can't go through request() itself without recursing on its own 401,
        // so it has to unwrap the envelope by hand.
        const body = await res.json()
        const { accessToken, refreshToken: nextRefreshToken } = (body?.data ?? body) as {
          accessToken: string
          refreshToken: string
        }
        await setTokens(accessToken, nextRefreshToken)
        return accessToken
      } catch {
        return null
      }
    })()
  }
  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

const REQUEST_TIMEOUT_MS = 15000

async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const accessToken = await getAccessToken()
  // A dropped/unreachable connection (dead wifi, backend down) doesn't always reject fetch()
  // promptly on its own — without this, a caller like ScanResultScreen is left showing its
  // "analyzing" spinner forever, with no error to react to and no way out but a manual swipe-back.
  // AbortController is passed too, but Promise.race is what actually guarantees this function
  // settles on schedule — some RN/Hermes fetch implementations don't reliably reject on abort()
  // for a connection stuck below the JS layer, and a request() that never settles is exactly the
  // bug this exists to prevent.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await Promise.race([
      fetch(`${API_BASE}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...init.headers,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new ApiError(0, "Request timed out — check your connection and try again.")), REQUEST_TIMEOUT_MS),
      ),
    ])
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(0, "Couldn't reach the server — check your connection and try again.")
  } finally {
    clearTimeout(timeout)
  }

  if (res.status === 401 && !isRetry) {
    const nextAccessToken = await refreshAccessToken()
    if (nextAccessToken) return request<T>(path, init, true)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new ApiError(res.status, body || `${path} ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  const body = await res.json()
  // Every backend response is wrapped by a global TransformInterceptor as
  // { data, meta, error } (see backend/src/common/interceptors/transform.interceptor.ts) — unwrap
  // it the same way the web client's parseEnvelope() does, so callers get the real payload.
  if (body && typeof body === "object" && "data" in body) return body.data as T
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}

// Port of frontend/lib/api.ts's analyzeIngredients(). POST /ingredients/analyze has no auth guard
// on the backend (see backend/src/modules/ingredients/ingredients.controller.ts) — it's a public
// endpoint, so this works for guests exactly like the web version's guest path does.
export type { AnalyzeIngredientsResponse } from "@skinlens/shared"

export function analyzeIngredients(ingredients: string): Promise<AnalyzeIngredientsResponse> {
  return api.post<AnalyzeIngredientsResponse>("/ingredients/analyze", { ingredients })
}

/** How many checked products we have for a country (the clean catalogue grows country by country). */
export function productCoverage(country: string) {
  return api.get<{ country: string; products: number }>(`/products/coverage?country=${encodeURIComponent(country)}`)
}

/** Send a checked label to the catalogue review queue: name, country and list, nothing about the person. */
export function submitLabel(country: string, name: string, ingredients: string) {
  return api.post<{ received: boolean }>("/products/submissions", { country, name, ingredients })
}

// Also public (no guard) — crowdsourced signal for ingredient names the catalog doesn't recognize.
export function reportUnknownIngredient(name: string, context?: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>("/ingredients/report-unknown", { name, context })
}

// Email login (see backend/src/modules/auth/auth.service.ts's "why email, not WhatsApp" note —
// same reasoning as the guest-CTA-first Login redesign this replaces). Both endpoints are public;
// verify is what actually creates the session by returning a JWT bearer pair.
export function sendEmailOtp(email: string): Promise<{ sent: boolean }> {
  return api.post<{ sent: boolean }>("/auth/email-otp/send", { email })
}

export function verifyEmailOtp(email: string, code: string): Promise<{ userId: string; isNew: boolean; accessToken: string; refreshToken: string }> {
  return api.post("/auth/email-otp/verify", { email, code })
}
