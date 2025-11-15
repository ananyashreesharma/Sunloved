import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ComparisonsClient } from "@/components/ComparisonsClient"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Find Comparable Products - Sunloved",
  description: "Find similar products with comparable ingredients",
}

export default function ComparablesPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <ComparisonsClient productId={params.id} />

          {/* Back Link */}
          <div className="mt-16 pt-8 border-t border-gray-300">
            <Link href={`/swap/${params.id}`}>
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
