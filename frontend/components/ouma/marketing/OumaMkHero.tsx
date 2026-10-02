import Link from "next/link"

function ScanMockup() {
  return (
    <div className="mx-auto mt-10 w-full max-w-[340px] px-2">
      <div className="relative rounded-[28px] bg-white p-5 shadow-[0_24px_64px_rgba(0,0,0,0.10)] ring-1 ring-black/5">
        {/* Product header row */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DFF0E4] text-2xl">
            🧴
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#17211A]">Mamaearth Moisturizer</p>
            <p className="text-xs text-[#5A6259]">Natural Daily SPF 20</p>
          </div>
          <div className="shrink-0 rounded-full border border-[#7C5410]/40 bg-[#F7EDD8] px-2.5 py-1 text-[10px] font-bold text-[#b8872a]">
            ⚠ CAUTION
          </div>
        </div>

        {/* Ingredient rows */}
        <div className="space-y-2">
          {/* RED */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8E5E1] p-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8A2E22]">
              <span className="text-[9px] font-black text-white">!</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#17211A]">Phenoxyethanol</p>
              <p className="text-[11px] leading-snug text-[#5A6259]">Endocrine disruptor · Avoid</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#8A2E22] px-2 py-0.5 text-[9px] font-bold text-white">RED</span>
          </div>

          {/* YELLOW */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-[#F7EDD8] p-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C5410]">
              <span className="text-[9px] font-black text-white">~</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#17211A]">Fragrance Complex</p>
              <p className="text-[11px] leading-snug text-[#5A6259]">Sensitizer · Use caution</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#7C5410] px-2 py-0.5 text-[9px] font-bold text-white">YLW</span>
          </div>

          {/* GREEN */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-[#DFF0E4] p-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1D5C3B]">
              <span className="text-[9px] font-black text-white">✓</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#17211A]">Niacinamide 10%</p>
              <p className="text-[11px] leading-snug text-[#5A6259]">Brightening · Safe</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#1D5C3B] px-2 py-0.5 text-[9px] font-bold text-white">GRN</span>
          </div>
        </div>

        {/* Swap CTA */}
        <Link
          href="/login"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[#1D5C3B] px-4 py-3 text-sm font-semibold text-white no-underline transition-opacity hover:opacity-90"
        >
          <span>Find safer swap</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">Save ₹200</span>
        </Link>

        {/* Floating badge */}
        <div className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#8A2E22] text-xl shadow-lg ring-2 ring-white">
          🔴
        </div>
      </div>

      {/* Subtle label below */}
      <p className="mt-4 text-center text-[11px] font-medium text-[#5A6259]">
        This is what SkinLens shows you — instantly.
      </p>
    </div>
  )
}

export function OumaMkHero() {
  return (
    <section className="ouma-container pb-12 pt-4 text-center">
      {/* Badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1D5C3B]/25 bg-[#DFF0E4] px-4 py-2">
        <span className="text-sm" aria-hidden>🌿</span>
        <span className="text-xs font-semibold tracking-wide text-[#3a5030]">
          India&apos;s first skincare intelligence
        </span>
      </div>

      {/* Headline */}
      <h1 className="ouma-display mx-auto max-w-[15ch] text-[2.15rem] font-semibold leading-[1.1] text-[#17211A] sm:text-[2.5rem]">
        Know what&apos;s really{" "}
        <em className="not-italic text-[#1D5C3B]">on your skin.</em>
      </h1>

      {/* Sub */}
      <p className="mx-auto mt-5 max-w-[34ch] text-[15px] leading-relaxed text-[#5A6259]">
        Scan any product&apos;s ingredients — get instant RED·YELLOW·GREEN analysis, flag hidden
        toxins, and find safer Indian alternatives in seconds.
      </p>

      {/* CTAs */}
      <div className="mx-auto mt-8 flex w-full max-w-xs flex-col gap-3">
        <a
          href="#live-analysis"
          className="ouma-btn-primary block w-full shadow-[0_8px_32px_rgba(29,158,117,0.35)]"
        >
          Try demo — no signup needed →
        </a>
        <Link
          href="/login"
          className="block w-full rounded-2xl border-2 border-[#17211A]/12 bg-white py-3.5 text-center text-sm font-semibold text-[#17211A] no-underline transition-colors hover:border-[#17211A]/25"
        >
          Start free account
        </Link>
      </div>

      {/* Tier clarity */}
      <div className="mx-auto mt-5 flex max-w-xs flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-[#5A6259]">
        <span className="flex items-center gap-1">
          <span className="text-[#1D5C3B]">✓</span> Demo — no login
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#1D5C3B]">✓</span> Free account — 3 scans/mo
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#1D5C3B]">✓</span> Pro — ₹99/mo full access
        </span>
      </div>

      {/* Social proof */}
      <p className="ouma-social-proof mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5A6259]">
        Trusted by 12,000+ Indian women
      </p>

      {/* Phone mockup */}
      <ScanMockup />
    </section>
  )
}
