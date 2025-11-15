"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { searchProducts } from "@/lib/api"
import { dummyProducts } from "@/lib/data"
import { ChevronDown, X } from "lucide-react"

const PRICE_RANGES = [
  { label: "< $10", min: 0, max: 10 },
  { label: "$10 - $25", min: 10, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50+", min: 50, max: Infinity },
]

const BRANDS = Array.from(new Set(dummyProducts.map(p => p.brand)))

// Map header category names (from dropdown) to database category values
const CATEGORY_MAP: { [key: string]: string } = {
  "Serums": "Serum",
  "Face Cleansers": "Cleanser",
  "Toners": "Toner",
  "Moisturizers": "Moisturizer",
  "Sunscreens": "Sunscreen",
  "Exfoliators": "Exfoliator",
  "Masks": "Mask",
  // Add more mappings as needed
}

// Normalize category from header to database value
const normalizeCategoryForApi = (headerCategory: string): string => {
  return CATEGORY_MAP[headerCategory] || headerCategory
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q")
  const itemParam = searchParams.get("item") // Get item from dropdown click
  const brandParam = searchParams.get("brand")
  const priceParam = searchParams.get("price")
  
  const [products, setProducts] = useState(dummyProducts)
  const [loading, setLoading] = useState(false)
  
  // Filters state
  const [selectedBrand, setSelectedBrand] = useState<string | null>(brandParam || null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(itemParam || null)
  const [selectedPrice, setSelectedPrice] = useState<string | null>(priceParam || null)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)

  // Handle dropdown item clicks
  useEffect(() => {
    if (itemParam) {
      setSelectedCategory(itemParam)
    }
  }, [itemParam])

  // Filter products based on active filters (client-side fallback)
  const filteredProducts = products.filter(product => {
    // Brand filter
    if (selectedBrand && product.brand !== selectedBrand) return false
    
    // Category filter (check both category field and name/description)
    if (selectedCategory) {
      const normalizedCat = normalizeCategoryForApi(selectedCategory)
      const catLower = normalizedCat.toLowerCase()
      // Check category field from API (matches exact normalized value)
      if (product.category && product.category.toLowerCase() === catLower) return true
      // Fallback to name/description for dummy data
      if (product.name.toLowerCase().includes(catLower) ||
          product.description?.toLowerCase().includes(catLower)) return true
      return false
    }
    
    // Price filter
    if (selectedPrice) {
      const range = PRICE_RANGES.find(r => r.label === selectedPrice)
      if (range) {
        // Handle both string and number prices
        let price = 0
        if (typeof product.pricePerUnit === 'string') {
          price = parseFloat(product.pricePerUnit.replace('$', '').split('/')[0])
        } else {
          price = parseFloat(String(product.pricePerUnit))
        }
        if (price < range.min || price > range.max) return false
      }
    }
    
    return true
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (selectedBrand) params.set("brand", selectedBrand)
    if (selectedCategory) params.set("item", selectedCategory)
    if (selectedPrice) params.set("price", selectedPrice)
    
    const queryString = params.toString()
    router.push(queryString ? `/products?${queryString}` : "/products")
  }, [selectedBrand, selectedCategory, selectedPrice, query, router])

  // Fetch products when search query or filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        
        // Build search query with filters
        const searchQuery = query || "*" // Use wildcard if no query but filters exist
        const filters = {
          ...(selectedBrand && { brand: selectedBrand }),
          ...(selectedCategory && { category: normalizeCategoryForApi(selectedCategory) }),
          ...(selectedPrice && { 
            minPrice: PRICE_RANGES.find(r => r.label === selectedPrice)?.min,
            maxPrice: PRICE_RANGES.find(r => r.label === selectedPrice)?.max
          }),
        }

        // Only fetch from API if we have a query or filters
        if (query || selectedBrand || selectedCategory || selectedPrice) {
          const results = await searchProducts(searchQuery, 1, 100, filters)
          console.log('🔍 Search results:', results)
          
          // Handle the API response structure: { data, meta, error, products }
          const productsArray = results.products || results.data || results || []
          setProducts(Array.isArray(productsArray) ? productsArray : [])
        } else {
          // Show all dummy products if no search or filters
          setProducts(dummyProducts)
        }
      } catch (error) {
        console.error("❌ Failed to fetch products:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [query, selectedBrand, selectedCategory, selectedPrice])

  const clearFilters = () => {
    setSelectedBrand(null)
    setSelectedCategory(null)
    setSelectedPrice(null)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {query ? `Search: "${query}"` : "All Products"}
          </h1>
            <p className="text-lg text-gray-600">
            {query 
                ? `Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} matching your search`
              : "Explore all skincare alternatives. Evidence-backed, ethically verified, and priced fairly."
            }
          </p>
          </div>

          {/* Filters Section */}
          <div className="mb-8 space-y-4">
            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:border-primary transition"
              >
                <span className="text-sm font-medium">
                  {selectedBrand ? `Brand: ${selectedBrand}` : "Select Brand"}
                </span>
                <ChevronDown className={`w-4 h-4 transition ${showBrandDropdown ? "rotate-180" : ""}`} />
              </button>
              
              {showBrandDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64">
                  <button
                    onClick={() => {
                      setSelectedBrand(null)
                      setShowBrandDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 border-b"
                  >
                    All Brands
                  </button>
                  {BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => {
                        setSelectedBrand(brand)
                        setShowBrandDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition ${
                        selectedBrand === brand
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range Pills */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-600 self-center mr-2">Price:</span>
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setSelectedPrice(selectedPrice === range.label ? null : range.label)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedPrice === range.label
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Active Filters & Clear Button */}
            {(selectedBrand || selectedCategory || selectedPrice) && (
              <div className="flex items-center gap-2 pt-2">
                <div className="flex flex-wrap gap-2">
                  {selectedBrand && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>Brand: {selectedBrand}</span>
                      <button
                        onClick={() => setSelectedBrand(null)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {selectedCategory && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>Category: {selectedCategory}</span>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {selectedPrice && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>Price: {selectedPrice}</span>
                      <button
                        onClick={() => setSelectedPrice(null)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Searching products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl">
                {products.length === 0 ? "No products found. Try a different search term." : "No products match your filters. Try adjusting them."}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">Showing {filteredProducts.length} of {products.length} products</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}


