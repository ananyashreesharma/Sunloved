"use client"

import { useEffect, useState } from "react"
import { searchProducts } from "@/lib/api"
import { ProductCard } from "./ProductCard"
import { dummyProducts } from "@/lib/data"

export function PopularSwaps() {
  const [products, setProducts] = useState(dummyProducts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch some popular products (niacinamide as example)
    const fetchPopular = async () => {
      try {
        setLoading(true)
        const results = await searchProducts("niacinamide")
        console.log('📦 Popular Swaps results:', results)
        
        // Handle the API response structure: { data, meta, error, products }
        const productsArray = results.products || results.data || results || []
        if (Array.isArray(productsArray) && productsArray.length > 0) {
          setProducts(productsArray)
        }
      } catch (error) {
        console.error("❌ Failed to fetch popular products:", error)
        // Keep using dummy data as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchPopular()
  }, [])

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Popular Swaps
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            See how we find alternatives for cult-favorites, saving you money
            without compromising on results.
          </p>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showCategoryBadge={false} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

