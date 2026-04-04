"use client"

import { Button } from "./ui/button"
import Link from "next/link"
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react"

interface ComparisonCardProps {
  comparison: {
    id: string
    name: string
    brand: string
    category?: string
    imageUrl?: string
    pricePerUnit?: number
    currentPrice?: number
    similarityScore: number
    matchType: 'closest-match' | 'best-value' | 'sensitive-safe'
    savingsPercent?: number
    sharedActives?: string[]
    reason?: string
    formulationDifference?: {
      percentage: number
      mightContainBiotech?: boolean
      explanation?: string
      recommendation?: string
    }
  }
  baseProduct?: any
}

export function ComparisonCard({ comparison }: ComparisonCardProps) {
  const matchTypeBadges = {
    'best-value': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: '💰 Best Value',
      icon: '💰',
    },
    'closest-match': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: '⭐ Closest Match',
      icon: '⭐',
    },
    'sensitive-safe': {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      label: '🛡️ Ethically Safe',
      icon: '🛡️',
    },
  }

  const badge = matchTypeBadges[comparison.matchType]

  // Formulation difference data from backend
  const formulationDiff = comparison.formulationDifference
  const shouldWarnFormulation = formulationDiff && formulationDiff.percentage > 30

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all ${
      comparison.matchType === 'best-value' 
        ? 'border-green-300 hover:border-green-400' 
        : comparison.matchType === 'closest-match'
        ? 'border-blue-300 hover:border-blue-400'
        : 'border-purple-300 hover:border-purple-400'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{comparison.name}</h3>
            <p className="text-sm text-gray-600">{comparison.brand}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        {/* Similarity Score */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Ingredient Match</p>
              <p className="text-lg font-bold text-teal-700">{comparison.similarityScore}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all"
                style={{ width: `${comparison.similarityScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Price Comparison Section */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Price Analysis</p>
          <div className={`rounded-lg p-4 ${
            comparison.savingsPercent && comparison.savingsPercent > 0
              ? 'bg-green-50 border border-green-200'
              : comparison.savingsPercent && comparison.savingsPercent < 0
              ? 'bg-orange-50 border border-orange-200'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Per Unit:</span>
              <span className="font-bold text-lg text-gray-900">${comparison.pricePerUnit?.toFixed(2) || 'N/A'}</span>
            </div>
            {comparison.savingsPercent && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                {comparison.savingsPercent > 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-700">{comparison.savingsPercent}% Cheaper</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-700">{Math.abs(comparison.savingsPercent)}% More Expensive</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Shared Actives */}
        {comparison.sharedActives && comparison.sharedActives.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Shared Ingredients:</p>
            <div className="flex flex-wrap gap-2">
              {comparison.sharedActives.slice(0, 4).map((active) => (
                <span key={active} className="inline-block bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs font-medium border border-teal-200">
                  ✓ {active}
                </span>
              ))}
              {comparison.sharedActives.length > 4 && (
                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  +{comparison.sharedActives.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Formulation Difference Warning */}
        {shouldWarnFormulation && formulationDiff && (
          <div className={`rounded-lg p-3 space-y-2 ${
            formulationDiff.mightContainBiotech
              ? 'bg-purple-50 border border-purple-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                formulationDiff.mightContainBiotech ? 'text-purple-600' : 'text-amber-600'
              }`} />
              <div>
                <p className={`text-sm font-semibold ${
                  formulationDiff.mightContainBiotech ? 'text-purple-900' : 'text-amber-900'
                }`}>
                  {formulationDiff.mightContainBiotech ? '🧬 Biotech/Proprietary Alert' : 'Formulation Difference'}
                </p>
                <p className={`text-xs mt-2 leading-relaxed ${
                  formulationDiff.mightContainBiotech ? 'text-purple-800' : 'text-amber-800'
                }`}>
                  {formulationDiff.explanation}
                </p>
                {formulationDiff.recommendation && (
                  <p className={`text-xs mt-2 font-semibold ${
                    formulationDiff.mightContainBiotech ? 'text-purple-700' : 'text-amber-700'
                  }`}>
                    💡 {formulationDiff.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reason/Summary */}
        {comparison.reason && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-900 leading-relaxed">{comparison.reason}</p>
          </div>
        )}

        {/* Category */}
        {comparison.category && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">{comparison.category}</span>
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-6 border-t border-gray-100 bg-gray-50">
        <Link href={`/swap/${comparison.id}`} className="block">
          <Button className="w-full bg-primary hover:bg-teal-800 text-white font-semibold">
            View Details →
          </Button>
        </Link>
      </div>
    </div>
  )
}

