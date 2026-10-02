import { ValuePropCarousel } from "@/components/onboarding/ValuePropCarousel"

// Ported from frontend/app/page.tsx's guest branch (ValuePropCarousel). The session-based
// redirect to (app)/routine or /onboarding for signed-in users isn't wired up yet — there's no
// mobile auth/session state to check against (see src/lib/auth-tokens.ts), so this always shows
// the guest carousel for now.
export default function RootEntry() {
  return <ValuePropCarousel />
}
