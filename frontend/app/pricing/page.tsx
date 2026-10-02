import Link from "next/link"
import { OumaPricingDark } from "@/components/ouma/OumaPricingDark"

export default function OumaPricingPage() {
  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: "1px solid rgba(243,245,239,0.1)", background: "rgba(23,33,26,0.85)" }}>
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#F3F5EF" }}>
              <span className="ouma-display" style={{ fontSize: 14, color: "#17211A", fontStyle: "italic" }}>S</span>
            </div>
            <span className="ouma-display text-sm" style={{ color: "#F3F5EF", fontStyle: "italic" }}>SkinLens</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold no-underline"
            style={{ background: "rgba(243,245,239,0.12)", color: "#F3F5EF", border: "1px solid rgba(243,245,239,0.15)" }}
          >
            Log in
          </Link>
        </div>
      </header>
      <OumaPricingDark />
    </>
  )
}
