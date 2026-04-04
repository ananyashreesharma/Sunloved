"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import { Menu, User, Search, Settings, ChevronDown } from "lucide-react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useHeaderNavStore } from "@/stores/ui-stores"

const categoryDropdowns = {
  "Skincare": {
    sections: [
      {
        title: "Cleaners",
        color: "bg-blue-100 text-blue-800",
        items: ["Makeup Removers", "Face Cleansers", "Exfoliators", "Toners"]
      },
      {
        title: "Masks",
        color: "bg-pink-100 text-pink-800",
        items: ["Wash Off Masks", "Sheet Masks", "Overnight Masks"]
      },
      {
        title: "Treatments",
        color: "bg-yellow-100 text-yellow-800",
        items: ["Ampules", "Essences", "Serums", "Facial Treatments", "Emulsions"]
      },
      {
        title: "Moisturizers",
        color: "bg-cyan-100 text-cyan-800",
        items: ["Oils", "Night Moisturizers", "Day Moisturizers", "General Moisturizers"]
      },
      {
        title: "Eye Care",
        color: "bg-purple-100 text-purple-800",
        items: ["Eye Moisturizers", "Eye Masks"]
      },
      {
        title: "Sun Care",
        color: "bg-yellow-50 text-yellow-900",
        items: ["Sunscreens", "Tanning", "After Sun Care"]
      },
      {
        title: "Lip Care",
        color: "bg-red-100 text-red-800",
        items: ["Lip Moisturizers", "Lip Masks"]
      },
      {
        title: "Other Skincare",
        color: "bg-lime-100 text-lime-800",
        items: ["Prescription", "Tools"]
      }
    ]
  },
  "Makeup": {
    sections: [
      {
        title: "Face Makeup",
        color: "bg-cyan-100 text-cyan-800",
        items: ["Color Correctors", "BB, CC, Tinted", "Moisturizers", "Foundations", "Concealers", "Face Primers", "Setting Spray & Powders", "Highlighters", "Contours", "Blushes", "Bronzers", "Other Face Makeup"]
      },
      {
        title: "Eye Makeup",
        color: "bg-purple-100 text-purple-800",
        items: ["Eyeshadows", "Mascaras", "Eyeliners", "Eye Primers", "Eyebrows", "Other Eye Makeup", "Lash & Brow Serums", "False Eyelashes"]
      },
      {
        title: "Lip Makeup",
        color: "bg-red-100 text-red-800",
        items: ["Lip Glosses", "Lip Plumpers", "Lip Stains", "Lip Oils", "Lip Liners", "Lipsticks", "Other Lip Makeup"]
      },
      {
        title: "Makeup Tools",
        color: "bg-gray-100 text-gray-800",
        items: ["Makeup Applicators"]
      }
    ]
  },
  "Haircare": {
    sections: [
      {
        title: "Shampoo & Conditioner",
        color: "bg-blue-100 text-blue-800",
        items: ["Scalp Scrubs", "Dry Shampoos", "Shampoos", "Leave In Conditioners", "Conditioners", "Other Hair Cleansers"]
      },
      {
        title: "Hair Treatments",
        color: "bg-lime-100 text-lime-800",
        items: ["Hair Serums", "Scalp Treatments", "Detanglers", "Hair Loss", "Leave In Treatments", "Hair Masks", "Hair Oils", "Other Haircare"]
      },
      {
        title: "Hair Styling",
        color: "bg-teal-100 text-teal-800",
        items: ["Styling Creams & Sprays", "Mousse & Foam", "Gel, Pomade & Wax", "Hair Sprays", "Heat Protectants", "Styling Tools", "Other Styling"]
      }
    ]
  },
  "Bath & Body": {
    sections: [
      {
        title: "Hand & Foot",
        color: "bg-blue-100 text-blue-800",
        items: ["Hand Soaps", "Hand Cream", "Foot Cream", "Other Hand & Foot"]
      },
      {
        title: "Bath & Shower",
        color: "bg-red-100 text-red-800",
        items: ["Body Scrubs", "Body Washes"]
      },
      {
        title: "Body Moisturizers",
        color: "bg-teal-100 text-teal-800",
        items: ["Body Treatments", "Body Lotions", "Body Oils", "Body Serums"]
      },
      {
        title: "Body Care",
        color: "bg-purple-100 text-purple-800",
        items: ["Grooming Tools", "Bath Tools", "Grooming", "Deodorant", "Other Bath & Body"]
      },
      {
        title: "Other Beauty",
        color: "bg-pink-100 text-pink-800",
        items: ["Fragrances", "Nail Tools", "Nail Care"]
      }
    ]
  },
}

export function Header() {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const openDropdown = useHeaderNavStore((s) => s.openDropdown)
  const setOpenDropdown = useHeaderNavStore((s) => s.setOpenDropdown)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-xl backdrop-saturate-150">
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
            <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <Link href="/how-we-decide" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              How We Decide
            </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              About Us
            </Link>
          </nav>

          {/* Right side */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Free Samples - Desktop Only */}
              <div className="hidden lg:flex items-center gap-1 text-right">
                <span className="text-xs font-semibold text-gray-900">FREE SAMPLES</span>
                <p className="text-xs text-gray-600">WITH EVERY PURCHASE</p>
              </div>
              
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

      {/* Category Navigation Bar */}
      <nav className="sticky top-20 z-40 w-full border-b border-white/25 bg-white/40 backdrop-blur-lg backdrop-saturate-150 hidden md:block overflow-visible">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-12 h-16">
            {Object.entries(categoryDropdowns).map(([category, data]) => (
              <div 
                key={category}
                className="relative flex-shrink-0"
                onMouseEnter={() => setOpenDropdown(category)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-primary whitespace-nowrap transition py-4 border-b-2 border-transparent hover:border-primary">
                  {category}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === category ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {openDropdown === category && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-0 w-screen max-w-5xl bg-white rounded-lg shadow-2xl border border-gray-200 z-[100]">
                    <div className="p-8">
                      {/* Grid of sections - responsive columns */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                        {data.sections.map((section) => (
                          <div key={section.title}>
                            {/* Section Title with colored badge */}
                            <div className={`${section.color} rounded-full px-3 py-1 inline-block mb-4`}>
                              <h4 className="font-semibold text-sm">{section.title}</h4>
                            </div>
                            
                            {/* Section Items */}
                            <ul className="space-y-2">
                              {section.items.map((item) => (
                                <li key={item}>
                                  <Link
                                    href={`/products?category=${category}&section=${section.title}&item=${item}`}
                                    className="text-sm text-gray-700 hover:text-primary transition font-medium"
                                  >
                                    {item}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Explore all products */}
            <Link
              href="/products"
              className="text-sm font-bold text-gray-900 hover:text-primary whitespace-nowrap transition py-4 border-b-2 border-transparent hover:border-primary flex-shrink-0"
            >
              Explore all products
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

