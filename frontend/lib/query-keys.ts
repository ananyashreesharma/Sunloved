import type { ProductListingFilters } from "@/lib/fetch-all-products"

export const queryKeys = {
  products: {
    search: (q: string) => ["products", "search", q] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    listing: (f: ProductListingFilters) => ["products", "listing", f] as const,
    popular: () => ["products", "popular", "niacinamide"] as const,
  },
  prices: (productId: string) => ["prices", productId] as const,
  comparisons: (productId: string) => ["comparisons", productId] as const,
  ingredients: {
    analyze: (ingredientsFingerprint: string) =>
      ["ingredients", "analyze", ingredientsFingerprint] as const,
  },
  ai: {
    summary: (productId: string) => ["ai", "summary", productId] as const,
  },
} as const
