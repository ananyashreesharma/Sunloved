"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import { Menu, User, Search, Settings, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { usePathname } from "next/navigation"

export function Header() {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const [showProductsDropdown, setShowProductsDropdown] = useState(false)

  const categories = [
    { name: "Cleaners", color: "bg-blue-100" },
    { name: "Masks", color: "bg-pink-100" },
    { name: "Treatments", color: "bg-yellow-100" },
    { name: "Moisturizers", color: "bg-green-100" },
    { name: "Eye Care", color: "bg-purple-100" },
    { name: "Sun Care", color: "bg-yellow-50" },
    { name: "Lip Care", color: "bg-pink-50" },
    { name: "Other Skincare", color: "bg-yellow-100" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-background/98 backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Sunloved Logo"
              width={50}
              height={50}
              priority
              className="w-12 h-12"
            />
            <span className="text-xl font-bold text-gray-900">sunloved</span>
          </Link>

          {/* Search Bar - Hidden on home page */}
          {!isHomePage && (
            <div className="hidden md:flex flex-1 mx-8">
              <div className="w-full max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find products & brands"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <Settings className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {/* Products Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setShowProductsDropdown(true)}
              onMouseLeave={() => setShowProductsDropdown(false)}
            >
              <button
                className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1"
              >
                Products
                <ChevronDown className={`w-4 h-4 transition-transform ${showProductsDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showProductsDropdown && (
                <div
                  className="fixed top-20 left-0 right-0 w-full bg-white border-b border-gray-200 shadow-2xl z-50"
                  style={{ top: '80px' }}
                >
                  <div className="max-w-7xl mx-auto px-8 py-10">
                    {/* Main Grid - Ladder Style */}
                    <div className="grid grid-cols-6 gap-16">
                      {/* Main Categories - Left Sidebar */}
                      <div className="col-span-1 border-r border-gray-200 pr-8">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-6">Categories</h3>
                        <div className="space-y-4">
                          <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                            <p className="font-semibold text-gray-900 text-sm">Skincare</p>
                            <p className="text-xs text-gray-500 mt-1">All skincare products</p>
                          </div>
                          <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                            <p className="font-semibold text-gray-900 text-sm">Makeup</p>
                            <p className="text-xs text-gray-500 mt-1">Face, eye & lip makeup</p>
                          </div>
                          <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                            <p className="font-semibold text-gray-900 text-sm">Haircare</p>
                            <p className="text-xs text-gray-500 mt-1">Shampoos & conditioners</p>
                          </div>
                          <div className="hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                            <p className="font-semibold text-gray-900 text-sm">Bath & Body</p>
                            <p className="text-xs text-gray-500 mt-1">Body care essentials</p>
                          </div>
                        </div>
                      </div>

                      {/* Column 1: Cleansers & Masks */}
                      <div className="col-span-1">
                        <div className={`${categories[0].color} rounded-lg px-3 py-2 inline-block mb-6`}>
                          <h4 className="font-bold text-sm text-gray-900">Cleansers</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Makeup Removers</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Face Cleansers</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Exfoliators</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Toners</Link></li>
                        </ul>
                        
                        <div className={`${categories[1].color} rounded-lg px-3 py-2 inline-block mt-8 mb-4`}>
                          <h4 className="font-bold text-sm text-gray-900">Masks</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Wash Off Masks</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Sheet Masks</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Overnight Masks</Link></li>
                        </ul>
                      </div>

                      {/* Column 2: Eye & Sun Care */}
                      <div className="col-span-1">
                        <div className={`${categories[4].color} rounded-lg px-3 py-2 inline-block mb-6`}>
                          <h4 className="font-bold text-sm text-gray-900">Eye Care</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Eye Moisturizers</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Eye Masks</Link></li>
                        </ul>

                        <div className={`${categories[5].color} rounded-lg px-3 py-2 inline-block mt-8 mb-4`}>
                          <h4 className="font-bold text-sm text-gray-900">Sun Care</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Sunscreens</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Tanning</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">After Sun Care</Link></li>
                        </ul>
                      </div>

                      {/* Column 3: Treatments & Moisturizers */}
                      <div className="col-span-1">
                        <div className={`${categories[2].color} rounded-lg px-3 py-2 inline-block mb-6`}>
                          <h4 className="font-bold text-sm text-gray-900">Treatments</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Ampoules</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Essences</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Serums</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Facial Treatments</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Emulsions</Link></li>
                        </ul>
                      </div>

                      {/* Column 4: Moisturizers & Lip Care */}
                      <div className="col-span-1">
                        <div className={`${categories[3].color} rounded-lg px-3 py-2 inline-block mb-6`}>
                          <h4 className="font-bold text-sm text-gray-900">Moisturizers</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Oils</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Night Moisturizers</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Day Moisturizers</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">General Moisturizers</Link></li>
                        </ul>

                        <div className={`${categories[6].color} rounded-lg px-3 py-2 inline-block mt-8 mb-4`}>
                          <h4 className="font-bold text-sm text-gray-900">Lip Care</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Lip Moisturizers</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Lip Masks</Link></li>
                        </ul>
                      </div>

                      {/* Column 5: Other & CTA */}
                      <div className="col-span-1">
                        <div className={`${categories[7].color} rounded-lg px-3 py-2 inline-block mb-6`}>
                          <h4 className="font-bold text-sm text-gray-900">Other Skincare</h4>
                        </div>
                        <ul className="space-y-3">
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Prescription</Link></li>
                          <li><Link href="/products" className="text-sm text-gray-700 hover:text-primary hover:font-semibold transition">Tools</Link></li>
                        </ul>

                        <Link href="/products">
                          <button className="w-full mt-8 bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg transition">
                            View All Products
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/how-we-decide" className="text-gray-700 hover:text-gray-900 font-medium">
              How We Decide
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
              About Us
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

