"use client"

import { useEffect, useState } from "react"
import { getComparisons, getProduct } from "@/lib/api"
import { ComparisonCard } from "./ComparisonCard"
import { dummyProducts } from "@/lib/data"

interface ComparisonsClientProps {
  productId: string
}

export function ComparisonsClient({ productId }: ComparisonsClientProps) {
  const [product, setProduct] = useState<any>(null)
  const [comparisons, setComparisons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch product details
        const productData = await getProduct(productId)
        setProduct(productData)

        // Fetch comparisons
        const comparisonsData = await getComparisons(productId)
        setComparisons(Array.isArray(comparisonsData) ? comparisonsData : [])
      } catch (err) {
        console.error("Failed to fetch comparisons:", err)
        setError("Could not load comparable products")
        
        // Fallback to dummy data
        const dummyProduct = dummyProducts.find((p) => p.id === productId)
        setProduct(dummyProduct)
        setComparisons(dummyProducts.filter((p) => p.id !== productId))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading comparable products...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Product not found</p>
      </div>
    )
  }

  // Organize comparisons by match type
  const bestValue = comparisons.filter(c => c.matchType === 'best-value')
  const closestMatch = comparisons.filter(c => c.matchType === 'closest-match')
  const sensitiveSafe = comparisons.filter(c => c.matchType === 'sensitive-safe')

  // Helper to render comparison cards grid
  const renderComparisonGrid = (items: any[], title?: string) => {
    if (items.length === 0) return null
    return (
      <div>
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            {title}
            <span className="inline-flex items-center justify-center bg-teal-100 text-teal-700 rounded-full w-8 h-8 text-sm font-semibold">
              {items.length}
            </span>
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {items.map((comparison) => (
            <ComparisonCard key={comparison.id} comparison={comparison} baseProduct={product} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Product Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Find Comparable Products
        </h1>
        <p className="text-lg text-gray-600">
          Looking for alternatives to <span className="font-semibold text-teal-700">{product.name}</span> by {product.brand}?
        </p>
        <p className="text-gray-600 mt-2">
          We've found {comparisons.length} product{comparisons.length !== 1 ? 's' : ''} with 50%+ ingredient similarity
        </p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {/* Organized by Match Type */}
      {comparisons.length > 0 ? (
        <div>
          {/* Best Value First */}
          {renderComparisonGrid(bestValue, "💰 Best Value Alternatives")}
          
          {/* Closest Match */}
          {renderComparisonGrid(closestMatch, "⭐ Closest Ingredient Match")}
          
          {/* Sensitive Safe */}
          {renderComparisonGrid(sensitiveSafe, "🛡️ Ethically Sound Alternatives")}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No comparable products found with 50%+ ingredient similarity</p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-16 bg-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Find Comparables</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🧬 Ingredient Matching</h3>
            <p className="text-gray-700">We analyze all active ingredients and calculate a similarity score using Jaccard similarity, a proven method for comparing ingredient lists.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">💰 Price Analysis</h3>
            <p className="text-gray-700">We compare prices across multiple retailers to show you potential savings and better value alternatives.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🎯 Smart Ranking</h3>
            <p className="text-gray-700">We rank products by best value, ingredient match quality, and suitability for sensitive skin types.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

