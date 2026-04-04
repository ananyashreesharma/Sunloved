"use client"

import { useQuery } from "@tanstack/react-query"
import {
  searchProducts,
  getProduct,
  getProductPrices,
  getComparisons,
  analyzeIngredients,
  generateProductSummary,
} from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import type { ProductListingFilters } from "@/lib/fetch-all-products"
import { fetchAllProductsForListing } from "@/lib/fetch-all-products"

/**
 * React Query hooks per domain. Prefer these over calling `lib/api` directly in components
 * so cache keys, stale times, and `enabled` flags stay consistent.
 */

const stale = {
  products: 60 * 1000,
  prices: 2 * 60 * 1000,
  comparisons: 60 * 1000,
  ingredients: 5 * 60 * 1000,
  ai: 10 * 60 * 1000,
}

export function usePopularProductsQuery(initialData?: unknown[]) {
  return useQuery({
    queryKey: queryKeys.products.popular(),
    queryFn: async () => {
      const results = await searchProducts("niacinamide", 1, 20)
      const arr = results.products || results.data || []
      return Array.isArray(arr) ? arr : []
    },
    staleTime: stale.products,
    ...(initialData && initialData.length > 0
      ? { initialData: initialData as any[] }
      : {}),
  })
}

export function useProductListingQuery(filters: ProductListingFilters) {
  return useQuery({
    queryKey: queryKeys.products.listing(filters),
    queryFn: () => fetchAllProductsForListing(filters),
    staleTime: stale.products,
  })
}

export function useProductQuery(id: string, initialData?: unknown) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => getProduct(id),
    staleTime: stale.products,
    initialData: initialData as any,
  })
}

export function useProductPricesQuery(productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.prices(productId || ""),
    queryFn: () => getProductPrices(productId!),
    enabled: !!productId,
    staleTime: stale.prices,
    select: (data) => (Array.isArray(data) ? data : []),
  })
}

export function useComparisonsQuery(productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comparisons(productId || ""),
    queryFn: () => getComparisons(productId!),
    enabled: !!productId,
    staleTime: stale.comparisons,
    select: (data) => (Array.isArray(data) ? data : []),
  })
}

export function useIngredientAnalysisQuery(ingredientsList: string[] | undefined) {
  const fingerprint = ingredientsList?.join("|") ?? ""
  return useQuery({
    queryKey: queryKeys.ingredients.analyze(fingerprint),
    queryFn: () => analyzeIngredients(ingredientsList!.join(", ")),
    enabled: !!ingredientsList && ingredientsList.length > 0,
    staleTime: stale.ingredients,
  })
}

export function useProductSummaryQuery(
  product: {
    id?: string
    name?: string
    brand?: string
    category?: string
    description?: string
    ingredients?: string[]
    fragranceFree?: boolean
    alcoholFree?: boolean
    parabenFree?: boolean
    sulfateFree?: boolean
    crueltyFree?: boolean
    vegan?: boolean
  } | null
) {
  const id = product?.id
  return useQuery({
    queryKey: queryKeys.ai.summary(id || "none"),
    queryFn: () =>
      generateProductSummary({
        name: product!.name || "",
        brand: product!.brand || "",
        category: product!.category,
        description: product!.description || "",
        ingredients: product!.ingredients || [],
        fragranceFree: product!.fragranceFree,
        alcoholFree: product!.alcoholFree,
        parabenFree: product!.parabenFree,
        sulfateFree: product!.sulfateFree,
        crueltyFree: product!.crueltyFree,
        vegan: product!.vegan,
      }),
    enabled: !!product && !!id && !!product.name,
    staleTime: stale.ai,
  })
}
