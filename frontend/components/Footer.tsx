import Link from "next/link"
import { Twitter, Instagram, HelpCircle, Mail } from "lucide-react"
import Image from "next/image"

export function Footer() {
  // Sample expert blog posts - in a real app, these would come from your API/database
  const expertBlogs = [
    {
      id: 1,
      title: "Understanding Sensitive Skin: A Dermatologist's Guide",
      summary: "Learn the science behind sensitive skin, common triggers, and evidence-backed solutions to calm and protect your skin barrier.",
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=300&fit=crop",
      link: "https://www.aad.org/public",
      author: "Dr. Sarah Mitchell, MD",
    },
    {
      id: 2,
      title: "The Truth About Natural vs Synthetic Skincare",
      summary: "Dermatologists break down the myth of 'natural' skincare and explain why formulation science matters more than ingredient origin.",
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=300&fit=crop",
      link: "https://www.dermatology.ca",
      author: "Dr. James Chen, MD",
    },
    {
      id: 3,
      title: "Acne Prevention: Beyond the Surface",
      summary: "Explore the latest dermatological research on acne prevention, including lifestyle factors and clinically-proven ingredients.",
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=300&fit=crop",
      link: "https://www.healthline.com/health/beauty-skin-care",
      author: "Dr. Emily Rodriguez, MD",
    },
  ];

  return (
    <footer className="border-t border-white/40 bg-white/50 backdrop-blur-xl backdrop-saturate-150">
      {/* Expert Dermatology Blogs Section */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              📚 Expert Dermatology Insights
            </h2>
            <p className="text-gray-600">Latest articles from verified dermatologists and skincare professionals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expertBlogs.map((blog) => (
              <a
                key={blog.id}
                href={blog.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-100"
              >
                {/* Blog Image */}
                <div className="relative h-40 overflow-hidden bg-gray-200">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Blog Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {blog.summary}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">{blog.author}</span>
                    <span className="text-primary font-semibold text-sm group-hover:translate-x-1 transition">
                      Read →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                <span className="text-primary">✨</span> Newsletter
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">Never miss new beauty gems</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Your name"
                className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Subscribe</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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

