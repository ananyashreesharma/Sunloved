import "@/global.css"
import "@/lib/i18n"

import { useEffect } from "react"
import { Stack } from "expo-router"
import { AppState, Pressable, Text, View } from "react-native"
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
    // Also on every return to the foreground: that keeps the one-time "new week" message (see
    // notifications.ts) a week away for anyone still opening the app.
    const sync = () =>
      loadGuestData().then((data) => {
        if (data.steps.length > 0) syncReminders(data).catch(() => {})
      })
    sync()
    const sub = AppState.addEventListener("change", (s) => s === "active" && sync())
    return () => sub.remove()
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

/**
 * Shown instead of a blank or red screen if a screen crashes. Plain words and a way back; the
 * routine and checks are safe on the phone or in the account either way.
 */
export function ErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F2ECE1", padding: 28, justifyContent: "center" }}>
      <Text style={{ fontSize: 30, fontWeight: "600", color: "#1A1A17" }}>Something went wrong.</Text>
      <Text style={{ marginTop: 12, fontSize: 17, lineHeight: 24, color: "#615D55" }}>Your routine and saved checks are safe. Try again, and if it keeps happening, restart the app.</Text>
      <Pressable onPress={retry} accessibilityRole="button" style={{ marginTop: 24, minHeight: 56, borderRadius: 16, backgroundColor: "#1A1A17", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 17, fontWeight: "600", color: "#F2ECE1" }}>Try again</Text>
      </Pressable>
    </View>
  )
}
