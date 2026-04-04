/**
 * Thin HTTP layer for the Nest API. All routes assume the global `/api` prefix.
 * Set NEXT_PUBLIC_API_BASE in .env.local (see .env.example).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api"

const logApiDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") console.log("[api]", ...args)
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
    console.error("[api] searchProducts failed:", res.status, errorText)
    throw new Error(`Failed to search products: ${res.status} ${errorText}`)
  }

  const result = await res.json()

  // `products` mirrors legacy callers; spread keeps `meta` and other fields.
  return {
    products: result.data,
    ...result,
  }
}

export async function getProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`)
  if (!res.ok) throw new Error("Failed to fetch product")
  const result = await res.json()
  return result.data || result
}

export async function analyzeIngredients(ingredients: string) {
  const res = await fetch(`${API_BASE}/ingredients/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  })
  if (!res.ok) throw new Error("Failed to analyze ingredients")
  const result = await res.json()
  return result.data || result
}

export async function getProductPrices(productId: string) {
  const res = await fetch(`${API_BASE}/prices/${productId}`)
  if (!res.ok) throw new Error("Failed to fetch prices")
  const result = await res.json()
  return result.data || result
}

export async function getComparisons(productId: string) {
  const res = await fetch(`${API_BASE}/comparisons/${productId}`)
  if (!res.ok) throw new Error("Failed to fetch comparisons")
  const result = await res.json()
  return result.data || result
}

export async function generateProductSummary(productData: {
  name: string;
  brand: string;
  category?: string;
  description?: string;
  ingredients?: string[];
  fragranceFree?: boolean;
  alcoholFree?: boolean;
  parabenFree?: boolean;
  sulfateFree?: boolean;
  crueltyFree?: boolean;
  vegan?: boolean;
}) {
  const res = await fetch(`${API_BASE}/ai/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
    cache: "no-store",
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error("[api] generateProductSummary failed:", res.status, errorText)
    throw new Error(`Failed to generate summary: ${res.status} ${errorText}`)
  }

  const result = await res.json()
  return result.data || null
}

