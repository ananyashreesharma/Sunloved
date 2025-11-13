import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { dummyProducts } from "@/lib/data"
import { Heart, Star, Share2 } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Product Details - Sunloved",
  description: "View detailed product information",
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = dummyProducts.find((p) => p.id === params.id)

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
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* Left: Wishlist and Rating */}
              <div className="flex items-center gap-6">
                <button className="text-2xl hover:scale-110 transition">
                  <Heart className="w-6 h-6" />
                </button>
                <div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gray-300 fill-gray-300" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">0 reviews</p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex gap-3">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold">
                  WRITE A REVIEW →
                </Button>
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
                      <p className="text-2xl font-bold text-green-700">${product.pricePerUnit}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Value Savings</p>
                      <p className="text-2xl font-bold text-green-700">{product.savingsPercent}%</p>
                    </div>
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

      <Footer />
    </main>
  )
}
