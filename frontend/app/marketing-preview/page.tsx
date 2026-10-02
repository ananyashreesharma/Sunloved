import { ValuePropCarousel } from "@/components/marketing/ValuePropCarousel"

// Same carousel shown at the site root (see app/page.tsx) — kept reachable at this direct
// path too, for links that shouldn't depend on session state (ads, App Store copy, etc.).
export default function MarketingPreviewPage() {
  return <ValuePropCarousel />
}
