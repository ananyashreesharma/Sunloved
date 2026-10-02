import Link from "next/link"

export default function DisclaimerPage() {
  return (
    <main className="ouma-container max-w-2xl py-12">
      <Link href="/" className="text-sm font-medium text-[#1D5C3B] no-underline">
        ← Home
      </Link>
      <h1 className="ouma-display mt-6 text-3xl font-medium text-[#17211A]">Disclaimer</h1>
      <p className="mt-6 text-sm leading-relaxed text-[#5A6259]">
        Information from Ouma is for general wellness education only. Always patch-test new products and consult a
        dermatologist for medical concerns.
      </p>
    </main>
  )
}
