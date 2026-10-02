import { searchProducts } from "@/lib/api"
import { normalizeCategoryForApi, PRICE_RANGES } from "@/lib/products-filters"

export type ProductListingFilters = {
  query: string
  selectedBrand: string | null
  selectedCategory: string | null
  selectedPrice: string | null
}

export async function fetchAllProductsForListing({
  query,
  selectedBrand,
  selectedCategory,
  selectedPrice,
}: ProductListingFilters) {
  const searchQuery = query || ""
  const filters = {
    ...(selectedBrand && { brand: selectedBrand }),
    ...(selectedCategory && { category: normalizeCategoryForApi(selectedCategory) }),
    ...(selectedPrice && {
      minPrice: PRICE_RANGES.find((r) => r.label === selectedPrice)?.min,
      maxPrice: PRICE_RANGES.find((r) => r.label === selectedPrice)?.max,
    }),
  }

  let allProducts: any[] = []
  let currentPage = 1
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    const results = await searchProducts(searchQuery, currentPage, pageSize, filters)
    const productsArray = results.products

    if (Array.isArray(productsArray) && productsArray.length > 0) {
      allProducts = [...allProducts, ...productsArray]
    }

    if (results.meta) {
      const totalPages = results.meta.totalPages || 1
      hasMore = currentPage < totalPages
      currentPage++
    } else {
      hasMore = false
    }
  }

  return allProducts
}
