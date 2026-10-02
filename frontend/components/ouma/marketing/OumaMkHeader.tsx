import Link from "next/link"
import { Leaf } from "lucide-react"

export function OumaMkHeader({ showBrand = true }: { showBrand?: boolean }) {
  return (
    <header
      className={`ouma-container flex items-center pb-3 pt-5 ${showBrand ? "justify-between" : "justify-end"}`}
    >
      {showBrand ? (
        <Link href="#top" className="flex items-center gap-2 no-underline" aria-label="SkinLens home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D5C3B]">
            <Leaf className="h-4 w-4 text-white" strokeWidth={2.5} aria-hidden />
          </div>
          <span className="ouma-display text-xl font-semibold tracking-tight text-[#17211A]">SkinLens</span>
        </Link>
      ) : null}
      <Link
        href="/login"
        className="rounded-full border border-[#1D5C3B] px-4 py-2 text-sm font-semibold text-[#1D5C3B] no-underline transition-colors hover:bg-[#DFF0E4]"
      >
        Sign In
      </Link>
    </header>
  )
}
