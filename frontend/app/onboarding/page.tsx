import { OumaOnboardingClient } from "@/components/ouma/onboarding/OumaOnboardingClient"

// Reachable by guests too (see OumaOnboardingClient's draft-save/resume flow) — the marketing
// carousel and login page both route here whether someone signs in for real or browses as a guest.
export default function OumaOnboardingPage() {
  return <OumaOnboardingClient />
}
