"use client"

import { useState } from "react"
import { Product } from "@/lib/data"
import { Button } from "./ui/button"
import { Share2 } from "lucide-react"
import Link from "next/link"
import { PricesPopup } from "./PricesPopup"

interface ProductCardProps {
  product: Product
  showCategoryBadge?: boolean
}

export function ProductCard({ product, showCategoryBadge = true }: ProductCardProps) {
  const [showPricesPopup, setShowPricesPopup] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        {/* Header with Category Badge */}
        {showCategoryBadge && (
          <div className="px-6 pt-6 pb-4 flex items-start justify-between">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${product.categoryBadgeColor}`}>
              {product.categoryLabel}
            </span>
          </div>
        )}

        {/* Product Image Placeholder */}
        <div className="px-6 pb-4 flex justify-center">
          <div className="w-24 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-4xl">🧴</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            For {product.originalProduct}
          </p>
          <p className="text-sm text-gray-700 mb-4">
            {product.description}
          </p>
        </div>

        {/* Price and Savings */}
        <div className="px-6 pb-4 flex gap-4">
          <div className="bg-green-50 px-3 py-2 rounded-lg flex-1">
            <span className="text-sm font-semibold text-green-700">
              ${product.pricePerUnit}
            </span>
          </div>
          <div className="bg-green-50 px-3 py-2 rounded-lg flex-1">
            <span className="text-sm font-semibold text-green-700">
              ↓ {product.savings}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {product.crueltyFree && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">🐾</span> Cruelty-free
            </span>
          )}
          {product.vegan && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">🌿</span> Vegan
            </span>
          )}
          {product.fragranceFree && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">🧪</span> Fragrance-Free
            </span>
          )}
          {product.alcoholFree && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">🍷</span> Alcohol-Free
            </span>
          )}
          {product.fungalAcneSafe && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">🛡️</span> Fungal Acne Safe
            </span>
          )}
          {product.parabenfree && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">⭐</span> Paraben-Free
            </span>
          )}
          {product.sulfateFree && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">✨</span> Sulfate-Free
            </span>
          )}
          {product.siliconesFree && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700">
              <span className="text-sm">💎</span> Silicones-Free
            </span>
          )}
        </div>

        {/* Data freshness */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500">
            Sources checked {product.sourcesCheckedDaysAgo}d ago
          </p>
        </div>

        {/* Pricing Section */}
        <div className="px-6 pb-4 border-t border-gray-200 pt-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            From {product.pricePerUnit} at Brand site
          </p>
          <button
            onClick={() => setShowPricesPopup(true)}
            className="text-sm text-primary hover:text-teal-800 font-semibold"
          >
            See all prices →
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Link href={`/comparables/${product.id}`} className="flex-1">
            <Button className="w-full bg-primary hover:bg-teal-800 text-white gap-2 font-semibold">
              Compare
            </Button>
          </Link>
          <Link href={`/swap/${product.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View More
            </Button>
          </Link>
          <Button variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <PricesPopup
        product={product}
        isOpen={showPricesPopup}
        onClose={() => setShowPricesPopup(false)}
      />
    </>
  )
}

