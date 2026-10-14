import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter, SiteHeader } from "@/components/v3/SiteChrome"
import { ingredientIndex } from "@/lib/public-data"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Skincare ingredients A–Z: what each one does | SkinLens",
  description: "Plain-language explanations and safety ratings for thousands of skincare ingredients, from EU cosmetics rules and hand-checked reviews.",
}

export default async function Ingredients() {
  const all = (await ingredientIndex()) ?? []
  const groups = new Map<string, { slug: string; name: string }[]>()
  for (const i of all) {
    const letter = /[a-z]/i.test(i.name[0]) ? i.name[0].toUpperCase() : "#"
    groups.set(letter, [...(groups.get(letter) ?? []), i])
  }
  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <SiteHeader current="how" />
      <main style={{ flex: 1, width: "100%", maxWidth: 960, margin: "0 auto", padding: "40px 20px 72px" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 600, letterSpacing: "-0.04em" }}>Ingredients A–Z</h1>
        <p style={{ margin: "12px 0 0", fontSize: 18, color: "var(--ink2)" }}>{all.length.toLocaleString("en")} ingredients found in real products, each explained in plain words.</p>
        <nav aria-label="Letters" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "24px 0" }}>
          {[...groups.keys()].map((l) => (
            <a key={l} href={`#${l}`} className="v3-chip" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", minHeight: 36 }}>
              {l}
            </a>
          ))}
        </nav>
        {[...groups.entries()].map(([l, list]) => (
          <section key={l} id={l} style={{ marginTop: 28 }}>
            <h2 className="v3-label">{l}</h2>
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, columns: "260px", columnGap: 32 }}>
              {list.map((i) => (
                <li key={i.slug} style={{ breakInside: "avoid", padding: "4px 0" }}>
                  <Link href={`/ingredients/${i.slug}`} style={{ fontSize: 16, textDecoration: "none" }}>
                    {i.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  )
}
