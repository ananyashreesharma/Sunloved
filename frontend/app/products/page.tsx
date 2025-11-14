"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { searchProducts } from "@/lib/api"
import { dummyProducts } from "@/lib/data"

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")
  
  const [products, setProducts] = useState(dummyProducts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query) {
      const fetchProducts = async () => {
        try {
          setLoading(true)
          const results = await searchProducts(query)
          setProducts(results.length > 0 ? results : dummyProducts)
        } catch (error) {
          console.error("Failed to fetch products:", error)
          setProducts(dummyProducts)
        } finally {
          setLoading(false)
        }
      }
      fetchProducts()
    }
  }, [query])

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
            {query ? `Search: "${query}"` : "All Products"}
          </h1>
          
          <p className="text-xl text-gray-600 mb-16">
            {query 
              ? `Found ${products.length} product${products.length !== 1 ? 's' : ''} matching your search`
              : "Explore all skincare alternatives. Evidence-backed, ethically verified, and priced fairly."
            }
          </p>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Searching products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl">No products found. Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}


