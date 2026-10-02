import Link from "next/link"
import { Camera, Shield, ArrowLeftRight } from "lucide-react"
import { OumaSection } from "./OumaSection"

const steps = [
  {
    n: "01",
    icon: Camera,
    title: "Scan or paste",
    body: "Snap a photo, scan a barcode, or paste the ingredient list. Works on any product sold in India.",
  },
  {
    n: "02",
    icon: Shield,
    title: "Instant safety breakdown",
    body: "Red for harmful, Yellow for “depends on your skin”, Green for safe. Every ingredient explained in simple language.",
  },
  {
    n: "03",
    icon: ArrowLeftRight,
    title: "Get better alternatives",
    body: "SkinLens suggests safer, cheaper swaps from Indian brands. Save them to your personalized routine.",
  },
]

export function OumaHowItWorks() {
  return (
    <OumaSection id="how-it-works" className="scroll-mt-24 bg-[#FBE8DA] py-[var(--ouma-section-y)]">
      <div className="ouma-container">
        <h2 className="ouma-display mb-3 text-center text-[36px] font-medium leading-[1.15] text-[#1C1C1A] md:text-[40px]">
          Three seconds to safer skin
        </h2>
        <p className="mb-14 text-center text-lg text-[#888580]">No chemistry degree required.</p>

        <div className="relative grid gap-8 md:grid-cols-3 md:gap-4">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-[72px] hidden border-t border-dashed border-[#E8895A] md:block"
            aria-hidden
          />
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative rounded-[20px] bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            >
              <span
                className="ouma-display pointer-events-none absolute right-4 top-4 text-[72px] font-medium leading-none text-[#E8895A]/30"
                aria-hidden
              >
                {s.n}
              </span>
              <s.icon className="relative z-[1] mb-4 text-[#2D5A1B]" size={32} strokeWidth={1.75} />
              <h3 className="relative z-[1] mb-2 text-xl font-semibold text-[#1C1C1A]">{s.title}</h3>
              <p className="relative z-[1] text-[15px] leading-snug text-[#888580]">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <Link href="/login" className="ouma-btn-primary">
            Start your free trial →
          </Link>
        </div>
      </div>
    </OumaSection>
  )
}
