"use client"

import Link from "next/link"

const ZONE = {
  red: "#E63946",
  yellow: "#F4A261",
  green: "#2A9D8F",
}

/** Matches header summary: 2 RED · 5 YELLOW · 12 GREEN */
const miniRows = [
  { n: "Parfum (Fragrance)", z: "R" as const },
  { n: "Methylparaben", z: "R" as const },
  { n: "Phenoxyethanol", z: "Y" as const },
  { n: "Retinyl Palmitate", z: "Y" as const },
  { n: "Cyclopentasiloxane", z: "Y" as const },
  { n: "Limonene", z: "Y" as const },
  { n: "Linalool", z: "Y" as const },
  { n: "Niacinamide", z: "G" as const },
  { n: "Camellia Sinensis Leaf", z: "G" as const },
  { n: "Glycerin", z: "G" as const },
  { n: "Squalane", z: "G" as const },
  { n: "Sodium Hyaluronate", z: "G" as const },
  { n: "Panthenol", z: "G" as const },
  { n: "Allantoin", z: "G" as const },
  { n: "Ceramide NP", z: "G" as const },
  { n: "Tocopherol", z: "G" as const },
  { n: "Butylene Glycol", z: "G" as const },
  { n: "Ammonium Acryloyldimethyltaurate", z: "G" as const },
  { n: "Aqua", z: "G" as const },
]

export function OumaHero() {
  return (
    <section
      id="try"
      className="relative scroll-mt-20 bg-[#F5F0E8] pb-16 pt-24 md:min-h-screen md:pb-20 md:pt-28"
    >
      <div className="ouma-container grid min-h-0 items-center gap-12 md:min-h-[calc(100dvh-4rem)] md:grid-cols-2 md:gap-10">
        <div className="relative z-[1] max-w-xl md:max-w-none">
          <h1 className="ouma-display mb-6 max-w-[22ch] text-[36px] font-medium leading-[1.12] tracking-[-0.5px] text-[#1C1C1A] md:text-[52px]">
            Your ₹800 moisturizer has 3 harmful ingredients.
          </h1>
          <p className="mb-8 max-w-[480px] text-lg text-[#888580]">
            SkinLens scans any product in 3 seconds — showing you what&apos;s safe, what&apos;s harmful, and exactly what your
            skin needs.
          </p>
          <Link
            href="#demo"
            className="ouma-btn-primary mb-3 w-full min-h-[54px] min-w-[240px] md:w-auto"
          >
            Scan your first product — free →
          </Link>
          <p className="mb-6 text-sm text-[#888580]">No credit card · 7-day free trial · Join 4,000+ Indians</p>
          <div className="ouma-social-proof flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2" aria-hidden>
              {["PM", "AK", "SD"].map((initials, i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#F5F0E8] bg-gradient-to-br from-[#E8895A]/35 to-[#2D5A1B]/25 text-xs font-semibold text-[#1C1C1A]"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-base">
              <span className="font-bold text-[#1C1C1A]">4.8★</span>{" "}
              <span className="text-[#888580]">rating</span>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <div
            className="pointer-events-none absolute right-0 top-1/2 h-[min(90vw,400px)] w-[min(90vw,400px)] -translate-y-1/2 rounded-full bg-[#E8895A] opacity-[0.07]"
            aria-hidden
          />
          <div
            className="relative z-[1] w-[min(100%,300px)] rotate-[5deg] overflow-hidden rounded-[2rem] border-[10px] border-[#1C1C1A] bg-[#1C1C1A] shadow-[0_24px_60px_rgba(0,0,0,0.2)] max-md:max-h-[420px] max-md:rounded-[1.75rem]"
            style={{ aspectRatio: "9/19" }}
          >
            <div className="flex h-full flex-col bg-[#F5F0E8]">
              <div className="flex items-center justify-between border-b border-[#E0D9CE] px-3 py-2">
                <span className="text-[10px] font-semibold text-[#1C1C1A]">Scan result</span>
                <span className="rounded-full bg-[#FFCA5A]/50 px-2 py-0.5 text-[10px] font-bold text-[#2D5A1B]">6.8</span>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-[#1C1C1A]">Green Tea Renewed Clarity Night Gel</p>
                <p className="text-[10px] text-[#888580]">Plum · Night gel · ₹795</p>
              </div>
              <div className="border-b border-[#E0D9CE] px-3 pb-2">
                <p className="text-[10px] font-semibold text-[#1C1C1A]">Summary</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold">
                  <span style={{ color: ZONE.red }}>2 RED</span>
                  <span className="text-[#888580]">·</span>
                  <span style={{ color: ZONE.yellow }}>5 YELLOW</span>
                  <span className="text-[#888580]">·</span>
                  <span style={{ color: ZONE.green }}>12 GREEN</span>
                </div>
                <p className="mt-1 text-[10px] text-[#888580]">Overall safety: Moderate</p>
              </div>
              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
                {miniRows.map((row) => (
                  <div
                    key={row.n}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5"
                    style={{
                      background:
                        row.z === "R"
                          ? "rgba(230,57,70,0.12)"
                          : row.z === "Y"
                            ? "rgba(244,162,97,0.15)"
                            : "rgba(42,157,143,0.1)",
                    }}
                  >
                    <span className="text-[10px] font-medium text-[#1C1C1A]">{row.n}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[8px] font-bold text-white"
                      style={{
                        background: row.z === "R" ? ZONE.red : row.z === "Y" ? ZONE.yellow : ZONE.green,
                      }}
                    >
                      {row.z === "R" ? "RED" : row.z === "Y" ? "YELLOW" : "GREEN"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
