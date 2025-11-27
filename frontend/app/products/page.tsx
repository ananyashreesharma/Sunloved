"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { searchProducts } from "@/lib/api"
import { ChevronDown, X } from "lucide-react"

const PRICE_RANGES = [
  { label: "< $10", min: 0, max: 10 },
  { label: "$10 - $25", min: 10, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50+", min: 50, max: Infinity },
]

// BRANDS will be populated from API

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
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters state
  const [selectedBrand, setSelectedBrand] = useState<string | null>(brandParam || null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(itemParam || null)
  const [selectedPrice, setSelectedPrice] = useState<string | null>(priceParam || null)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  
  // Get unique brands from API products
  const [availableBrands, setAvailableBrands] = useState<string[]>([])

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

  // Helper function to transform API product to ProductCard format
  const transformProduct = (apiProduct: any): any => {
    const price = apiProduct.currentPrice || apiProduct.pricePerUnit || 0
    const volume = apiProduct.volume || ''
    const ingredients = apiProduct.actives || apiProduct.ingredients || []
    const productName = apiProduct.name || ''
    const brandName = apiProduct.brand || ''
    
    // Clean description - remove ingredient lists and product name/brand repetition
    let description = apiProduct.description || ''
    
    if (description) {
      // Remove "Full INCI:" and ingredient lists from description if ingredients are already available
      if (ingredients.length > 0) {
        // Remove patterns like "Full INCI:" followed by ingredients
        description = description.replace(/Full INCI:.*$/i, '').trim()
        // Remove patterns like "Ingredients:" followed by ingredients
        description = description.replace(/Ingredients?:.*$/i, '').trim()
        // Remove any trailing periods or commas
        description = description.replace(/[.,;]\s*$/, '').trim()
      }
      
      // Remove product name from description if it's repeated
      if (productName) {
        // Remove exact product name match (case insensitive)
        const nameRegex = new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        description = description.replace(nameRegex, '').trim()
      }
      
      // Remove brand name from description if it's repeated
      if (brandName) {
        const brandRegex = new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        description = description.replace(brandRegex, '').trim()
      }
      
      // Remove common patterns like "BrandName ProductName" or "ProductName by BrandName"
      if (productName && brandName) {
        const combinedPattern1 = new RegExp(`${brandName}\\s+${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
        const combinedPattern2 = new RegExp(`${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+by\\s+${brandName}`, 'gi')
        description = description.replace(combinedPattern1, '').trim()
        description = description.replace(combinedPattern2, '').trim()
      }
      
      // Clean up extra spaces and punctuation
      description = description.replace(/\s+/g, ' ').trim()
      description = description.replace(/^[.,;:\-\s]+|[.,;:\-\s]+$/g, '').trim()
      
      // If description is now empty or just punctuation, use a generic fallback
      if (!description || description.length < 10) {
        description = `A ${apiProduct.category || 'skincare'} product by ${brandName}`
      }
    } else {
      description = `A ${apiProduct.category || 'skincare'} product by ${brandName}`
    }
    
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      brand: apiProduct.brand,
      volume: volume,
      originalProduct: apiProduct.originalProduct || apiProduct.name,
      description: description,
      pricePerUnit: price ? `$${price.toFixed(2)}` : 'N/A',
      savings: 'Check prices',
      savingsPercent: 0,
      crueltyFree: apiProduct.crueltyFree || false,
      vegan: apiProduct.vegan || false,
      fragranceFree: apiProduct.fragranceFree || false,
      alcoholFree: apiProduct.alcoholFree || false,
      fungalAcneSafe: apiProduct.fungalAcneSafe || false,
      parabenfree: apiProduct.parabenFree || false,
      sulfateFree: apiProduct.sulfateFree || false,
      siliconesFree: apiProduct.siliconesFree || false,
      sourcesCheckedDaysAgo: apiProduct.sourcesCheckedDaysAgo || 30,
      category: 'closest-match' as const,
      categoryLabel: (apiProduct.category || 'Product').toUpperCase(),
      categoryBadgeColor: "bg-teal-50 text-teal-700",
      imageUrl: apiProduct.imageUrl,
      ingredients: ingredients,
      prices: apiProduct.prices,
    }
  }

  // Fetch products when search query or filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build search query with filters - use empty string to get all products
        const searchQuery = query || "" // Empty string to get all products
        const filters = {
          ...(selectedBrand && { brand: selectedBrand }),
          ...(selectedCategory && { category: normalizeCategoryForApi(selectedCategory) }),
          ...(selectedPrice && { 
            minPrice: PRICE_RANGES.find(r => r.label === selectedPrice)?.min,
            maxPrice: PRICE_RANGES.find(r => r.label === selectedPrice)?.max
          }),
        }

        // Fetch all products with pagination (max 100 per page)
        let allProducts: any[] = []
        let currentPage = 1
        const pageSize = 100
        let hasMore = true
        let totalPages = 1

        while (hasMore) {
          try {
            const results = await searchProducts(searchQuery, currentPage, pageSize, filters)
            console.log(`🔍 Fetching page ${currentPage}:`, results)
            
            // Handle the API response structure: { data, meta, error, products }
            const productsArray = results.products || results.data || []
            
            if (Array.isArray(productsArray)) {
              if (productsArray.length > 0) {
                allProducts = [...allProducts, ...productsArray]
              }
            } else {
              console.warn("⚠️ Unexpected response format:", results)
            }
            
            // Check if there are more pages
            if (results.meta) {
              totalPages = results.meta.totalPages || 1
              hasMore = currentPage < totalPages
              currentPage++
            } else {
              // If no meta, assume single page
              hasMore = false
            }
          } catch (pageError) {
            console.error(`❌ Error fetching page ${currentPage}:`, pageError)
            hasMore = false
          }
        }
        
        console.log(`✅ Total products fetched: ${allProducts.length}`)
        const transformedProducts = allProducts.map(transformProduct)
        setProducts(transformedProducts)
        
        // Extract unique brands for filter dropdown
        const brands = Array.from(new Set(transformedProducts.map(p => p.brand).filter(Boolean)))
        setAvailableBrands(brands)
      } catch (error) {
        console.error("❌ Failed to fetch products:", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error("Error details:", errorMessage)
        setError(`Failed to load products: ${errorMessage}. Please check if the backend API is running on http://localhost:3001`)
        setProducts([])
        setAvailableBrands([])
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
              : `Showing ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} from database. Explore all skincare alternatives. Evidence-backed, ethically verified, and priced fairly.`
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
                  {availableBrands.map((brand) => (
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

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">⚠️ Error Loading Products</p>
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-2">
                Make sure your backend API is running on <code className="bg-red-100 px-1 rounded">http://localhost:3001</code>
              </p>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading all products from database...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl">
                {error 
                  ? "Unable to load products. Please check the error message above."
                  : products.length === 0 
                    ? "No products found in database. The database might be empty or products don't have ingredients linked." 
                    : "No products match your filters. Try adjusting them."}
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


