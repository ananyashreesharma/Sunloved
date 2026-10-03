import { AppShell } from "@/components/v3/AppShell"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/authOptions"
import { redirect } from "next/navigation"

// Guests are welcome here: everything works on this device; signing in only adds syncing.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (session) {
    const user = session.user as typeof session.user & { onboardingDone?: boolean }
    if (!user.onboardingDone) redirect("/onboarding")
  }

  return <AppShell>{children}</AppShell>
}
