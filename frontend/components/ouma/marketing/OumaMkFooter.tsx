import Link from "next/link"
import { Leaf } from "lucide-react"

export function OumaMkFooter() {
  return (
    <footer className="ouma-container border-t border-[#DDE3DA] pb-12 pt-12 text-center">
      {/* Logo mark */}
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D5C3B]">
        <Leaf className="h-7 w-7 text-white" aria-hidden />
      </div>

      <p className="ouma-display text-2xl font-semibold text-[#17211A]">SkinLens</p>
      <p className="mt-1 text-sm text-[#5A6259]">Know what&apos;s on your skin.</p>

      {/* App Store placeholder */}
      <button
        type="button"
        className="mx-auto mt-7 inline-flex h-12 cursor-default items-center gap-2 rounded-full border-0 bg-[#17211A] px-6 text-sm font-semibold text-white"
      >
        <span aria-hidden>🍎</span> Coming to App Store
      </button>

      {/* Legal links */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-[#5A6259]">
        <Link href="/pricing" className="hover:text-[#17211A]">
          Pricing
        </Link>
        <Link href="/legal/privacy" className="hover:text-[#17211A]">
          Privacy Policy
        </Link>
        <Link href="/legal/terms" className="hover:text-[#17211A]">
          Terms of Service
        </Link>
        <a href="mailto:hello@skinlens.in" className="hover:text-[#17211A]">
          Contact
        </a>
      </div>

      <p className="mt-10 text-xs text-[#5A6259]">
        © 2026 SkinLens Intelligence. Made in India. 🇮🇳
      </p>
    </footer>
  )
}
