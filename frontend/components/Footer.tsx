import Link from "next/link"
import { Twitter, Instagram, HelpCircle } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-background border-t border-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Sunloved Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-lg font-semibold text-gray-900">sunloved</span>
            </div>
            <p className="text-sm text-gray-600">
              Evidence-backed swaps, verified ethics, and real value. Find your
              next favorite product with confidence.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Navigate</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/how-we-decide" className="text-gray-600 hover:text-gray-900">
                  How We Decide
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-gray-900">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/disclaimer" className="text-gray-600 hover:text-gray-900">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <Link
                href="https://twitter.com"
                target="_blank"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <Instagram className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-600">
            © 2025 Sunloved. All rights reserved.
          </p>
          <button className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </footer>
  )
}

