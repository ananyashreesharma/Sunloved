// Port of frontend/components/ouma/OumaLoginClient.tsx's entry step, restructured for reasons the
// web version doesn't have to deal with:
// 1. Phone-OTP and Google/Apple sign-in aren't wired up on mobile — no OAuth flow exists here yet,
//    so the guest path is the primary CTA up top instead of a small footnote below a
//    fully-interactive-looking sign-in form.
// 2. Sign-in is email, not phone/WhatsApp OTP — WhatsApp delivery costs money per message and,
//    more importantly, the web version's phone field hardcoded a +91 country code with no way to
//    change it, which silently locked out anyone outside India before they could even try. Email
//    has no such locale assumption and is far cheaper to send at scale than SMS/WhatsApp OTP.
// 3. Email sign-in is real (backend/src/modules/auth/auth.controller.ts's email-otp/* + refresh
//    endpoints, added alongside this screen) — a two-step send-code/verify-code flow that stores a
//    real JWT bearer pair on success. Google/Apple are NOT wired up (that needs native OAuth SDK
//    setup with real client credentials this app doesn't have yet), so they get their own honestly
//    "coming soon" treatment instead of looking as live as the email form above them.

import { useState } from "react"
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { sendEmailOtp, verifyEmailOtp, ApiError } from "@/lib/api-client"
import { setTokens } from "@/lib/auth-tokens"
import { SoftPressable } from "@/components/shared/SoftPressable"

type Mode = "login" | "signup"
type Step = "email" | "code"

const TERMS_URL = "https://ananyashreesharma.github.io/skinlens-terms/"
const PRIVACY_URL = "https://ananyashreesharma.github.io/skinlens-privacy-policy/"

export function LoginScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ next?: string }>()
  // The carousel only ever passes "/onboarding"; anything else falls back to the routine home.
  const next = params.next === "/onboarding" ? "/onboarding" : "/routine"

  const [mode, setMode] = useState<Mode>("login")
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const codeValid = /^\d{6}$/.test(code)

  function oauthNotAvailable() {
    setNotice(t("login.oauthNotice"))
  }

  function browseAsGuest() {
    router.replace(next)
  }

  async function sendCode() {
    setBusy(true)
    setError(null)
    try {
      await sendEmailOtp(email.trim().toLowerCase())
      setStep("code")
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("login.errSend"))
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode() {
    setBusy(true)
    setError(null)
    try {
      const res = await verifyEmailOtp(email.trim().toLowerCase(), code)
      await setTokens(res.accessToken, res.refreshToken)
      router.replace(next)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("login.errVerify"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bone }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: colors.bone, letterSpacing: 0.5 }}>SL</Text>
          </View>
          <Text style={{ marginTop: 10, fontFamily: fonts.display, fontSize: 20, color: colors.ink, fontStyle: "italic" }}>
            SkinLens
          </Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 14, color: colors.mute }}>{t("login.brandTagline")}</Text>
        </View>

        {/* Primary action — always works, no account needed. Leads. */}
        <View style={{ marginTop: 28 }}>
          <SoftPressable
            onPress={browseAsGuest}
            style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: "#fff" }}>{t("login.continueGuest")}</Text>
          </SoftPressable>
          <Text style={{ marginTop: 8, textAlign: "center", fontFamily: fonts.body, fontSize: 12.5, color: colors.mute }}>
            {t("login.guestNote")}
          </Text>
        </View>

        <View style={{ marginTop: 28, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.mute }}>{t("login.dividerEmail")}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
        </View>

        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.card,
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 22,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <View style={{ flexDirection: "row", borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 4 }}>
            {(["login", "signup"] as Mode[]).map((m) => (
              <SoftPressable
                key={m}
                onPress={() => {
                  setMode(m)
                  setError(null)
                }}
                disabled={step === "code"}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m, disabled: step === "code" }}
                scaleTo={0.98}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: mode === m ? colors.ink : "transparent",
                  opacity: step === "code" ? 0.5 : 1,
                }}
              >
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: mode === m ? "#fff" : colors.mute }}>
                  {m === "login" ? t("login.tabLogin") : t("login.tabSignup")}
                </Text>
              </SoftPressable>
            ))}
          </View>

          {step === "email" ? (
            <>
              <Text style={{ marginTop: 20, textAlign: "center", fontFamily: fonts.display, fontSize: 19, color: colors.ink }}>
                {mode === "login" ? t("login.welcomeBackTitle") : t("login.startFreeTitle")}
              </Text>
              <Text style={{ marginTop: 4, textAlign: "center", fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>
                {mode === "login" ? t("login.welcomeBackSub") : t("login.startFreeSub")}
              </Text>

              <Text style={{ marginTop: 20, fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink }}>{t("login.emailLabel")}</Text>
              <TextInput
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt)
                  setError(null)
                }}
                placeholder={t("login.emailPlaceholder")}
                placeholderTextColor={colors.mute}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!busy}
                style={{
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  fontFamily: fonts.body,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />

              {/* Checkbox and the link-bearing text are deliberately separate accessibility elements,
                  not one Pressable wrapping both: a parent with accessibilityRole="checkbox" collapses
                  everything inside it (RN/iOS merges descendants into one VoiceOver stop), which would
                  make the nested Terms/Privacy links completely unreachable by screen reader — a real
                  regression against this app's earlier accessibility pass. hitSlop compensates for the
                  checkbox's small (18px) visual size so its actual touch target still clears the ~44pt
                  minimum without inflating the box itself. */}
              <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setAgree((a) => !a)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={t("login.consent")}
                  accessibilityState={{ checked: agree }}
                  hitSlop={13}
                  style={{ marginTop: 2 }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: agree ? colors.accent : colors.line,
                      backgroundColor: agree ? colors.accent : "transparent",
                    }}
                  />
                </Pressable>
                <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.mute }}>
                  {t("login.consent")}{" "}
                  <Text
                    onPress={() => Linking.openURL(TERMS_URL).catch(() => setError(t("login.linkOpenFailed")))}
                    accessibilityRole="link"
                    style={{ color: colors.accent, fontFamily: fonts.bodySemiBold }}
                  >
                    {t("login.consentTerms")}
                  </Text>
                  {t("login.consentAnd")}
                  <Text
                    onPress={() => Linking.openURL(PRIVACY_URL).catch(() => setError(t("login.linkOpenFailed")))}
                    accessibilityRole="link"
                    style={{ color: colors.accent, fontFamily: fonts.bodySemiBold }}
                  >
                    {t("login.consentPrivacy")}
                  </Text>
                </Text>
              </View>

              {error && (
                <Text style={{ marginTop: 14, fontFamily: fonts.body, fontSize: 13, color: "#8A2E22", lineHeight: 18 }}>{error}</Text>
              )}

              <SoftPressable
                onPress={sendCode}
                disabled={!emailValid || !agree || busy}
                style={{
                  marginTop: 18,
                  backgroundColor: colors.accent,
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: !emailValid || !agree ? 0.4 : busy ? 0.7 : 1,
                }}
              >
                {busy && <ActivityIndicator size="small" color="#fff" />}
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#fff" }}>{t("login.sendCode")}</Text>
              </SoftPressable>
            </>
          ) : (
            <>
              <Text style={{ marginTop: 20, textAlign: "center", fontFamily: fonts.display, fontSize: 19, color: colors.ink }}>
                {t("login.checkEmailTitle")}
              </Text>
              <Text style={{ marginTop: 4, textAlign: "center", fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>
                {t("login.checkEmailSub", { email: email.trim() })}
              </Text>

              <Text style={{ marginTop: 20, fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink }}>{t("login.codeLabel")}</Text>
              <TextInput
                value={code}
                onChangeText={(txt) => {
                  setCode(txt.replace(/\D/g, "").slice(0, 6))
                  setError(null)
                }}
                placeholder="000000"
                placeholderTextColor={colors.mute}
                keyboardType="number-pad"
                maxLength={6}
                editable={!busy}
                style={{
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 20,
                  letterSpacing: 6,
                  textAlign: "center",
                  color: colors.ink,
                }}
              />

              {error && (
                <Text style={{ marginTop: 14, fontFamily: fonts.body, fontSize: 13, color: "#8A2E22", lineHeight: 18 }}>{error}</Text>
              )}

              <SoftPressable
                onPress={verifyCode}
                disabled={!codeValid || busy}
                style={{
                  marginTop: 18,
                  backgroundColor: colors.accent,
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: !codeValid ? 0.4 : busy ? 0.7 : 1,
                }}
              >
                {busy && <ActivityIndicator size="small" color="#fff" />}
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#fff" }}>{t("login.verifyContinue")}</Text>
              </SoftPressable>

              <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "center", gap: 16 }}>
                <Pressable
                  onPress={() => {
                    setStep("email")
                    setCode("")
                    setError(null)
                  }}
                  disabled={busy}
                >
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.mute }}>{t("login.changeEmail")}</Text>
                </Pressable>
                <Pressable onPress={sendCode} disabled={busy}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent }}>{t("login.resendCode")}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Honestly non-functional — no native OAuth SDK wired up yet, unlike the email flow above.
            Visually dimmer + labeled, instead of looking as live as a working form. */}
        <View style={{ marginTop: 16, opacity: 0.55 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
            <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.mute }}>{t("login.oauthDivider")}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
          </View>
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={oauthNotAvailable}
              style={{ borderWidth: 1.5, borderColor: colors.line, borderRadius: 16, paddingVertical: 13, alignItems: "center" }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink }}>{t("login.continueGoogle")}</Text>
            </Pressable>
            <Pressable
              onPress={oauthNotAvailable}
              style={{ borderWidth: 1.5, borderColor: colors.line, borderRadius: 16, paddingVertical: 13, alignItems: "center" }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink }}>{t("login.continueApple")}</Text>
            </Pressable>
          </View>
          {notice && (
            <Text style={{ marginTop: 10, textAlign: "center", fontFamily: fonts.body, fontSize: 12, color: "#7C5410", lineHeight: 17 }}>
              {notice}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
