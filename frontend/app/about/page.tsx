import Link from "next/link"
import { ArrowLeft, ShieldCheck, FlaskConical, Database, Sparkles } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F3F5EF]">
      <header className="sticky top-0 z-40 border-b border-[#DDE3DA] bg-[#F3F5EF]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-[#DDE3DA] bg-white px-3 py-2 text-sm font-semibold text-[#17211A] no-underline"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#17211A]">
              <span
                className="ouma-display"
                style={{ fontSize: 16, color: "#F3F5EF", fontStyle: "italic" }}
              >
                K
              </span>
            </div>
            <span
              className="ouma-display text-base"
              style={{ color: "#17211A", fontStyle: "italic" }}
            >
              SkinLens
            </span>
          </div>
          <Link
            href="/scan"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white no-underline transition"
            style={{ background: "#17211A" }}
          >
            Scan
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16 pt-8">
        <h1 className="ouma-display text-3xl font-bold leading-tight text-[#17211A]">About SkinLens</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5A6259]">
          SkinLens helps you understand what&apos;s in your skincare — quickly, in plain English — and spot ingredients
          that may be irritating, restricted, or unsuitable for your routine.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            {
              Icon: ShieldCheck,
              title: "Safety-first",
              body: "We prioritize ingredient safety and clarity over marketing claims.",
            },
            {
              Icon: FlaskConical,
              title: "Evidence-led",
              body: "We rely on safety research, regulatory guidance, and dermatological context.",
            },
            {
              Icon: Database,
              title: "Live data",
              body: "Results come from your current scan/search — not screenshots or hardcoded lists.",
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-[#DDE3DA] bg-white p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#DFF0E4]">
                <Icon className="h-4 w-4 text-[#1D5C3B]" />
              </div>
              <p className="text-sm font-bold text-[#17211A]">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#5A6259]">{body}</p>
            </div>
          ))}
        </div>

        {/* Zones explainer card (matches your screenshot content) */}
        <section className="mt-10 rounded-3xl border border-[#DDE3DA] bg-white p-6">
          <h2 className="ouma-display text-xl font-bold text-[#17211A]">What the zones mean</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6259]">
            Every ingredient in your product is categorised into one of three zones based on safety research, regulatory
            data, and dermatological evidence.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#F8E5E1] px-4 py-2 text-xs font-bold text-[#8b2020]">
              RED — Avoid
            </span>
            <span className="rounded-full bg-[#F7EDD8] px-4 py-2 text-xs font-bold text-[#8a5a1a]">
              YELLOW — Caution
            </span>
            <span className="rounded-full bg-[#DFF0E4] px-4 py-2 text-xs font-bold text-[#3a5030]">
              GREEN — Safe
            </span>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#2A342C]">
            <p>
              <span className="font-black text-[#8A2E22]">RED</span>{" "}
              ingredients are banned or restricted by the EU, linked to endocrine disruption, or flagged as high-concern
              allergens.
            </p>
            <p>
              <span className="font-black text-[#7C5410]">YELLOW</span>{" "}
              ingredients are debated — safe for most but problematic for specific skin types or at high concentrations.
            </p>
            <p>
              <span className="font-black text-[#1D5C3B]">GREEN</span>{" "}
              ingredients have strong safety profiles and are well-studied. Many are actively beneficial.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-[#DDE3DA] bg-white p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DFF0E4]">
              <Sparkles className="h-4 w-4 text-[#1D5C3B]" />
            </div>
            <h2 className="ouma-display text-xl font-bold text-[#17211A]">How we classify</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#5A6259]">
            Our zone is a simple safety signal. It&apos;s not a medical diagnosis and doesn&apos;t replace patch testing or a
            dermatologist&apos;s advice.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#2A342C]">
            <li>• We consider ingredient safety profiles, common sensitizers, and regulatory restrictions.</li>
            <li>• We keep the output understandable: one zone + a short explanation per ingredient.</li>
            <li>• If something is missing from the database, we&apos;ll show it as caution until verified.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

