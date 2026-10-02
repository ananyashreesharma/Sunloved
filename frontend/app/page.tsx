import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/authOptions"
import { redirect } from "next/navigation"
import { ValuePropCarousel } from "@/components/marketing/ValuePropCarousel"

// The site's / and the native app shell load the same URL, so this is the entry point for both.
// Signed-in users skip straight to where they left off; everyone else (guests, including anyone
// who hasn't made an account yet) sees the value-prop carousel, which itself links to Onboarding.
export default async function RootEntry() {
  const session = await getServerSession(authOptions)

  if (session) {
    const user = session.user as typeof session.user & { onboardingDone?: boolean }
    redirect(user.onboardingDone ? "/app/routine" : "/onboarding")
  }

  return <ValuePropCarousel />
}
