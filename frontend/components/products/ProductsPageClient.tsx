"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { ChevronDown, X } from "lucide-react"
import { normalizeCategoryForApi, PRICE_RANGES } from "@/lib/products-filters"
import { transformApiProductToCard } from "@/lib/transform-product-card"
import { useProductListingQuery } from "@/hooks/use-sunloved-queries"

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api"

export function ProductsPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q")
  const itemParam = searchParams.get("item")
  const brandParam = searchParams.get("brand")
  const priceParam = searchParams.get("price")

  const [selectedBrand, setSelectedBrand] = useState<string | null>(brandParam || null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(itemParam || null)
  const [selectedPrice, setSelectedPrice] = useState<string | null>(priceParam || null)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)

  useEffect(() => {
    if (itemParam) setSelectedCategory(itemParam)
  }, [itemParam])

  const listingFilters = useMemo(
    () => ({
      query: query || "",
      selectedBrand,
      selectedCategory,
      selectedPrice,
    }),
    [query, selectedBrand, selectedCategory, selectedPrice]
  )

  const { data: rawProducts = [], isLoading: loading, isError, error } =
    useProductListingQuery(listingFilters)

  const products = useMemo(
    () => rawProducts.map((p: any) => transformApiProductToCard(p)),
    [rawProducts]
  )

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[],
    [products]
  )

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (selectedBrand && product.brand !== selectedBrand) return false

        if (selectedCategory) {
          const normalizedCat = normalizeCategoryForApi(selectedCategory)
          const catLower = normalizedCat.toLowerCase()
          if (product.categoryLabel && product.categoryLabel.toLowerCase() === catLower) return true
          if (product.name.toLowerCase().includes(catLower)) return true
          if (product.description?.toLowerCase().includes(catLower)) return true
          return false
        }

        if (selectedPrice) {
          const range = PRICE_RANGES.find((r) => r.label === selectedPrice)
          if (range) {
            let price = 0
            if (typeof product.pricePerUnit === "string") {
              price = parseFloat(product.pricePerUnit.replace("$", "").split("/")[0])
            } else {
              price = parseFloat(String(product.pricePerUnit))
            }
            if (price < range.min || price > range.max) return false
          }
        }

        return true
      }),
    [products, selectedBrand, selectedCategory, selectedPrice]
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (selectedBrand) params.set("brand", selectedBrand)
    if (selectedCategory) params.set("item", selectedCategory)
    if (selectedPrice) params.set("price", selectedPrice)

    const queryString = params.toString()
    router.push(queryString ? `/products?${queryString}` : "/products")
  }, [selectedBrand, selectedCategory, selectedPrice, query, router])

  const clearFilters = () => {
    setSelectedBrand(null)
    setSelectedCategory(null)
    setSelectedPrice(null)
  }

  const errorMessage =
    isError && error instanceof Error
      ? `Failed to load products: ${error.message}. Is the API running at ${apiBase}?`
      : isError
        ? `Failed to load products. Is the API running at ${apiBase}?`
        : null

  return (
    <main className="mesh-page">
      <Header />

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {query ? `Search: "${query}"` : "All Products"}
            </h1>
            <p className="text-lg text-gray-600">
              {query
                ? `Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} matching your search`
                : `Showing ${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} from database. Explore all skincare alternatives. Evidence-backed, ethically verified, and priced fairly.`}
            </p>
          </div>

          <div className="mb-8 space-y-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:border-primary transition"
              >
                <span className="text-sm font-medium">
                  {selectedBrand ? `Brand: ${selectedBrand}` : "Select Brand"}
                </span>
                <ChevronDown className={`w-4 h-4 transition ${showBrandDropdown ? "rotate-180" : ""}`} />
              </button>

              {showBrandDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand(null)
                      setShowBrandDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 border-b"
                  >
                    All Brands
                  </button>
                  {availableBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(brand)
                        setShowBrandDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition ${
                        selectedBrand === brand
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-600 self-center mr-2">Price:</span>
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => setSelectedPrice(selectedPrice === range.label ? null : range.label)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedPrice === range.label
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {(selectedBrand || selectedCategory || selectedPrice) && (
              <div className="flex items-center gap-2 pt-2">
                <div className="flex flex-wrap gap-2">
                  {selectedBrand && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>Brand: {selectedBrand}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBrand(null)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {selectedCategory && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>Category: {selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {selectedPrice && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>Price: {selectedPrice}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPrice(null)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">⚠️ Error Loading Products</p>
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading all products from database...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl">
                {errorMessage
                  ? "Unable to load products. Please check the error message above."
                  : products.length === 0
                    ? "No products found in database."
                    : "No products match your filters. Try adjusting them."}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
