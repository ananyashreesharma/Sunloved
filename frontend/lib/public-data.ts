// Server-side reads for the public, search-indexed pages (ingredient pages, product pages, sitemap).

import { serverHeaders } from "./shared-check"

const API = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api").replace(/\/+$/, "")

async function get<T>(path: string, revalidate = 86400): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { headers: serverHeaders, next: { revalidate } })
    if (!res.ok) return null
    const body = await res.json()
    return (body?.data ?? body) as T
  } catch {
    return null
  }
}

export type IngredientPage = {
  name: string
  displayName: string | null
  zone: "green" | "yellow" | "red" | null
  description: string | null
  function: string | null
  source?: string
  /** Regulators that ban it outright in cosmetics: EU, ASEAN, CA, US. */
  bannedIn?: string[]
  productCount: number
  products: { id: string; name: string; brand: string; position: number }[]
}

export const ingredientIndex = () => get<{ slug: string; name: string }[]>("/ingredients/index")
export const ingredientPage = (slug: string) => get<IngredientPage>(`/ingredients/page/${encodeURIComponent(slug)}`)
export const productIndex = () => get<{ id: string; updatedAt: string }[]>("/products/index")

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function productTitle(p: { name: string; brand: string }) {
  return p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`
}
