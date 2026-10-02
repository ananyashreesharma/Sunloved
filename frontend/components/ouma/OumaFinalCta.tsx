import Link from "next/link"
import { OumaSection } from "./OumaSection"

export function OumaFinalCta() {
  return (
    <OumaSection className="bg-[#2D5A1B] py-[var(--ouma-section-y)]">
      <div className="ouma-container flex max-w-[600px] flex-col items-center text-center">
        <div
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFCA5A] shadow-[0_0_60px_rgba(232,137,90,0.35)]"
          aria-hidden
        >
          <span className="block h-10 w-10 rounded-full bg-[#E8895A]" />
        </div>
        <h2 className="ouma-display mb-4 text-[40px] font-medium leading-tight text-white md:text-[48px]">
          Your skin deserves the truth.
        </h2>
        <p className="mb-8 text-lg text-white/90">
          Join thousands of Indians who stopped guessing and started knowing.
        </p>
        <Link href="/login" className="ouma-btn-primary min-h-[54px] min-w-[240px]">
          Start your free trial →
        </Link>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <span className="inline-flex h-10 items-center rounded-md border border-white/35 bg-white/10 px-4 text-xs font-medium text-white">
            App Store
          </span>
          <span className="inline-flex h-10 items-center rounded-md border border-white/35 bg-white/10 px-4 text-xs font-medium text-white">
            Google Play
          </span>
        </div>
      </div>
    </OumaSection>
  )
}
