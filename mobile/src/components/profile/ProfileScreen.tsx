// V3 Me: who the app thinks you are, as one sentence you can tap to correct ("Oily skin, with acne
// and dark spots, in India."), then Reminders, My products, Streak history, language and plan.
// Everything here is on the device; signing in only adds syncing.

import { useCallback, useState } from "react"
import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect, type Href } from "expo-router"
import { countryByCode, type GuestData } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { loadGuestData } from "@/lib/guest-store"
import { FORWARD_ARROW } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
import { SectionLabel, StatusScrim } from "@/components/check/parts"
import { useCountryName } from "@/components/shared/CountryPicker"

// English says "in the United Kingdom", "in the Philippines".
const TAKES_THE = new Set(["US", "GB", "AE", "NL", "PH"])

const LANGUAGE_NAMES: Record<string, string> = { en: "English", es: "Español", ar: "العربية" }

export function ProfileScreen() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const nameOf = useCountryName()
  const [data, setData] = useState<GuestData | null>(null)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      loadGuestData().then((d) => !cancelled && setData(d))
      return () => {
        cancelled = true
      }
    }, []),
  )

  const editSkin = () => router.push({ pathname: "/onboarding", params: { edit: "skin" } })
  const editCountry = () => router.push({ pathname: "/onboarding", params: { edit: "country" } })

  const link = { textDecorationLine: "underline" as const, textDecorationColor: T.ink3 }
  const type = data?.skinType ? t(`onboarding.skinTypes.${data.skinType}`, { defaultValue: data.skinType }) : null
  const concerns = (data?.concerns ?? []).map((c) => t(`onboarding.concerns.${c}`, { defaultValue: c }).toLocaleLowerCase())
  const countryName = data?.country ? nameOf(data.country, countryByCode(data.country)?.name ?? data.country) : null
  const country = countryName && i18n.language === "en" && TAKES_THE.has(data!.country!) ? `the ${countryName}` : countryName

  const rows: [string, Href][] = [
    [t("me.reminders"), "/reminders"],
    [t("me.myProducts"), "/products"],
    [t("me.history"), "/history"],
  ]

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: 32 }}>
        <Text accessibilityRole="header" style={{ fontFamily: rubik.semibold, fontSize: 48, lineHeight: 52, letterSpacing: -2, color: T.ink }}>
          {t("me.title")}
        </Text>

        {/* The profile as a sentence; each underlined part opens the step that sets it. */}
        <Text style={{ marginTop: 14, fontFamily: rubik.light, fontSize: 26, lineHeight: 37, letterSpacing: -0.3, color: T.ink }}>
          <Text onPress={editSkin} accessibilityRole="link" style={link}>
            {type ? t("me.sentenceSkin", { type: type.toLocaleLowerCase() }).replace(/^./, (c) => c.toLocaleUpperCase()) : t("me.unknown")}
          </Text>
          {concerns.length > 0 && (
            <>
              {t("me.sentenceWith")}
              <Text onPress={editSkin} accessibilityRole="link" style={link}>
                {concerns.join(t("me.sentenceAnd"))}
              </Text>
            </>
          )}
          {t("me.sentenceIn")}
          <Text onPress={editCountry} accessibilityRole="link" style={link}>
            {country ?? t("me.unknown")}
          </Text>
          .
        </Text>
        <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t("me.editHint")}</Text>

        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: T.line }}>
          {rows.map(([label, href]) => (
            <Pressable
              key={label}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: T.line }}
            >
              <Text style={{ flex: 1, fontFamily: rubik.regular, fontSize: 17, color: T.ink }}>{label}</Text>
              <Text style={{ fontFamily: rubik.regular, fontSize: 17, color: T.ink3 }}>{FORWARD_ARROW}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 28, marginBottom: 8 }}>
          <SectionLabel>{t("me.language")}</SectionLabel>
        </View>
        {/* Language follows the phone (iOS and Android both have a per-app language setting). */}
        <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: rubik.regular, fontSize: 17, color: T.ink }}>{LANGUAGE_NAMES[i18n.language] ?? i18n.language}</Text>
            <Text style={{ marginTop: 2, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t("me.languageSub")}</Text>
          </View>
          <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.ink, textDecorationLine: "underline" }}>{t("me.openSettings")}</Text>
        </Pressable>

        <View style={{ marginTop: 28, marginBottom: 8 }}>
          <SectionLabel>{t("me.plan")}</SectionLabel>
        </View>
        <Text style={{ fontFamily: rubik.regular, fontSize: 19, lineHeight: 27, color: T.ink }}>{t("me.freePlan")}</Text>
        {/* No "Sign in to sync" yet: mobile doesn't use an account for anything (everything is on
            this device), so offering it would promise syncing that doesn't happen. The email sign-in
            screen (app/login.tsx) is ready for when syncing is built. */}
      </ScrollView>
      <StatusScrim />
    </View>
  )
}
