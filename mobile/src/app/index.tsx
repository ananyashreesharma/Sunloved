import { useEffect, useState } from "react"
import { View } from "react-native"
import { Redirect } from "expo-router"
import { hasGuestData } from "@/lib/guest-store"
import { isSignedIn } from "@/lib/account"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import { useTheme } from "@/lib/theme"

// First launch → onboarding. Anyone who has already told us about their skin or built a routine
// goes straight to it, as does anyone signed in.
export default function RootEntry() {
  const { T } = useTheme()
  const [state, setState] = useState<"loading" | "new" | "returning">("loading")

  useEffect(() => {
    // Signed in (e.g. a new phone): the routine is in the account, so go straight to it.
    if (isSignedIn()) return setState("returning")
    hasGuestData().then((known) => setState(known ? "returning" : "new"))
  }, [])

  if (state === "loading") return <View style={{ flex: 1, backgroundColor: T.bg }} />
  if (state === "returning") return <Redirect href="/routine" />
  return <OnboardingFlow />
}
