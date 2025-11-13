import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { dummyProducts } from "@/lib/data"

export const metadata = {
  title: "Products - Sunloved",
  description: "Browse all skincare product alternatives",
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
            All Products
          </h1>
          
          <p className="text-xl text-gray-600 mb-16">
            Explore all skincare alternatives. Evidence-backed, ethically verified, and priced fairly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dummyProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}


