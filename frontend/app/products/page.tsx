import { Suspense } from "react"
import { ProductsPageClient } from "@/components/products/ProductsPageClient"

function ProductsFallback() {
  return (
    <main className="mesh-page">
      <div className="py-24 text-center text-gray-600">Loading…</div>
    </main>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsPageClient />
    </Suspense>
  )
}
