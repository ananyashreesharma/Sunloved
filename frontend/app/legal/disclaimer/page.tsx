import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/v3/LegalPage"

export const metadata: Metadata = { title: "Medical disclaimer | SkinLens" }

export default function Disclaimer() {
  return (
    <LegalPage title="Not medical advice" updated="12 October 2026">
      <p>
        SkinLens explains what&apos;s on an ingredient label and helps you keep a routine. It doesn&apos;t diagnose or treat anything, and it doesn&apos;t replace a doctor,
        dermatologist or pharmacist.
      </p>
      <p>
        If you&apos;ve been using a product that SkinLens says to avoid, especially a lightening or &ldquo;fairness&rdquo; cream that contains a steroid, mercury or
        hydroquinone, stop using it and talk to a doctor if your skin is thin, burning, or has patches or stretch marks that don&apos;t fade. Stopping a steroid cream after
        long use can cause a short flare; a doctor can help with that.
      </p>
      <p>
        Pregnant or breastfeeding, have a skin condition, or react to a product? Ask a professional before starting or stopping anything. See{" "}
        <Link href="/how-we-rate">how we rate</Link> for where our information comes from.
      </p>
    </LegalPage>
  )
}
