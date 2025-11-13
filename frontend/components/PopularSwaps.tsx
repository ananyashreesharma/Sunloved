"use client"

import { dummyProducts } from "@/lib/data"
import { ProductCard } from "./ProductCard"

export function PopularSwaps() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Popular Swaps
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            See how we find alternatives for cult-favorites, saving you money
            without compromising on results.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dummyProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

