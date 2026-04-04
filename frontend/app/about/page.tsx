import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "About - Sunloved",
  description: "About Sunloved and our mission",
}

export default function AboutPage() {
  return (
    <main className="mesh-page">
      <Header />
      
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
            About Sunloved
          </h1>

          <div className="space-y-8 text-lg text-gray-600">
            <p>
              Sunloved is on a mission to make ethical, effective skincare accessible to everyone. We believe that finding great skincare doesn't have to mean breaking the bank or compromising on your values.
            </p>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p>
                We're here to help you find skincare alternatives backed by data, verified for ethics, and priced fairly. No marketing hype, just the facts.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Do</h2>
              <ul className="space-y-4 list-disc list-inside">
                <li>Analyze ingredient lists for functional matches</li>
                <li>Verify cruelty-free and vegan claims with trusted sources</li>
                <li>Calculate real value by comparing price per milliliter</li>
                <li>Keep our data fresh and transparent</li>
              </ul>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Transparency</h3>
                  <p className="text-gray-600">We show you our work and cite our sources.</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Evidence</h3>
                  <p className="text-gray-600">We use data, not marketing claims, to make recommendations.</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Accessibility</h3>
                  <p className="text-gray-600">Great skincare should be available to everyone.</p>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <p>
                Ready to find your next favorite skincare alternative?
              </p>
              <Link href="/products" className="inline-block mt-4">
                <Button className="bg-primary hover:bg-teal-800 text-white font-semibold px-8 py-2">
                  Start Exploring
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

