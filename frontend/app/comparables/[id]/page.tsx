import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { dummyProducts } from "@/lib/data"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "Find Comparable Products - Sunloved",
  description: "Find similar products with comparable ingredients",
}

export default function ComparablesPage({ params }: { params: { id: string } }) {
  const product = dummyProducts.find((p) => p.id === params.id)
  
  // Get all other products as comparables
  const comparables = dummyProducts.filter((p) => p.id !== params.id)

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
      
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
              Find Comparable Products
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl">
              Discover alternatives to <span className="font-semibold">{product.name}</span> with similar ingredients and benefits.
            </p>
          </div>

          {/* Original Product Summary */}
          <div className="bg-white rounded-2xl p-8 border-2 border-primary mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Original Product</p>
                <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-2">By {product.brand}</p>
              </div>
              <div className="flex justify-center">
                <div className="text-4xl">vs</div>
              </div>
              <div>
                <p className="text-sm text-primary font-semibold mb-4">Compare with alternatives below</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-xs text-gray-600">Price</p>
                    <p className="font-bold text-green-700">${product.pricePerUnit}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-xs text-gray-600">Savings</p>
                    <p className="font-bold text-green-700">{product.savingsPercent}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparables Grid */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {comparables.length} Comparable Product{comparables.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {comparables.map((comp) => (
                <ProductCard key={comp.id} product={comp} />
              ))}
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-16 pt-8 border-t border-gray-300">
            <Link href={`/swap/${product.id}`}>
              <Button className="bg-primary hover:bg-teal-800 text-white font-semibold">
                ← Back to Product Details
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}


