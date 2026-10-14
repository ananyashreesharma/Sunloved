// "Talk to me": a note from the founder and a way to reach her, for ideas, requests, problems and
// reviews. Messages go to the SkinLens server; the reply address is optional and used only to answer.

import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router } from "expo-router"
import { rubik } from "@/constants/fonts"
import { BACK_ARROW } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
import { loadGuestData } from "@/lib/guest-store"
import { sendFeedback } from "@/lib/api-client"
import { PrimaryButton, StatusScrim } from "@/components/check/parts"

export const FOUNDER_EMAIL = "anannyashree1425@gmail.com"

export function TalkScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [country, setCountry] = useState<string | null>(null)

  useEffect(() => {
    loadGuestData().then((g) => setCountry(g.country))
  }, [])

  const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canSend = message.trim().length >= 2 && emailOk && state !== "sending"

  async function send() {
    if (!canSend) return
    setState("sending")
    try {
      await sendFeedback(message.trim(), email.trim() || null, country, Platform.OS === "android" ? "android" : "ios")
      setState("sent")
    } catch {
      setState("error")
    }
  }

  const input = { borderRadius: 14, borderWidth: 1.5, borderColor: T.line, backgroundColor: T.surface, paddingHorizontal: 16, fontFamily: rubik.regular, fontSize: 17, color: T.ink } as const

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("check.back")} style={{ width: 44, height: 44, justifyContent: "center", marginLeft: -4 }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.semibold, fontSize: 36, letterSpacing: -1.2, color: T.ink }}>
          {t("talk.title")}
        </Text>
        <Text style={{ marginTop: 14, fontFamily: rubik.medium, fontSize: 19, lineHeight: 27, color: T.ink }}>{t("talk.hi")}</Text>
        <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink }}>{t("talk.note")}</Text>

        {state === "sent" ? (
          <View style={{ marginTop: 28, padding: 18, borderRadius: 18, backgroundColor: T.surface }}>
            <Text style={{ fontFamily: rubik.semibold, fontSize: 22, color: T.ink }}>{t("talk.sentT")}</Text>
            <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink2 }}>{t("talk.sentSub")}</Text>
            <Pressable
              onPress={() => {
                setMessage("")
                setState("idle")
              }}
              accessibilityRole="button"
              style={{ marginTop: 10, minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink, textDecorationLine: "underline" }}>{t("talk.another")}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder={t("talk.messagePlaceholder")}
              placeholderTextColor={T.ink3}
              textAlignVertical="top"
              accessibilityLabel={t("talk.title")}
              style={{ ...input, marginTop: 24, minHeight: 160, paddingTop: 14, lineHeight: 24, borderColor: message ? T.ink : T.line, writingDirection: "auto" }}
            />
            <Text style={{ marginTop: 18, fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("talk.emailLabel")}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={T.ink3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              accessibilityLabel={t("talk.emailLabel")}
              style={{ ...input, marginTop: 8, minHeight: 50, borderColor: emailOk ? T.line : T.tAvoid }}
            />
            <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 13, lineHeight: 18, color: T.ink2 }}>{t("talk.emailSub")}</Text>
            {state === "error" && <Text style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 15, lineHeight: 21, color: T.tAvoid }}>{t("talk.error")}</Text>}
            <View style={{ marginTop: 18 }}>
              <PrimaryButton label={state === "sending" ? t("talk.sending") : t("talk.send")} onPress={send} disabled={!canSend} />
            </View>
          </>
        )}

        <Text style={{ marginTop: 26, fontFamily: rubik.regular, fontSize: 15, lineHeight: 22, color: T.ink2 }}>{t("talk.direct")}</Text>
        <Pressable onPress={() => Linking.openURL(`mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent("SkinLens")}`)} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink, textDecorationLine: "underline" }}>{FOUNDER_EMAIL}</Text>
        </Pressable>
      </ScrollView>
      <StatusScrim />
    </KeyboardAvoidingView>
  )
}
