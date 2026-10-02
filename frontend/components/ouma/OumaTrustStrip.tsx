const brands = [
  "Mamaearth",
  "Minimalist",
  "Dot & Key",
  "Plum",
  "The Derma Co",
  "Biotique",
  "Himalaya",
  "WOW",
  "Lotus",
  "Nykaa Naturals",
  "mCaffeine",
  "Pilgrim",
]

function Row() {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap px-2">
      <span className="text-[13px] font-medium text-[#888580]">Works with</span>
      {brands.map((b, i) => (
        <span key={`${b}-${i}`} className="flex items-center gap-3">
          <span className="text-[14px] font-medium text-[#1C1C1A]">{b}</span>
          <span className="text-[#E8895A]" aria-hidden>
            ☀
          </span>
        </span>
      ))}
    </div>
  )
}

export function OumaTrustStrip() {
  return (
    <div className="border-y border-[#E0D9CE] bg-[#F5F0E8] py-3">
      <div className="ouma-marquee-wrap min-w-0 py-1">
        <div className="ouma-marquee gap-8">
          <Row />
          <Row />
        </div>
      </div>
    </div>
  )
}
