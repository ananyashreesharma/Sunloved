// V3 "Save to an account" (mobile). Optional, and offered at moments of loss: after a 7-night
// streak, after a third saved check, or from Me before changing phones (`reason` says which).
// Email code sign-in (works in every country); then everything on this phone moves into the
// account (lib/account.ts) so it follows the person to a new phone and to the website.

import { useState } from "react"
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import { rubik } from "@/constants/fonts"
import { ApiError, sendEmailOtp, verifyEmailOtp } from "@/lib/api-client"
import { completeSignIn } from "@/lib/account"
import { useTheme } from "@/lib/theme"
import { PrimaryButton, StatusScrim } from "@/components/check/parts"

const TERMS_URL = "https://ananyashreesharma.github.io/skinlens-terms/"
const PRIVACY_URL = "https://ananyashreesharma.github.io/skinlens-privacy-policy/"
const REASONS = { streak: "reasonStreak", checks: "reasonChecks", phone: "reasonPhone" } as const

export function LoginScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const { reason, from } = useLocalSearchParams<{ reason?: keyof typeof REASONS; from?: string }>()
  const [step, setStep] = useState<"email" | "code" | "done">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function send() {
    if (!emailOk) return
    setBusy(true)
    setError(null)
    try {
      await sendEmailOtp(email.trim().toLowerCase())
      setStep("code")
    } catch {
      setError(t("acct.errSend"))
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code)) return
    setBusy(true)
    setError(null)
    let tokens: Awaited<ReturnType<typeof verifyEmailOtp>>
    try {
      tokens = await verifyEmailOtp(email.trim().toLowerCase(), code)
    } catch (e) {
      setError(e instanceof ApiError && e.status === 0 ? t("acct.errSend") : t("acct.errCode"))
      setBusy(false)
      return
    }
    try {
      await completeSignIn(tokens.accessToken, tokens.refreshToken)
      setStep("done")
    } catch {
      // Signed in, but moving the phone's data didn't finish: say so honestly.
      setError(t("acct.errSync"))
    } finally {
      setBusy(false)
    }
  }

  // From the welcome screen, a returning person's routine is now on this phone: go to it.
  const close = () => (step === "done" && from === "welcome") || !router.canGoBack() ? router.replace("/routine") : router.back()
  const input = { minHeight: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: T.line, fontFamily: rubik.regular, fontSize: 17, color: T.ink }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 8, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={close} accessibilityRole="button" style={{ minHeight: 44, alignSelf: "flex-end", justifyContent: "center" }}>
          <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>{step === "done" ? t("acct.done") : t("acct.notNow")}</Text>
        </Pressable>

        {step === "done" ? (
          <>
            <Text accessibilityRole="header" style={{ marginTop: 24, fontFamily: rubik.semibold, fontSize: 44, letterSpacing: -1.6, color: T.ink }}>
              {t("acct.doneTitle")}
            </Text>
            <Text style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 18, lineHeight: 26, color: T.ink }}>{t("acct.doneSub")}</Text>
          </>
        ) : (
          <>
            <Text accessibilityRole="header" style={{ marginTop: 12, fontFamily: rubik.semibold, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: T.ink }}>
              {step === "email" ? t("acct.title") : t("acct.codeTitle")}
            </Text>
            <Text style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 17, lineHeight: 24, color: T.ink2 }}>
              {step === "email" ? (reason && REASONS[reason] ? t(`acct.${REASONS[reason]}`) : t("acct.sub")) : t("acct.codeSub", { email: email.trim() })}
            </Text>

            {step === "email" ? (
              <TextInput
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={send}
                placeholder={t("acct.emailPlaceholder")}
                placeholderTextColor={T.ink3}
                accessibilityLabel={t("acct.email")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="send"
                style={[input, { marginTop: 24 }]}
              />
            ) : (
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                onSubmitEditing={verify}
                placeholder="000000"
                placeholderTextColor={T.ink3}
                accessibilityLabel={t("acct.code")}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                style={[input, { marginTop: 24, fontSize: 24, letterSpacing: 8, textAlign: "center" }]}
              />
            )}

            {error && <Text style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 15, lineHeight: 21, color: T.tAvoid }}>{error}</Text>}

            <View style={{ marginTop: 16 }}>
              {step === "email" ? (
                <PrimaryButton label={busy ? t("acct.sending") : t("acct.sendCode")} onPress={send} disabled={!emailOk || busy} />
              ) : (
                <PrimaryButton label={busy ? t("acct.saving") : t("acct.signIn")} onPress={verify} disabled={code.length !== 6 || busy} />
              )}
            </View>

            {step === "code" && (
              <View style={{ marginTop: 8, flexDirection: "row", gap: 20 }}>
                <Pressable onPress={() => setStep("email")} style={{ minHeight: 44, justifyContent: "center" }}>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("acct.otherEmail")}</Text>
                </Pressable>
                <Pressable onPress={send} disabled={busy} style={{ minHeight: 44, justifyContent: "center" }}>
                  <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.ink, textDecorationLine: "underline" }}>{t("acct.resend")}</Text>
                </Pressable>
              </View>
            )}

            <Text style={{ marginTop: 24, fontFamily: rubik.regular, fontSize: 13, lineHeight: 19, color: T.ink2 }}>
              {t("acct.consentBefore")}
              <Text onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link" style={{ textDecorationLine: "underline", color: T.ink }}>
                {t("acct.terms")}
              </Text>
              {t("acct.consentAnd")}
              <Text onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link" style={{ textDecorationLine: "underline", color: T.ink }}>
                {t("acct.privacy")}
              </Text>
              {t("acct.consentAfter")}
            </Text>
          </>
        )}
      </ScrollView>
      {step === "done" && (
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12 }}>
          <PrimaryButton label={t("acct.done")} onPress={close} />
        </View>
      )}
      <StatusScrim />
    </KeyboardAvoidingView>
  )
}
