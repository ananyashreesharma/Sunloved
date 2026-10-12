import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Checker } from "@/components/v3/Checker"
import { readLabel, resolveLabel, SITE, VERDICT_TEXT } from "@/lib/shared-check"

export const revalidate = 86400

// A product's own page: its label read for the visitor's skin. Indexed by search engines, so
// "is <product> safe" searches land on a real answer.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const label = await resolveLabel({ p: params.id })
  if (!label) return { title: "Product not found | SkinLens" }
  const read = await readLabel(label.inci)
  const verdict = read?.verdict ? VERDICT_TEXT[read.verdict] : "We can't judge this one yet."
  const title = `${label.name} ingredients: ${verdict} | SkinLens`
  const description = `${read?.summary ?? ""} See every ingredient explained, and check ${label.name} for your own skin, free.`.trim()
  const image = `${SITE}/api/og?p=${encodeURIComponent(params.id)}`
  return {
    title,
    description,
    alternates: { canonical: `/p/${params.id}` },
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const label = await resolveLabel({ p: params.id })
  if (!label) notFound()
  return <Checker initial={label} />
}
