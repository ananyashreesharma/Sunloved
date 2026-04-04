"use client"

import { useMemo } from "react"
import { ProductCard } from "./ProductCard"
import { dummyProducts } from "@/lib/data"
import { transformApiProductToCard } from "@/lib/transform-product-card"
import { usePopularProductsQuery } from "@/hooks/use-sunloved-queries"

type PopularSwapsProps = {
  /** Optional server-fetched hits for first paint + hydration */
  initialProducts?: unknown[]
  /** When true, omit outer <section> (parent provides #tiles wrapper). */
  embedded?: boolean
}

export function PopularSwaps({ initialProducts, embedded = false }: PopularSwapsProps) {
  const { data, isPending, isError } = usePopularProductsQuery(initialProducts)

  const products = useMemo(() => {
    const fromQuery = data && Array.isArray(data) && data.length > 0 ? data : null
    const fromServer =
      initialProducts && Array.isArray(initialProducts) && initialProducts.length > 0
        ? initialProducts
        : null
    const raw = fromQuery || fromServer
    if (!raw) return dummyProducts
    return raw.map((p: any) => transformApiProductToCard(p))
  }, [data, initialProducts])

  const showLoading = isPending && !(initialProducts && initialProducts.length > 0)

  const inner = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Popular Swaps
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            See how we find alternatives for cult-favorites, saving you money
            without compromising on results.
          </p>
        </div>

        {showLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
            {isError && (
              <p className="text-center text-sm text-amber-800 mb-6">
                Live catalog unavailable — showing saved examples until the API responds.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} showCategoryBadge={false} />
              ))}
            </div>
          </>
        )}
      </div>
  )

  if (embedded) {
    return <div className="popular-swaps-embedded py-16 sm:py-24">{inner}</div>
  }

  return <section className="bg-transparent py-16 sm:py-24">{inner}</section>
}
