import { redirect } from "next/navigation"

// Paid plans aren't on sale: there is no checkout, and the app promises "Free — scans stay free".
// The old plans page (₹99 / ₹49 a month) is in git history (components/ouma/OumaPricingDark.tsx) for
// when a business model is decided.
export default function PricingPage() {
  redirect("/")
}
