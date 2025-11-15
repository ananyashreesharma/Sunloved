"use client"

import { X, TrendingDown, Check } from "lucide-react"

interface Price {
  retailerId?: string
  retailerName: string
  retailerSlug?: string
  amount: number
  currency: string
  lastCheckedAt: string
  best: boolean
}

interface PricesModalProps {
  isOpen: boolean
  onClose: () => void
  prices: Price[]
  productName: string
}

export function PricesModal({ isOpen, onClose, prices, productName }: PricesModalProps) {
  if (!isOpen) return null

  const sortedPrices = prices && prices.length > 0 
    ? [...prices].sort((a, b) => a.amount - b.amount)
    : []

  console.log('Modal render:', { isOpen, pricesCount: sortedPrices.length, productName })

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay - Click to close */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-96 flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{productName}</h2>
              <p className="text-sm text-gray-500 mt-1">Compare prices</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prices List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sortedPrices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No prices available</p>
              </div>
            ) : (
              sortedPrices.map((price, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl transition-all ${
                    price.best
                      ? "bg-green-50 border-2 border-green-300"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {price.retailerName}
                        </p>
                        {price.best && (
                          <span className="inline-flex items-center gap-1 bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            <Check className="w-3 h-3" />
                            Best
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(price.lastCheckedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-700">
                        ${price.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{price.currency}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-3xl">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

