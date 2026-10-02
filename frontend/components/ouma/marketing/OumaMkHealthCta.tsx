import Link from "next/link"
import { Check } from "lucide-react"

const tiers = [
  {
    name: "Free",
    price: "₹0",
    note: "Always free",
    features: ["3 scans / month", "Overall zone verdict", "1 basic routine"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹99",
    note: "/ month",
    features: ["Unlimited scans", "Full ingredient detail", "Smart swap engine", "OCR photo scan", "Allergen alerts"],
    highlight: true,
  },
  {
    name: "Student",
    price: "₹49",
    note: "/ month",
    features: ["Unlimited scans", "Full habit tracker", "Streaks & badges", "Cheaper swaps"],
    highlight: false,
  },
]

export function OumaMkHealthCta() {
  return (
    <section className="ouma-container pb-16">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-b from-[#3a5030] to-[#083D2B] px-5 py-10 text-center">
        {/* Label */}
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7DCBA8]">
          Simple pricing · Always free to start
        </p>

        {/* Headline */}
        <h2 className="ouma-display mx-auto mt-4 max-w-[22ch] text-[1.6rem] font-semibold leading-snug text-white">
          Your skin deserves more than guessing.
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/65">
          Start free — upgrade when you&apos;re ready. Cancel anytime. UPI &amp; cards accepted.
        </p>

        {/* Pricing grid */}
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 gap-2.5">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl p-3 text-center ${
                t.highlight
                  ? "bg-white ring-2 ring-white/80 shadow-lg"
                  : "bg-white/10"
              }`}
            >
              {t.highlight ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1D5C3B] px-2.5 py-0.5 text-[9px] font-bold text-white">
                  POPULAR
                </div>
              ) : null}
              <p className={`text-[11px] font-bold ${t.highlight ? "text-[#3a5030]" : "text-white/60"}`}>
                {t.name}
              </p>
              <p className={`mt-1 text-xl font-black ${t.highlight ? "text-[#17211A]" : "text-white"}`}>
                {t.price}
              </p>
              <p className={`text-[10px] ${t.highlight ? "text-[#5A6259]" : "text-white/50"}`}>
                {t.note}
              </p>
              <ul className={`mt-3 space-y-1.5 text-left text-[10px] ${t.highlight ? "text-[#2A342C]" : "text-white/65"}`}>
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className={`mt-0.5 h-3 w-3 shrink-0 ${t.highlight ? "text-[#1D5C3B]" : "text-white/50"}`} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/login" className="ouma-btn-white-pill mx-auto mt-8 shadow-lg">
          Start free today
        </Link>
        <p className="mt-4 text-[11px] text-white/45">
          No credit card · Cancel anytime · UPI autopay accepted
        </p>
      </div>
    </section>
  )
}
