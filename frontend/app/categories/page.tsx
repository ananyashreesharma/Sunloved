import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "Categories - Sunloved",
  description: "Browse skincare alternatives by category",
}

const categories = [
  { id: 1, name: "Serums & Treatments", count: 12 },
  { id: 2, name: "Sunscreen & SPF", count: 8 },
  { id: 3, name: "Moisturizers", count: 15 },
  { id: 4, name: "Cleansers", count: 10 },
  { id: 5, name: "Face Masks", count: 6 },
  { id: 6, name: "Eye Care", count: 7 },
]

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
            Categories
          </h1>
          
          <p className="text-xl text-gray-600 mb-16">
            Browse skincare alternatives by product type. Find your next favorite swap in minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition cursor-pointer">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {category.count} alternatives available
                  </p>
                  <Button className="w-full bg-primary hover:bg-teal-800 text-white font-semibold">
                    Browse
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

