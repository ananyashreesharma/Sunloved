"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { PricesPopup } from "@/components/PricesPopup"
import { dummyProducts } from "@/lib/data"
import { normalizeSwapProduct } from "@/lib/swap-normalize"
import {
  useProductQuery,
  useProductPricesQuery,
  useIngredientAnalysisQuery,
  useProductSummaryQuery,
} from "@/hooks/use-sunloved-queries"
import { Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"

type SwapDetailClientProps = {
  id: string
  initialProduct: unknown | null
}

export function SwapDetailClient({ id, initialProduct }: SwapDetailClientProps) {
  const [showPricesModal, setShowPricesModal] = useState(false)

  const { data: rawProduct, isPending, isError } = useProductQuery(
    id,
    initialProduct ?? undefined
  )

  const product = useMemo(() => {
    const base = rawProduct ?? initialProduct
    if (base) return normalizeSwapProduct(base)
    if (isError) {
      const d = dummyProducts.find((p) => p.id === id)
      return d ? normalizeSwapProduct(d) : null
    }
    return null
  }, [rawProduct, initialProduct, isError, id])

  const { data: prices = [] } = useProductPricesQuery(id)
  const { data: ingredientAnalysis } = useIngredientAnalysisQuery(product?.ingredients)
  const { data: aiSummary, isPending: summaryPending } = useProductSummaryQuery(product)

  const loading = isPending && !product && !initialProduct

  if (loading) {
    return (
      <main className="mesh-page">
        <Header />
        <div className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-gray-600">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="mesh-page">
        <Header />
        <div className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Product Not Found
            </h1>
            <Link href="/products">
              <Button className="bg-primary hover:bg-teal-800 text-white font-semibold">
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="mesh-page">
      <Header />
      
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Best {product.name} dupes and ingredient-based alternatives
            </h1>
            <button className="text-sm text-primary hover:text-teal-800 font-semibold border border-primary rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors">
              Save search
            </button>
          </div>

          {/* Quick Summary of Target Product */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-12 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Summary of Target Product</h2>
            
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Left: Product Actions */}
              <div className="flex flex-row sm:flex-col items-start gap-4">
                <button className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
                <Link href={`/comparables/${product.id}`}>
                  <Button className="bg-primary hover:bg-teal-800 text-white font-semibold gap-2 whitespace-nowrap">
                    <ShoppingBag className="w-4 h-4" />
                    SHOP PRODUCT
                  </Button>
                </Link>
              </div>

              {/* Center: Product Details */}
              <div className="flex-1">
                {/* Product Metadata */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
                    {product.category || 'Product'}
                    {(product as any).categoryCorrected && (
                      <span className="ml-1 text-xs" title="Category was inferred from product details">*</span>
                    )}
                  </span>
                  <span className="text-gray-400 font-semibold">
                    {product.pricePerUnit ? '$$' : '$$$'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★★★★</span>
                    <span className="text-gray-300">★</span>
                    <span className="text-xs text-gray-500 ml-1">4.0</span>
                  </div>
                  <span className="text-pink-500">🐷</span>
                  </div>

                {/* Product Name and Brand */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-lg font-semibold text-primary mb-4">
                  {product.brand}
                </p>

                {/* Additional Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {product.category?.toUpperCase() || 'PRODUCT'}
                  </span>
                  {product.volume && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {product.volume}
                    </span>
                  )}
                </div>

                {/* Product Summary Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Product Summary</h4>
                  {summaryPending && !aiSummary ? (
                    <p className="text-sm text-gray-500 italic">Loading summary...</p>
                  ) : aiSummary ? (
                    <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                      {aiSummary.summaryText && (
                        <p className="mb-3 italic text-gray-600">{aiSummary.summaryText}</p>
                      )}
                      {aiSummary.whatItDoes && (
                        <p><span className="font-semibold">What it does:</span> {aiSummary.whatItDoes}</p>
                      )}
                      {aiSummary.whoItsFor && (
                        <p><span className="font-semibold">Best for:</span> {aiSummary.whoItsFor}</p>
                      )}
                      {aiSummary.howToUse && (
                        <p><span className="font-semibold">How to use:</span> {aiSummary.howToUse}</p>
                      )}
                      {aiSummary.keyIngredients && aiSummary.keyIngredients.length > 0 && (
                        <p><span className="font-semibold">Key ingredients:</span> {aiSummary.keyIngredients.join(', ')}</p>
                      )}
                      {aiSummary.warnings && aiSummary.warnings !== 'Not specified' && (
                        <p><span className="font-semibold">Warnings:</span> {aiSummary.warnings}</p>
                      )}
                      {aiSummary.claims && aiSummary.claims !== 'No specific claims provided' && (
                        <p><span className="font-semibold">Claims:</span> {aiSummary.claims}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Summary unavailable.</p>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* What's Inside Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What&apos;s inside</h2>
            
            {/* Product Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              <div className="flex items-center gap-2">
                {product.fragranceFree ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Fragrance-free</span>
              </div>
              <div className="flex items-center gap-2">
                {product.alcoholFree ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Alcohol-free</span>
              </div>
              <div className="flex items-center gap-2">
                {product.parabenfree ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Paraben-free</span>
              </div>
              <div className="flex items-center gap-2">
                {product.crueltyFree ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Cruelty-free</span>
              </div>
              <div className="flex items-center gap-2">
                {product.vegan ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Vegan</span>
              </div>
              <div className="flex items-center gap-2">
                {product.fungalAcneSafe ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Fungal-acne-safe</span>
              </div>
              <div className="flex items-center gap-2">
                {product.sulfateFree ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Sulfate-free</span>
              </div>
              <div className="flex items-center gap-2">
                {product.siliconesFree ? (
                  <span className="text-green-600 font-bold">✓</span>
                ) : (
                  <span className="text-red-600 font-bold">✗</span>
                )}
                <span className="text-sm text-gray-700">Silicone-free</span>
              </div>
            </div>

            {/* Ingredients List */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ingredients List</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {product.ingredients.map((ingredient: string, index: number) => {
                    // Determine color based on ingredient type (simplified logic)
                    const ingLower = ingredient.toLowerCase()
                    let color = 'green' // Default safe
                    let functionText = 'Skin Conditioning'
                    
                    // Color coding logic
                    if (ingLower.includes('alcohol') || ingLower.includes('ethanol') || ingLower.includes('denat')) {
                      color = 'red'
                      functionText = 'Solvent'
                    } else if (ingLower.includes('paraben') || ingLower.includes('sulfate') || ingLower.includes('sles') || ingLower.includes('sds')) {
                      color = 'orange'
                      functionText = 'Preservative / Cleansing'
                    } else if (ingLower.includes('ceramide') || ingLower.includes('niacinamide') || ingLower.includes('hyaluronic') || ingLower.includes('glycerin')) {
                      color = 'green'
                      functionText = 'Skin Conditioning / Active'
                    } else if (ingLower.includes('fragrance') || ingLower.includes('parfum')) {
                      color = 'red'
                      functionText = 'Fragrance'
                    } else if (ingLower.includes('titanium') || ingLower.includes('zinc oxide')) {
                      color = 'green'
                      functionText = 'UV Filter'
                    } else if (ingLower.includes('dimethicone') || ingLower.includes('silicon')) {
                      color = 'orange'
                      functionText = 'Emollient'
                    }
                    
                    const foundIngredient = ingredientAnalysis?.foundIngredients?.find(
                      (ing: any) => ing.name.toLowerCase().includes(ingredient.toLowerCase()) || 
                                   ingredient.toLowerCase().includes(ing.name.toLowerCase())
                    )
                    
                    if (foundIngredient && foundIngredient.function) {
                      functionText = foundIngredient.function
                    }
                    
                    return (
                      <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className={`w-3 h-3 rounded-full ${
                          color === 'green' ? 'bg-green-500' : 
                          color === 'orange' ? 'bg-orange-500' : 
                          'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{ingredient}</p>
                          <p className="text-xs text-gray-600">{functionText}</p>
                    </div>
                  </div>
                    )
                  })}
                </div>
              </div>
            )}

                {/* Key Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Ingredients</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {product.ingredients.slice(0, 6).map((ingredient: string, index: number) => {
                    const ingLower = ingredient.toLowerCase()
                    const isKeyIngredient = ingLower.includes('ceramide') || 
                                           ingLower.includes('niacinamide') || 
                                           ingLower.includes('hyaluronic') || 
                                           ingLower.includes('retinol') ||
                                           ingLower.includes('peptide') ||
                                           ingLower.includes('vitamin c') ||
                                           ingLower.includes('glycerin')
                    
                    if (!isKeyIngredient && index >= 3) return null
                    
                    let icon = '🛡️'
                    let description = 'Supports skin health'
                    
                    if (ingLower.includes('ceramide')) {
                      icon = '🛡️'
                      description = 'Locks in moisture and supports skin barrier'
                    } else if (ingLower.includes('niacinamide')) {
                      icon = '✨'
                      description = 'Strengthens, smooths, and brightens skin'
                    } else if (ingLower.includes('hyaluronic')) {
                      icon = '💧'
                      description = 'Hydrates by attracting and holding water'
                    } else if (ingLower.includes('glycerin')) {
                      icon = '💧'
                      description = 'Attracts moisture to the skin'
                    } else if (ingLower.includes('retinol')) {
                      icon = '🌟'
                      description = 'Supports cell turnover and reduces signs of aging'
                    } else if (ingLower.includes('peptide')) {
                      icon = '🔬'
                      description = 'Supports collagen production'
                    }
                    
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{icon}</span>
                          <p className="font-semibold text-gray-900 text-sm">{ingredient}</p>
                        </div>
                        <p className="text-xs text-gray-600">{description}</p>
                      </div>
                    )
                  })}
                          </div>
                        </div>
                      )}

            {/* Benefits */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.ingredients && product.ingredients.some((ing: string) => ing.toLowerCase().includes('hyaluronic') || ing.toLowerCase().includes('glycerin')) && (
                  <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4 border border-green-100">
                    <span className="text-2xl">💧</span>
                          <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">Hydrating</p>
                      <p className="text-xs text-gray-600">Boosts hydration and relieves dry, tight skin</p>
                          </div>
                        </div>
                      )}
                {product.ingredients && product.ingredients.some((ing: string) => ing.toLowerCase().includes('ceramide')) && (
                  <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4 border border-green-100">
                    <span className="text-2xl">🛡️</span>
                          <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">Barrier Repair</p>
                      <p className="text-xs text-gray-600">Strengthen and restore your skin&apos;s natural barrier</p>
                          </div>
                        </div>
                      )}
                {product.ingredients && product.ingredients.some((ing: string) => ing.toLowerCase().includes('niacinamide')) && (
                  <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4 border border-green-100">
                    <span className="text-2xl">✨</span>
                          <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">Reduces Irritation</p>
                      <p className="text-xs text-gray-600">Eases discomfort and supports skin resilience</p>
                          </div>
                        </div>
                      )}
                {product.ingredients && product.ingredients.some((ing: string) => ing.toLowerCase().includes('retinol') || ing.toLowerCase().includes('peptide')) && (
                  <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4 border border-green-100">
                    <span className="text-2xl">🌟</span>
                          <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">Anti-Aging</p>
                      <p className="text-xs text-gray-600">Softens lines and helps skin look youthful</p>
                          </div>
                        </div>
                      )}
              </div>
                </div>

            {/* Concerns */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Concerns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.ingredients && product.ingredients.some((ing: string) => 
                  ing.toLowerCase().includes('alcohol') || 
                  ing.toLowerCase().includes('ethanol') ||
                  ing.toLowerCase().includes('denat')
                ) && (
                  <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border border-red-100">
                    <span className="text-2xl">🌋</span>
                          <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">May Worsen Dryness</p>
                      <p className="text-xs text-gray-600">Can strip moisture and worsen dryness</p>
                          </div>
                        </div>
                      )}
                {product.ingredients && product.ingredients.some((ing: string) => 
                  ing.toLowerCase().includes('fragrance') || 
                  ing.toLowerCase().includes('parfum')
                ) && (
                  <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border border-red-100">
                    <span className="text-2xl">⚠️</span>
                          <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">May Trigger Irritation</p>
                      <p className="text-xs text-gray-600">Fragrance can cause sensitivity in some skin types</p>
                          </div>
                        </div>
                      )}
                {product.ingredients && product.ingredients.some((ing: string) => 
                  ing.toLowerCase().includes('sulfate') || 
                  ing.toLowerCase().includes('sles') ||
                  ing.toLowerCase().includes('sds')
                ) && (
                  <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border border-red-100">
                    <span className="text-2xl">🌋</span>
                          <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">May Trigger Acne</p>
                      <p className="text-xs text-gray-600">Can clog pores or trigger breakouts</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
            </div>

          {/* Product Analysis */}
          <div id="analysis" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Product Analysis</h3>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm text-gray-600 mb-1">Price Per Unit</p>
                <p className="text-2xl font-bold text-green-700">{product.pricePerUnit || 'N/A'}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm text-gray-600 mb-1">Best Price Available</p>
                <p className="text-2xl font-bold text-green-700">
                  {prices.length > 0 ? `$${Math.min(...prices.map((p) => p.amount)).toFixed(2)}` : 'N/A'}
                </p>
                    </div>
                  </div>

                  {/* Data Freshness */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-gray-600">
                      <span className="text-blue-700 font-semibold">Last verified:</span>{" "}
                      {product.sourcesCheckedDaysAgo != null ? `${product.sourcesCheckedDaysAgo} days ago` : "—"}
                    </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prices Popup */}
      {product && product.id && (
        <PricesPopup
          isOpen={showPricesModal}
          onClose={() => setShowPricesModal(false)}
          product={product as any}
        />
      )}

      <Footer />
    </main>
  )
}
