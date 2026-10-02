import { OumaAppShell } from "@/components/ouma/OumaAppShell"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/authOptions"
import { redirect } from "next/navigation"

// Guests are welcome here — screens that need real user data show a "sign in to unlock this"
// state instead of redirecting away, so people can look around before creating an account.
export default async function OumaWebAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (session) {
    const user = session.user as typeof session.user & { onboardingDone?: boolean }
    if (!user.onboardingDone) redirect("/onboarding")
  }

  return <OumaAppShell>{children}</OumaAppShell>
}
