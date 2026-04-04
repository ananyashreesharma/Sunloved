"use client"

import { Product } from "@/lib/data"
import { X } from "lucide-react"

interface PricesPopupProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export function PricesPopup({ product, isOpen, onClose }: PricesPopupProps) {
  if (!isOpen) return null

  const retailers = [
    {
      name: "Amazon",
      price: product.prices?.amazon?.price,
      url: product.prices?.amazon?.url,
      icon: "🛒",
    },
    {
      name: "Sephora",
      price: product.prices?.sephora?.price,
      url: product.prices?.sephora?.url,
      icon: "💄",
    },
    {
      name: "Ulta",
      price: product.prices?.ulta?.price,
      url: product.prices?.ulta?.url,
      icon: "✨",
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Where to Buy
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Product Info */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600">
              {product.brand} • {product.volume}
            </p>
          </div>

          {/* Retailers */}
          <div className="p-6 space-y-3">
            {retailers.map((retailer) =>
              retailer.price && retailer.url ? (
                <a
                  key={retailer.name}
                  href={retailer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{retailer.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {retailer.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">
                        {retailer.price}
                      </p>
                      <p className="text-xs text-gray-500">View deal →</p>
                    </div>
                  </div>
                </a>
              ) : null
            )}
          </div>

          {/* Footer Note */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Prices updated daily. Click on a retailer to visit their site.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
