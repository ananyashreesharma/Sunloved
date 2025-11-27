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
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/30">
        {/* Header with Category Badge */}
        {showCategoryBadge && (
          <div className="px-6 pt-6 pb-3 flex items-start justify-between bg-gradient-to-r from-gray-50 to-white">
            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${product.categoryBadgeColor} shadow-sm`}>
              {product.categoryLabel}
            </span>
          </div>
        )}

        {/* Product Info */}
        <div className="px-6 pb-5">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-base font-bold text-primary mb-3">
              {product.brand}
            </p>
            {product.originalProduct && product.originalProduct !== product.name && (
              <p className="text-sm text-gray-500 mb-3 italic">
                For {product.originalProduct}
              </p>
            )}
          </div>
          
          {/* Only show description if it's meaningful and not just repeating name/brand */}
          {product.description && 
           product.description.toLowerCase() !== product.name.toLowerCase() &&
           !product.description.toLowerCase().includes(product.name.toLowerCase()) &&
           product.description.length > 20 && (
            <p className="text-sm text-gray-700 mb-4 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-100 shadow-sm">
            <span className="text-sm font-bold text-green-800">
              {product.pricePerUnit}
            </span>
          </div>
        </div>

        {/* Badges */}
        {((product.crueltyFree || product.vegan || product.fragranceFree || product.alcoholFree || product.fungalAcneSafe || product.parabenfree || product.sulfateFree || product.siliconesFree)) && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {product.crueltyFree && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-xs font-medium border border-pink-100">
                  <span className="text-sm">🐾</span> Cruelty-free
                </span>
              )}
              {product.vegan && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                  <span className="text-sm">🌿</span> Vegan
                </span>
              )}
              {product.fragranceFree && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
                  <span className="text-sm">🧪</span> Fragrance-Free
                </span>
              )}
              {product.alcoholFree && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                  <span className="text-sm">🍷</span> Alcohol-Free
                </span>
              )}
              {product.fungalAcneSafe && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-100">
                  <span className="text-sm">🛡️</span> Fungal Acne Safe
                </span>
              )}
              {product.parabenfree && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                  <span className="text-sm">⭐</span> Paraben-Free
                </span>
              )}
              {product.sulfateFree && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium border border-teal-100">
                  <span className="text-sm">✨</span> Sulfate-Free
                </span>
              )}
              {product.siliconesFree && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium border border-cyan-100">
                  <span className="text-sm">💎</span> Silicones-Free
                </span>
              )}
            </div>
          </div>
        )}

        {/* Data freshness */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>🕒</span>
            Sources checked {product.sourcesCheckedDaysAgo}d ago
          </p>
        </div>

        {/* Pricing Section */}
        <div className="px-6 pb-5 border-t border-gray-100 pt-5 bg-gray-50/50">
          <p className="text-sm font-semibold text-gray-900">
            From {product.pricePerUnit} at Brand site
          </p>
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

