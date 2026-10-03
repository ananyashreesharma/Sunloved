import type { Metadata } from "next"
import { SiteFooter, SiteHeader } from "@/components/v3/SiteChrome"

export const metadata: Metadata = {
  title: "How we rate | SkinLens",
  description: "Where SkinLens ratings come from, what each mark means, and when we refuse to give a verdict.",
}

const MARKS: { label: string; style: React.CSSProperties; text: string }[] = [
  {
    label: "Fine",
    style: { backgroundImage: "linear-gradient(var(--hi-fine),var(--hi-fine))", backgroundSize: "100% 2px", backgroundPosition: "0 92%", backgroundRepeat: "no-repeat" },
    text: "Nothing in our sources gives a reason for concern at normal cosmetic use.",
  },
  {
    label: "Caution",
    style: { backgroundImage: "linear-gradient(var(--hi-caution),var(--hi-caution))", backgroundSize: "100% 58%", backgroundPosition: "0 82%", backgroundRepeat: "no-repeat" },
    text: "Works, but worth knowing about: strong actives such as retinoids and exfoliating acids, fragrance, common irritants and allergens, and ingredients the EU restricts.",
  },
  {
    label: "Not for you",
    style: { backgroundImage: "linear-gradient(var(--hi-nfy),var(--hi-nfy))", backgroundSize: "100% 58%", backgroundPosition: "0 82%", backgroundRepeat: "no-repeat" },
    text: "Fine for most people, but it matters for the skin you told us about. For example, ingredients that can clog pores when you mention acne.",
  },
  {
    label: "Avoid",
    style: { backgroundImage: "linear-gradient(var(--hi-avoid),var(--hi-avoid))", backgroundSize: "100% 58%", backgroundPosition: "0 82%", backgroundRepeat: "no-repeat" },
    text: "Banned in cosmetics in the EU, or a prescription drug that has no place in an over-the-counter product: mercury, hydroquinone outside a doctor's care, strong steroids.",
  },
  {
    label: "No information",
    style: { backgroundImage: "repeating-linear-gradient(135deg, var(--line) 0 3px, transparent 3px 6px)" },
    text: "We don't have reliable data on it. We never treat an unknown ingredient as fine.",
  },
]

export default function HowWeRate() {
  const h2: React.CSSProperties = { margin: "48px 0 12px", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }
  const p: React.CSSProperties = { margin: "0 0 14px", fontSize: 18, lineHeight: 1.6 }
  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <SiteHeader current="how" />
      <main style={{ flex: 1, width: "100%", maxWidth: 760, margin: "0 auto", padding: "48px 20px 72px" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1 }}>How we rate</h1>
        <p style={{ ...p, marginTop: 20, fontSize: 21, color: "var(--ink2)" }}>
          Every rating comes from published regulation or a short list we keep by hand. Nobody pays for a verdict, and when we don&apos;t know, we say so.
        </p>

        <h2 style={h2}>Where ratings come from</h2>
        <p style={p}>
          <strong>EU cosmetics rules.</strong> Most ingredients are rated from the European Commission&apos;s CosIng database: what each ingredient does, and whether it is banned,
          restricted or allowed only with conditions. The EU list is the most complete public source of cosmetic ingredient rules in the world.
        </p>
        <p style={p}>
          <strong>A short list kept by hand.</strong> Some things need judgement that a database can&apos;t give: drugs that turn up in skin lighteners (mercury, hydroquinone,
          strong steroids), and well-known actives that deserve care (retinoids, exfoliating acids). We rate these ourselves and write each explanation in plain words.
        </p>
        <p style={p}>
          An automated rating can say &ldquo;caution&rdquo;, but it never says &ldquo;avoid&rdquo; on its own. That verdict is only ever set by hand.
        </p>

        <h2 style={h2}>What the marks mean</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {MARKS.map((m) => (
            <div key={m.label} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 160px) 1fr", gap: 16, alignItems: "baseline" }}>
              <span style={{ fontSize: 20, fontWeight: 500, justifySelf: "start", ...m.style }}>{m.label}</span>
              <span style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink2)" }}>{m.text}</span>
            </div>
          ))}
        </div>

        <h2 style={h2}>From ingredients to a verdict</h2>
        <p style={p}>
          Ingredients are listed by amount, so what comes first matters most. A label &ldquo;looks fine&rdquo; only when nearly all of it is rated, nothing is flagged for
          your skin, and at most one ingredient needs care, low down the list. One &ldquo;avoid&rdquo; ingredient is enough to make the whole label an avoid.
        </p>

        <h2 style={h2}>When we don&apos;t give a verdict</h2>
        <p style={p}>
          If we can rate less than 70% of a label, there is no verdict at all. We show what we could read and say what is missing, because a confident answer built on
          guesses is worse than no answer.
        </p>

        <h2 style={h2}>What we don&apos;t do yet</h2>
        <p style={p}>
          Rules and formulas differ between countries. Today every rating uses the EU rules, wherever you live; country-specific rules are on the way, which is why we
          ask where you live. Some ingredients have no rating yet; they show as &ldquo;no information&rdquo; until they do.
        </p>
        <p style={{ ...p, color: "var(--ink2)", fontSize: 16 }}>
          SkinLens explains labels; it isn&apos;t medical advice. If you have a skin condition, are pregnant, or a product causes a reaction, talk to a doctor or pharmacist.
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
