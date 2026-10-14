import type { Metadata } from "next"
import { Checker } from "@/components/v3/Checker"
import { CopyProvider } from "@/lib/copy-context"
import { pageLang } from "@/lib/page-lang"
import { readLabel, resolveLabel, SITE, VERDICT_TEXT, type CheckParams } from "@/lib/shared-check"

// A shared check. The preview (title + image) shows the general verdict; the page itself reads
// the label for whoever opened it, with their own skin profile.
export async function generateMetadata({ searchParams }: { searchParams: CheckParams }): Promise<Metadata> {
  const label = await resolveLabel(searchParams)
  if (!label) return { title: "SkinLens: check any skincare label" }
  const read = await readLabel(label.inci)
  const verdict = read?.verdict ? VERDICT_TEXT[read.verdict] : "We can't judge this one yet."
  const title = `${label.name}: ${verdict}`
  const query = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => typeof v === "string") as [string, string][]).toString()
  const image = `${SITE}/api/og?${query}`
  const description = read?.summary || "Checked with SkinLens. Verdicts are personal: check it for your own skin."
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }], siteName: "SkinLens", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  }
}

export default async function SharedCheck({ searchParams }: { searchParams: CheckParams }) {
  const label = await resolveLabel(searchParams)
  return (
    <CopyProvider lang={pageLang()}>
      <Checker initial={label ?? undefined} />
    </CopyProvider>
  )
}
