import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="ouma-container max-w-2xl py-12">
      <Link href="/" className="text-sm font-medium text-[#1D5C3B] no-underline">
        ← Home
      </Link>
      <h1 className="ouma-display mt-6 text-3xl font-medium text-[#17211A]">Terms of service</h1>
      <p className="mt-6 text-sm leading-relaxed text-[#5A6259]">
        SkinLens provides educational ingredient insights and is not a substitute for professional medical advice. By using
        the service you agree to these terms. A complete agreement will be available before public launch.
      </p>
    </main>
  )
}
