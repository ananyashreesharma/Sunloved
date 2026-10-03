import "@/global.css"
import "@/lib/i18n"

import { useEffect } from "react"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { QueryClientProvider } from "@tanstack/react-query"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { queryClient } from "@/lib/query-client"
import { AppChromeProvider } from "@/lib/app-chrome-context"
import { useOumaFonts } from "@/constants/fonts"
import { loadGuestData } from "@/lib/guest-store"
import { syncReminders } from "@/lib/notifications"
import { initAccount, useAccount } from "@/lib/account"
import { initAnalytics } from "@/lib/analytics"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const fontsLoaded = useOumaFonts()
  // Whether this phone is signed in decides where the routine is read from; know it before screens load.
  const { ready } = useAccount()
  useEffect(() => {
    initAccount()
    initAnalytics()
  }, [])

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync()
  }, [fontsLoaded, ready])

  useEffect(() => {
    // Self-healing backstop for returning users (ProfileScreen/OnboardingFlow already reschedule
    // on every change) — only for guests who've actually built a routine, so a fresh install never
    // prompts for notification permission before onboarding even starts.
    loadGuestData().then((data) => {
      if (data.steps.length > 0) syncReminders(data).catch(() => {})
    })
  }, [])

  if (!fontsLoaded || !ready) return null

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppChromeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" options={{ presentation: "modal" }} />
            <Stack.Screen name="onboarding" />
            {/* replace()'d into from onboarding/login, so there's nothing sensible below it in the
                stack — without this, swiping back from Routine lands you on the marketing carousel. */}
            <Stack.Screen name="(app)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="products" />
            <Stack.Screen name="add-step" options={{ presentation: "modal" }} />
            <Stack.Screen name="history" />
            <Stack.Screen name="reminders" />
            <Stack.Screen name="scan-confirm" />
            <Stack.Screen name="scan-result" />
          </Stack>
        </AppChromeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
