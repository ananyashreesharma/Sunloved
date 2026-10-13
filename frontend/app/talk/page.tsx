import type { Metadata } from "next"
import { SiteFooter, SiteHeader } from "@/components/v3/SiteChrome"
import { TalkForm } from "@/components/v3/TalkForm"

export const metadata: Metadata = {
  title: "Talk to me | SkinLens",
  description: "Ideas, requests, problems or a review: write to the person building SkinLens. Every message is read.",
}

export default function TalkPage() {
  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <SiteHeader />
      <main style={{ flex: 1, width: "100%", maxWidth: 640, margin: "0 auto", padding: "48px 20px 72px" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(40px, 6vw, 60px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1 }}>Talk to me</h1>
        <p style={{ margin: "20px 0 0", fontSize: 21, fontWeight: 500 }}>Hi, I&apos;m Anannyashree.</p>
        <p style={{ margin: "8px 0 0", fontSize: 18, lineHeight: 1.6 }}>
          I&apos;m building SkinLens, and I read every message myself. Tell me what&apos;s missing, what confuses you, an idea you&apos;d love, or a review. Nothing is too
          small.
        </p>
        <TalkForm />
      </main>
      <SiteFooter />
    </div>
  )
}
