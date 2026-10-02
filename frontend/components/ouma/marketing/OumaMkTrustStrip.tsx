const marks = [
  "🇮🇳 India-first",
  "Mamaearth · Minimalist · Dot&Key",
  "500+ INCI ingredients",
  "Ayurvedic ingredients covered",
  "Himalaya · Plum · mCaffeine",
  "Free to start · No card needed",
  "RED · YELLOW · GREEN zones",
  "Built for Indian skin",
]

export function OumaMkTrustStrip() {
  return (
    <div className="border-y border-[#E4EBE2] bg-[#f2fbf7] py-3.5">
      <div className="ouma-marquee-wrap">
        <div className="ouma-marquee" aria-hidden>
          {[...marks, ...marks].map((m, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center gap-2.5 px-6 text-xs font-semibold text-[#3a5030]"
            >
              <span className="h-1 w-1 rounded-full bg-[#1D5C3B]" />
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
