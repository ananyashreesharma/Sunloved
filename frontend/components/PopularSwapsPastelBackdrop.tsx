import type { CSSProperties } from "react"

/** Brand palette — exact hex (Blueberry, Apricot, Citrus, Apple Core) */
const BRAND = ["#6B7A8F", "#F7882F", "#F7C331", "#DCC7AA"] as const

const tileBorder = "1px solid hsl(35 22% 38% / 0.18)"
const tileShadow = "0 12px 36px hsl(35 22% 18% / 0.18)"

const POSITIONS: Omit<CSSProperties, "background" | "border" | "boxShadow">[] = [
  { top: "6%", left: "-12%", width: "48%", height: "52%", transform: "rotate(-16deg)", borderRadius: "2rem" },
  { top: "4%", right: "-10%", width: "44%", height: "46%", transform: "rotate(22deg)", borderRadius: "1.75rem" },
  { top: "38%", left: "-6%", width: "38%", height: "48%", transform: "rotate(8deg)", borderRadius: "2.25rem" },
  { top: "32%", left: "28%", width: "52%", height: "42%", transform: "rotate(-11deg)", borderRadius: "1.5rem" },
  { top: "28%", right: "-8%", width: "40%", height: "55%", transform: "rotate(14deg)", borderRadius: "2rem" },
  { top: "58%", left: "8%", width: "42%", height: "44%", transform: "rotate(19deg)", borderRadius: "1.85rem" },
  { top: "62%", right: "12%", width: "46%", height: "38%", transform: "rotate(-9deg)", borderRadius: "2.1rem" },
  { top: "72%", left: "35%", width: "55%", height: "35%", transform: "rotate(6deg)", borderRadius: "1.6rem" },
  { top: "48%", right: "-14%", width: "36%", height: "40%", transform: "rotate(-22deg)", borderRadius: "2rem" },
  { top: "12%", left: "40%", width: "35%", height: "36%", transform: "rotate(26deg)", borderRadius: "1.5rem" },
  { top: "78%", left: "-10%", width: "45%", height: "42%", transform: "rotate(11deg)", borderRadius: "2rem" },
  { top: "82%", right: "5%", width: "38%", height: "48%", transform: "rotate(-18deg)", borderRadius: "1.75rem" },
  { top: "88%", left: "25%", width: "50%", height: "38%", transform: "rotate(-7deg)", borderRadius: "2.25rem" },
  { top: "92%", right: "-12%", width: "44%", height: "36%", transform: "rotate(20deg)", borderRadius: "1.6rem" },
  { top: "96%", left: "10%", width: "42%", height: "32%", transform: "rotate(-12deg)", borderRadius: "2rem" },
]

/** ~90% opacity so overlaps stay clean on beige shell */
const TILES: CSSProperties[] = POSITIONS.map((base, i) => ({
  ...base,
  background: `${BRAND[i % 4]}E8`,
  border: tileBorder,
  boxShadow: tileShadow,
}))

export function PopularSwapsPastelBackdrop() {
  return (
    <div className="ps-pastel-tiles" aria-hidden>
      {TILES.map((style, i) => (
        <div key={i} className="ps-pastel-tiles__tile" style={style} />
      ))}
    </div>
  )
}
