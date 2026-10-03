import { useEffect, useState } from "react"
import { View } from "react-native"
import { Redirect } from "expo-router"
import { hasGuestData } from "@/lib/guest-store"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import { useTheme } from "@/lib/theme"

// First launch → onboarding. Anyone who has already told us about their skin or built a routine
// goes straight to it. (Signed-in sessions aren't restored on mobile yet; see lib/auth-tokens.ts.)
export default function RootEntry() {
  const { T } = useTheme()
  const [state, setState] = useState<"loading" | "new" | "returning">("loading")

  useEffect(() => {
    hasGuestData().then((known) => setState(known ? "returning" : "new"))
  }, [])

  if (state === "loading") return <View style={{ flex: 1, backgroundColor: T.bg }} />
  if (state === "returning") return <Redirect href="/routine" />
  return <OnboardingFlow />
}
