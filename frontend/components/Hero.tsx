"use client"

import { Search } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSearchHistoryStore } from "@/stores/ui-stores"

type HeroProps = {
  /** Enables scroll-driven title treatment on the home story (CSS: .ss-scroll-masthead-h1). */
  mastheadScrollTitle?: boolean
}

export function Hero({ mastheadScrollTitle = false }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const recentSearches = useSearchHistoryStore((s) => s.recentSearches)
  const addRecentSearch = useSearchHistoryStore((s) => s.addRecentSearch)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery)
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const Root = mastheadScrollTitle ? "div" : "section"

  return (
    <Root className="bg-transparent py-16 sm:py-24 lg:py-32">
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
        <h1
          className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-center text-gray-900 mb-8 leading-tight ${
            mastheadScrollTitle ? "ss-scroll-masthead-h1" : ""
          }`}
        >
          Same results, fewer doubts.
        </h1>

        {/* Description */}
        <p className="text-center text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-12">
          Find effective skincare alternatives backed by data. We compare
          formulations, verify ethics, and calculate the value for you.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a product to swap, like 'niacinamide' or 'The Ordinary'"
              className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
        </form>

        {/* Try an example */}
        <div className="text-center space-y-6">
          {recentSearches.length > 0 && (
            <div>
              <p className="text-gray-600 mb-2 text-sm">Recent searches</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {recentSearches.map((q) => (
                  <Link key={q} href={`/products?q=${encodeURIComponent(q)}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs border-gray-200"
                    >
                      {q}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-gray-600 mb-4">Try an example:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/products?q=niacinamide">
                <Button variant="link" className="text-primary hover:underline p-0 h-auto">
                  Niacinamide
                </Button>
              </Link>
              <Link href="/products?q=the ordinary">
                <Button variant="link" className="text-primary hover:underline p-0 h-auto">
                  The Ordinary
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Root>
  )
}

