// A check anyone can open from a link: /c?p=<productId> or /c?i=<ingredient list>&n=<name>.
// The link carries the label, not the sender's skin profile, so whoever opens it gets the
// reading for their own skin. Used by the share buttons and the link-preview image.

import { annotateLabel, type AnalyzeIngredientsResponse, type AnnotatedLabel } from "@skinlens/shared"

const API = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api").replace(/\/+$/, "")
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://skinlens.in").replace(/\/+$/, "")

export type CheckParams = { p?: string; i?: string; n?: string }
export type SharedLabel = { name: string; inci: string }

// Our server calls on behalf of many visitors: identify it so the backend doesn't rate-limit it.
export const serverHeaders: Record<string, string> = process.env.INTERNAL_API_KEY ? { "x-internal-api-key": process.env.INTERNAL_API_KEY } : {}

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json()
  return (body?.data ?? body) as T
}

export function checkUrl(label: { productId?: string | null; inci: string; name: string }): string {
  const q = label.productId ? `p=${encodeURIComponent(label.productId)}` : `i=${encodeURIComponent(label.inci.slice(0, 1500))}&n=${encodeURIComponent(label.name.slice(0, 80))}`
  return `${SITE}/c?${q}`
}

/** Resolve link parameters to a label (server side). */
export async function resolveLabel(params: CheckParams): Promise<SharedLabel | null> {
  if (params.p) {
    const res = await fetch(`${API}/products/${encodeURIComponent(params.p)}/label`, { headers: serverHeaders, next: { revalidate: 3600 } })
    if (!res.ok) return null
    const l = await unwrap<{ name: string; brand: string; inci: string }>(res)
    const name = l.name.toLowerCase().startsWith(l.brand.toLowerCase()) ? l.name : `${l.brand} ${l.name}`
    return { name, inci: l.inci }
  }
  if (params.i) return { name: (params.n || "A skincare label").slice(0, 80), inci: params.i.slice(0, 1500) }
  return null
}

/** The general reading (no skin profile): what the preview image and page title show. */
export async function readLabel(inci: string): Promise<AnnotatedLabel | null> {
  const res = await fetch(`${API}/ingredients/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...serverHeaders },
    body: JSON.stringify({ ingredients: inci }),
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  return annotateLabel(await unwrap<AnalyzeIngredientsResponse>(res), null)
}

export const VERDICT_TEXT = { GREEN: "Looks fine.", YELLOW: "Use with caution.", RED: "Avoid this one." } as const
