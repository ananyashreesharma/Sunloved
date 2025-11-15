"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { PricesPopup } from "@/components/PricesPopup"
import { getProduct, getProductPrices } from "@/lib/api"
import { dummyProducts } from "@/lib/data"
import { Share2, TrendingDown, Eye } from "lucide-react"
import Link from "next/link"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState(dummyProducts.find((p) => p.id === params.id))
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPricesModal, setShowPricesModal] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const result = await getProduct(params.id)
        setProduct(result)
        
        // Fetch prices
        try {
          const priceData = await getProductPrices(params.id)
          console.log('✅ Fetched prices:', priceData)
          setPrices(Array.isArray(priceData) ? priceData : [])
        } catch (priceError) {
          console.error("❌ Failed to fetch prices:", priceError)
          setPrices([])
        }
      } catch (error) {
        console.error("Failed to fetch product:", error)
        // Fallback to dummy data
        setProduct(dummyProducts.find((p) => p.id === params.id))
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
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
      <main className="min-h-screen bg-background">
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
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Title and Actions */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to know about {product.name}
            </h1>
            
            <div className="flex flex-col gap-4">
              {/* User Summary */}
              <p className="text-sm text-gray-600">
                <span className="text-green-600 font-semibold">✓ Users loved:</span> Hydration & texture • <span className="text-orange-600 font-semibold">✗ Concern:</span> Price point
              </p>
              
              {/* Reviews and Share */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left: User Reviews Badges */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs border border-gray-200">
                    <span>🟠</span>
                    <span className="font-semibold">Amazon</span>
                    <span className="text-gray-600">4.2★</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs border border-gray-200">
                    <span>🔴</span>
                    <span className="font-semibold">Reddit</span>
                    <span className="text-gray-600">892↑</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs border border-gray-200">
                    <span>⚫</span>
                    <span className="font-semibold">Sephora</span>
                    <span className="text-gray-600">4.4★</span>
                  </div>
                </div>

                {/* Right: Share Button */}
                <button className="text-primary hover:text-teal-800">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Left Sidebar - Product Image and Navigation */}
            <div className="lg:col-span-1">
              {/* Product Image */}
              <div className="bg-white rounded-2xl p-8 flex items-center justify-center h-64 mb-6 border border-gray-200">
                <span className="text-8xl">🧴</span>
              </div>

              {/* Find Comparables Button */}
              <Link href={`/comparables/${product.id}`}>
                <Button variant="outline" className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-50 font-semibold py-3">
                  FIND COMPARABLES →
                </Button>
              </Link>

              {/* Navigation Sidebar */}
              <div className="mt-8 bg-yellow-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Overview</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="#what-it-is" className="text-gray-700 hover:text-gray-900">What it is</a></li>
                  <li><a href="#key-ingredients" className="text-gray-700 hover:text-gray-900">Key ingredients and their functions</a></li>
                  <li><a href="#how-it-works" className="text-gray-700 hover:text-gray-900">How it works</a></li>
                  <li><a href="#classification" className="text-gray-700 hover:text-gray-900">Classification</a></li>
                  <li className="font-bold text-gray-900 mt-4"><a href="#analysis" className="text-gray-700 hover:text-gray-900">Product analysis</a></li>
                </ul>
              </div>
            </div>

            {/* Right Content - Product Details */}
            <div className="lg:col-span-3 space-y-8">
              {/* Overview Section */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Overview</h2>

                {/* What it is */}
                <div id="what-it-is" className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">What it is</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Key Ingredients */}
                <div id="key-ingredients" className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Key ingredients and their functions</h3>
                  <ul className="space-y-3">
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Glycerin</span> - humectant
                    </li>
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Vp/Va Copolymer</span> - film-former
                    </li>
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Hydroxyethylcellulose</span> - thickening agent
                    </li>
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Prunus Amygdalus Dulcis (Sweet Almond) Oil</span> - emollient
                    </li>
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Butyrospermum Parkii (Shea) Butter</span> - moisturizing agent
                    </li>
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Cocos Nucifera (Coconut) Oil</span> - conditioning agent
                    </li>
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Panthenol</span> - moisturizing agent
                    </li>
                    <li className="text-gray-700">
                      <span className="font-semibold text-gray-900">Agave Rigida (Sisal) Extract</span> - conditioning agent
                    </li>
                  </ul>
                </div>

                {/* How it Works */}
                <div id="how-it-works" className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">How it works</h3>
                  <p className="text-gray-700 leading-relaxed">
                    This product utilizes ingredients like Glycerin to attract moisture to the hair, helping curls stay hydrated and defined. The film-forming agents create a protective layer while natural oils provide additional conditioning and shine. This balanced formulation helps enhance curl definition while managing frizz.
                  </p>
                </div>

                {/* Classification */}
                <div id="classification" className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Classification</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Category</p>
                      <p className="font-semibold text-gray-900">Hair Styling Gel</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Type</p>
                      <p className="font-semibold text-gray-900">Defining Gel</p>
                    </div>
                  </div>
                </div>

                {/* Product Analysis */}
                <div id="analysis" className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Product analysis</h3>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Price Per Unit</p>
                      <p className="text-2xl font-bold text-green-700">${product.pricePerUnit || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Best Price Available</p>
                      <p className="text-2xl font-bold text-green-700">
                        {prices.length > 0 ? `$${Math.min(...prices.map((p) => p.amount)).toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing from Retailers - Button to open modal */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5" />
                      Price Comparison
                    </h4>
                    
                    {prices.length > 0 ? (
                      <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-lg p-6 border-2 border-teal-200">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Best Price Available</p>
                            <p className="text-3xl font-bold text-teal-700">
                              ${Math.min(...prices.map((p) => p.amount)).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Across {prices.length} retailers</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              console.log('👁️ Button clicked, opening modal...')
                              setShowPricesModal(true)
                            }}
                            className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-teal-50 text-teal-700 font-semibold px-6 py-3 rounded-lg border-2 border-teal-700 transition shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <Eye className="w-5 h-5" />
                            See All Prices
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <p className="text-gray-600">No prices available for this product</p>
                      </div>
                    )}
                  </div>

                  {/* Ethical Attributes */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Product Attributes</h4>
                    <div className="space-y-3">
                      {product.crueltyFree && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🐾</span>
                          <div>
                            <p className="font-semibold text-gray-900">Cruelty-Free</p>
                            <p className="text-sm text-gray-600">Product & ingredients not tested on animals</p>
                          </div>
                        </div>
                      )}
                      {product.vegan && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🌿</span>
                          <div>
                            <p className="font-semibold text-gray-900">Vegan</p>
                            <p className="text-sm text-gray-600">Contains no animal-derived ingredients</p>
                          </div>
                        </div>
                      )}
                      {product.fragranceFree && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🧪</span>
                          <div>
                            <p className="font-semibold text-gray-900">Fragrance-Free</p>
                            <p className="text-sm text-gray-600">No added synthetic or natural fragrance</p>
                          </div>
                        </div>
                      )}
                      {product.alcoholFree && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🍷</span>
                          <div>
                            <p className="font-semibold text-gray-900">Alcohol Free</p>
                            <p className="text-sm text-gray-600">Contains no alcohols that can dry skin</p>
                          </div>
                        </div>
                      )}
                      {product.fungalAcneSafe && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🛡️</span>
                          <div>
                            <p className="font-semibold text-gray-900">Fungal Acne Safe</p>
                            <p className="text-sm text-gray-600">Safe for malassezia/fungal acne-prone skin</p>
                          </div>
                        </div>
                      )}
                      {product.parabenfree && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⭐</span>
                          <div>
                            <p className="font-semibold text-gray-900">Paraben Free</p>
                            <p className="text-sm text-gray-600">No synthetic preservatives (parabens)</p>
                          </div>
                        </div>
                      )}
                      {product.sulfateFree && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">✨</span>
                          <div>
                            <p className="font-semibold text-gray-900">Sulfate Free</p>
                            <p className="text-sm text-gray-600">No harsh sulfate cleansing agents</p>
                          </div>
                        </div>
                      )}
                      {product.siliconesFree && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💎</span>
                          <div>
                            <p className="font-semibold text-gray-900">Silicones Free</p>
                            <p className="text-sm text-gray-600">Contains no silicone-based ingredients</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Data Freshness */}
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <span className="text-blue-700 font-semibold">Last verified:</span> {product.sourcesCheckedDaysAgo} days ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prices Popup */}
      {product && (
        <PricesPopup
          isOpen={showPricesModal}
          onClose={() => setShowPricesModal(false)}
          product={product}
        />
      )}

      <Footer />
    </main>
  )
}
