import Link from "next/link"
import { OumaSection } from "./OumaSection"

const products = [
  {
    cat: "Face wash",
    name: "Tea Tree Foaming Face Wash",
    brand: "Popular D2C brand",
    price: "₹299",
    score: "6.4",
    scoreTone: "bg-amber-400/90",
    harm: 3,
    mod: 2,
    safe: 12,
    flags: [
      { n: "Sodium Lauryl Sulfate", r: "Known irritant for some skin types; can strip natural oils." },
      { n: "Fragrance", r: "Common trigger for sensitivity; patch test if reactive." },
    ],
  },
  {
    cat: "Serum",
    name: "10% Niacinamide Serum",
    brand: "Minimalist-style label",
    price: "₹599",
    score: "8.1",
    scoreTone: "bg-emerald-600/90",
    harm: 0,
    mod: 2,
    safe: 14,
    flags: [
      { n: "Phenoxyethanol", r: "Preservative; generally safe under typical use levels." },
      { n: "Ethylhexylglycerin", r: "Helper preservative; low concern for most users." },
    ],
  },
  {
    cat: "Sunscreen",
    name: "SPF 50 Gel",
    brand: "Pharmacy favourite",
    price: "₹850",
    score: "7.0",
    scoreTone: "bg-amber-500/90",
    harm: 1,
    mod: 3,
    safe: 18,
    flags: [
      { n: "Alcohol Denat.", r: "Can feel drying; lower score in dry climates on SkinLens." },
      { n: "Homosalate", r: "UV filter; context-dependent; we explain trade-offs clearly." },
    ],
  },
]

export function OumaIngredientTruth() {
  return (
    <OumaSection className="bg-white py-[var(--ouma-section-y)]">
      <div className="ouma-container">
        <h2 className="ouma-display mb-3 text-center text-[40px] font-medium text-[#1C1C1A] md:text-[48px]">
          What we found in products you trust.
        </h2>
        <p className="mb-12 text-center text-lg text-[#888580]">
          We&apos;re not here to scare you. We&apos;re here to inform you.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {products.map((p) => (
            <article
              key={p.name}
              className="flex flex-col rounded-2xl border border-[#E0D9CE] bg-[#F5F0E8] p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="mb-3 inline-flex w-fit rounded-full bg-white px-2 py-1 text-xs font-medium text-[#888580]">
                {p.cat}
              </span>
              <h3 className="text-[17px] font-semibold text-[#1C1C1A]">{p.name}</h3>
              <p className="text-sm text-[#888580]">{p.brand}</p>
              <p className="mt-1 text-sm text-[#888580]">{p.price}</p>
              <div className="my-4 flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-sm font-bold leading-tight text-white ${p.scoreTone}`}
                >
                  <span>
                    {p.score}
                    <span className="block text-[10px] font-normal opacity-90">/10</span>
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#1C1C1A]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {p.harm} harmful
                  </span>
                  <span className="mx-1 text-[#888580]">·</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {p.mod} moderate
                  </span>
                  <span className="mx-1 text-[#888580]">·</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    {p.safe} safe
                  </span>
                </div>
              </div>
              <ul className="mb-4 space-y-2 text-sm text-[#1C1C1A]">
                {p.flags.map((f) => (
                  <li key={f.n}>
                    <span className="font-medium">{f.n}</span> — {f.r}
                  </li>
                ))}
              </ul>
              <Link href="#demo" className="mt-auto text-sm font-semibold text-[#E8895A] no-underline hover:underline">
                See full analysis →
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-[#FBE8DA] px-6 py-8 text-center md:flex md:items-center md:justify-between md:text-left">
          <p className="mb-4 text-lg font-medium text-[#1C1C1A] md:mb-0">Check your own products for free →</p>
          <Link href="#try" className="ouma-btn-primary inline-flex justify-center">
            Start scanning
          </Link>
        </div>
      </div>
    </OumaSection>
  )
}
