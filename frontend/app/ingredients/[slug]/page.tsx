import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteFooter, SiteHeader } from "@/components/v3/SiteChrome"
import { ingredientPage, productTitle } from "@/lib/public-data"

export const revalidate = 86400

const RATING = {
  green: { word: "Generally fine", mark: "var(--hi-fine)", answer: "is generally fine in skincare" },
  yellow: { word: "Use with care", mark: "var(--hi-caution)", answer: "is worth using with some care" },
  red: { word: "Avoid", mark: "var(--hi-avoid)", answer: "is one to avoid in skincare" },
} as const

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const i = await ingredientPage(params.slug)
  if (!i) return { title: "Ingredient not found | SkinLens" }
  const r = i.zone ? RATING[i.zone] : null
  const title = `Is ${i.name} safe in skincare? ${r ? r.word : "No rating yet"} | SkinLens`
  const description = `${i.description ?? `${i.name} in skincare.`} ${i.productCount > 0 ? `Found in ${i.productCount} products we know. ` : ""}Check any label for your skin, free.`
  return { title, description, alternates: { canonical: `/ingredients/${params.slug}` }, openGraph: { title, description } }
}

export default async function IngredientDetail({ params }: { params: { slug: string } }) {
  const i = await ingredientPage(params.slug)
  if (!i) notFound()
  const r = i.zone ? RATING[i.zone] : null
  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <SiteHeader current="how" />
      <main style={{ flex: 1, width: "100%", maxWidth: 760, margin: "0 auto", padding: "40px 20px 72px" }}>
        <Link href="/ingredients" style={{ fontSize: 15, color: "var(--ink2)", textDecoration: "none" }}>
          ← All ingredients
        </Link>
        <h1 style={{ margin: "16px 0 0", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.05, wordBreak: "break-word" }}>{i.name}</h1>
        {i.displayName && i.displayName.toLowerCase() !== i.name.toLowerCase() && <p style={{ margin: "6px 0 0", fontSize: 18, color: "var(--ink2)" }}>Also listed as {i.displayName}</p>}
        <p style={{ margin: "22px 0 0", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
          <span style={r ? { background: `linear-gradient(transparent 55%, ${r.mark} 55%)` } : { borderBottom: "2px dashed var(--ink2)" }}>{r ? r.word : "No rating yet"}</span>
        </p>
        <p style={{ margin: "14px 0 0", fontSize: 20, lineHeight: 1.55 }}>{i.description ?? "We don't have a description for this one yet."}</p>
        {i.source && <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--ink2)" }}>{i.source}</p>}

        <h2 style={{ margin: "40px 0 10px", fontSize: 24, fontWeight: 600 }}>Is {i.name} safe?</h2>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>
          {r ? `${i.name} ${r.answer}.` : `We haven't rated ${i.name} yet, so we don't call it fine.`} Whether a product suits you also depends on the whole formula, how much is in it, and your
          skin. SkinLens reads the full label for your skin type and concerns, and flags ingredients that matter for you, like pore-cloggers if you&apos;re acne-prone.
        </p>
        <p style={{ margin: "18px 0 0" }}>
          <Link href="/" className="v3-btn" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Check a label for your skin
          </Link>
        </p>

        {i.products.length > 0 && (
          <>
            <h2 style={{ margin: "44px 0 6px", fontSize: 24, fontWeight: 600 }}>Products with {i.name}</h2>
            <p style={{ margin: "0 0 10px", fontSize: 15, color: "var(--ink2)" }}>
              In {i.productCount} products we know. Higher on the label usually means more of it.
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {i.products.map((p) => (
                <li key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <Link href={`/p/${encodeURIComponent(p.id)}`} style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textDecoration: "none", fontSize: 17 }}>
                    <span>{productTitle(p)}</span>
                    <span style={{ fontSize: 13, color: "var(--ink2)", whiteSpace: "nowrap" }}>#{p.position + 1} on the label</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <p style={{ margin: "36px 0 0", fontSize: 14, color: "var(--ink2)" }}>
          SkinLens explains labels; it isn&apos;t medical advice. <Link href="/how-we-rate">How we rate</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
