"use client"

import { Search } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section className="bg-background py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtitle */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-600 mb-6">
            <span>Evidence-backed swaps</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>Verified ethics</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>Real value</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center text-gray-900 mb-8 leading-tight">
          Same results, fewer doubts.
        </h1>

        {/* Description */}
        <p className="text-center text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-12">
          Find effective skincare alternatives backed by data. We compare
          formulations, verify ethics, and calculate the value for you.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a product to swap, like 'CeraVe Daily Moisturizing Lotion'"
              className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
        </div>

        {/* Try an example */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Try an example:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/products">
              <Button variant="link" className="text-primary hover:underline p-0 h-auto">
                SkinCeuticals C E Ferulic
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="link" className="text-primary hover:underline p-0 h-auto">
                Supergoop! Unseen Sunscreen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

