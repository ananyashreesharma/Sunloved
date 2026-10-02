import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="ouma-container max-w-2xl py-12">
      <Link href="/" className="text-sm font-medium text-[#1D5C3B] no-underline">
        ← Home
      </Link>
      <h1 className="ouma-display mt-6 text-3xl font-medium text-[#17211A]">Privacy policy</h1>
      <p className="mt-6 text-sm leading-relaxed text-[#5A6259]">
        SkinLens respects your privacy. This placeholder summarizes our approach: we use your account and scan data only to
        power ingredient analysis, routine tools, and product recommendations. We do not sell your personal data. Full
        legal text will be published before public launch.
      </p>
      <p className="mt-4 text-sm text-[#5A6259]">Questions: hello@skinlens.in</p>
    </main>
  )
}
