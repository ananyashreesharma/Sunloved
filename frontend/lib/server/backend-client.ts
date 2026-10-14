/**
 * Server-only bridge to the NestJS backend's user-scoped ("guarded") endpoints.
 *
 * Only import this from Route Handlers (app/api/**) or Server Components/Actions — never from a
 * "use client" file. It attaches the shared internal key and the resolved user id, neither of
 * which the browser ever sees; client code calls the same-origin Next.js route handlers instead
 * (via frontend/lib/api.ts), which resolve the session server-side and proxy through here.
 */
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/authOptions"
import { getPublicApiBase } from "@/lib/api"

export class UnauthenticatedError extends Error {
  constructor() {
    super("No active session")
  }
}

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { userId?: string } | undefined)?.userId
  if (!userId) throw new UnauthenticatedError()
  return userId
}

/** Unwrap Nest's `{ data, meta }` envelope, mirroring lib/api.ts's client-side parseEnvelope. */
async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = await res.json()
  if (body?.data !== undefined) return body.data as T
  return body as T
}

/** Calls a guarded backend endpoint on behalf of the currently signed-in user. */
export async function backendFetch<T>(
  path: string,
  init: RequestInit & { userId?: string } = {},
): Promise<T> {
  const userId = init.userId ?? (await requireUserId())
  const res = await fetch(`${getPublicApiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      "x-user-id": userId,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Backend ${init.method ?? "GET"} ${path} failed: ${res.status} ${text.slice(0, 300)}`)
  }
  return parseEnvelope<T>(res)
}
