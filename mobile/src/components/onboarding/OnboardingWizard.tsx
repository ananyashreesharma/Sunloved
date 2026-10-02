// Port of frontend/components/ouma/onboarding/OumaOnboardingClient.tsx to React Native. Same
// four screens, same copy and ordering rules — laid out with RN primitives, using the guest-store
// (mobile/src/lib/guest-store.ts) instead of the backend API, since there's no mobile session/login
// flow built yet (matches src/app/index.tsx's precedent of always running the guest path). Once
// login exists, this gets the same isGuest branch + resume-on-sign-in effect as the web version.

import { useEffect, useRef, useState } from "react"
import { View, Text, Pressable, Animated, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { BACK_ARROW } from "@/lib/i18n"
import { STEP_ORDER, loadGuestData, updateGuestData } from "@/lib/guest-store"
import { syncReminders } from "@/lib/notifications"
import { formatTimeForDisplay } from "@/lib/time-format"
import { TimeEntryField } from "@/components/shared/TimeEntryField"
import { SoftPressable } from "@/components/shared/SoftPressable"

const SKIN_TYPE_CODES = ["oily", "dry", "combination", "sensitive"] as const
const CONCERN_CODES = ["acne", "pigmentation", "redness", "texture", "dullness"] as const

// Stored as-is (not translated) — RoutineHome/guest-store order steps by matching this literal
// English text against STEP_ORDER (mirrors the backend's CATEGORY_STEP_ORDER, also string-keyed),
// so a step added via one of these buttons keeps this exact name regardless of display language.
// A Spanish/Arabic speaker sees a translated button label, but the step it adds is still named
// "Cleanser" etc. in their routine — a real limitation inherited from how ordering is keyed here,
// not something this pass fixes (that needs STEP_ORDER keyed on a language-neutral code instead).
const QUICK_STEPS = [
  { name: "Cleanser", labelKey: "cleanser" },
  { name: "Toner", labelKey: "toner" },
  { name: "Serum", labelKey: "serum" },
  { name: "Moisturiser", labelKey: "moisturiser" },
  { name: "SPF", labelKey: "spf" },
] as const

type Step = { name: string; kind: string }

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onPress: () => void
}) {
  // Animates the selected/unselected color swap instead of snapping instantly — the same
  // information (picked vs. not) reads a lot softer arriving over ~180ms than appearing in one
  // frame. useNativeDriver: false is required for color interpolation (not a mistake) — it's a
  // cheap, infrequent transition (tapping a chip), not something driven every frame.
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: selected ? 1 : 0, duration: 180, useNativeDriver: false }).start()
  }, [selected, anim])

  const backgroundColor = disabled && !selected ? "transparent" : anim.interpolate({ inputRange: [0, 1], outputRange: [colors.card, colors.accent] })
  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [colors.line, colors.accent] })
  const textColor = disabled && !selected ? "#AAB4AB" : anim.interpolate({ inputRange: [0, 1], outputRange: [colors.ink, "#fff"] })

  return (
    <SoftPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      hitSlop={4}
      style={{ opacity: disabled && !selected ? 0.6 : 1 }}
    >
      <Animated.View
        style={{
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 999,
          borderWidth: selected ? 1.5 : 1,
          borderColor,
          backgroundColor,
        }}
      >
        <Animated.Text style={{ fontFamily: selected ? fonts.monoSemiBold : fonts.mono, fontSize: 14, color: textColor }}>
          {label}
        </Animated.Text>
      </Animated.View>
    </SoftPressable>
  )
}

function Continue({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <SoftPressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: "100%",
        backgroundColor: disabled ? "rgba(23,33,26,.2)" : colors.accent,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: "#fff" }}>{label}</Text>
    </SoftPressable>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: fonts.display,
        fontSize: 13,
        letterSpacing: 1.3,
        textTransform: "uppercase",
        color: colors.mute,
      }}
    >
      {children}
    </Text>
  )
}

export function OnboardingWizard() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [screen, setScreen] = useState<1 | 2 | 3 | 4>(1)
  const [skinType, setSkinType] = useState<string | null>(null)
  const [concerns, setConcerns] = useState<string[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [stepInput, setStepInput] = useState("")
  const [morningTime, setMorningTime] = useState("07:30")
  const [nightTime, setNightTime] = useState("21:30")
  const [channel, setChannel] = useState<"push" | "whatsapp">("push")
  const [saving, setSaving] = useState(false)

  const orderedSteps = [...steps].sort((a, b) => (STEP_ORDER[a.kind] ?? 99) - (STEP_ORDER[b.kind] ?? 99))

  function addStep(name: string, kind: string) {
    if (steps.some((s) => s.name.toLowerCase() === name.toLowerCase())) return
    setSteps((prev) => [...prev, { name, kind }])
  }

  function addTypedStep() {
    const name = stepInput.trim()
    if (!name) return
    addStep(name, "custom")
    setStepInput("")
  }

  function toggleConcern(code: string) {
    setConcerns((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= 2) return prev
      return [...prev, code]
    })
  }

  function skip() {
    // A fat-finger tap on Skip used to discard everything typed with zero warning — only worth
    // confirming if there's actually something to lose.
    const hasProgress = !!skinType || concerns.length > 0 || steps.length > 0
    if (!hasProgress) {
      router.replace("/routine")
      return
    }
    Alert.alert(t("onboarding.skipAlertTitle"), t("onboarding.skipAlertBody"), [
      { text: t("onboarding.keepGoing"), style: "cancel" },
      { text: t("onboarding.skipAnyway"), style: "destructive", onPress: () => router.replace("/routine") },
    ])
  }

  async function finish() {
    setSaving(true)
    // Merge with whatever guest steps already exist (e.g. added via Routine's "+ Add a step"
    // before reaching onboarding) instead of replacing them outright — matches
    // OumaOnboardingClient's guest branch. A plain `steps: wizardSteps` here would silently wipe
    // any steps the guest had already saved.
    const existing = await loadGuestData()
    const wizardSteps = orderedSteps
      .filter((s) => !existing.steps.some((e) => e.name.toLowerCase() === s.name.toLowerCase()))
      .map((s) => ({
        id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: s.name,
        brand: null,
        when: "night" as const,
        frequency: "daily" as const,
      }))
    const updated = await updateGuestData({ skinType, concerns, steps: [...existing.steps, ...wizardSteps], morningTime, nightTime, channel })
    syncReminders(updated).catch(() => {})
    router.replace("/routine")
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bone }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {screen === 1 && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.mute }}>1 / 3</Text>
              <Pressable onPress={skip}>
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent }}>{t("onboarding.skip")}</Text>
              </Pressable>
            </View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 30,
                lineHeight: 32,
                marginTop: 14,
                textTransform: "uppercase",
                color: colors.ink,
              }}
            >
              {t("onboarding.step1Title")}
            </Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 14, color: colors.mute }}>{t("onboarding.step1Sub")}</Text>

            <View style={{ marginTop: 24 }}>
              <SectionLabel>{t("onboarding.skinTypeLabel")}</SectionLabel>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {SKIN_TYPE_CODES.map((code) => (
                <Chip
                  key={code}
                  label={t(`onboarding.skinTypes.${code}`)}
                  selected={skinType === code}
                  onPress={() => setSkinType(code)}
                />
              ))}
            </View>

            <View style={{ marginTop: 24, flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <SectionLabel>{t("onboarding.concernsLabel")}</SectionLabel>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.mute }}>
                {t("onboarding.concernsPicked", { count: concerns.length })}
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {CONCERN_CODES.map((code) => (
                <Chip
                  key={code}
                  label={t(`onboarding.concerns.${code}`)}
                  selected={concerns.includes(code)}
                  disabled={!concerns.includes(code) && concerns.length >= 2}
                  onPress={() => toggleConcern(code)}
                />
              ))}
            </View>
            <Text style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: colors.mute }}>
              {t("onboarding.concernsHelp")}
            </Text>

            <View style={{ marginTop: "auto", paddingTop: 20 }}>
              <Continue label={t("onboarding.continue")} onPress={() => setScreen(2)} disabled={!skinType} />
            </View>
          </View>
        )}

        {screen === 2 && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
              <Pressable onPress={() => setScreen(1)}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.mute }}>{BACK_ARROW} 2 / 3</Text>
              </Pressable>
              <Pressable onPress={skip}>
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent }}>{t("onboarding.skip")}</Text>
              </Pressable>
            </View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 30,
                lineHeight: 32,
                marginTop: 14,
                textTransform: "uppercase",
                color: colors.ink,
              }}
            >
              {t("onboarding.step2Title")}
            </Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 14, color: colors.mute }}>{t("onboarding.step2Sub")}</Text>

            <TextInput
              value={stepInput}
              onChangeText={setStepInput}
              onSubmitEditing={addTypedStep}
              returnKeyType="done"
              placeholder={t("onboarding.stepPlaceholder")}
              placeholderTextColor={colors.mute}
              style={{
                marginTop: 18,
                backgroundColor: colors.card,
                borderWidth: 1.5,
                borderColor: colors.accent,
                borderRadius: 12,
                paddingVertical: 13,
                paddingHorizontal: 16,
                fontFamily: fonts.body,
                fontSize: 15,
                color: colors.ink,
              }}
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {QUICK_STEPS.map((q) => {
                const added = steps.some((s) => s.name === q.name)
                return (
                  <Chip
                    key={q.name}
                    label={`+ ${t(`common.quickSteps.${q.labelKey}`)}`}
                    selected={false}
                    disabled={added}
                    onPress={() => addStep(q.name, q.name)}
                  />
                )
              })}
            </View>

            <View style={{ marginTop: 22, flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <SectionLabel>{t("onboarding.orderedLabel")}</SectionLabel>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.mute }}>
                {t("onboarding.stepsCount", { count: orderedSteps.length })}
              </Text>
            </View>
            <View style={{ marginTop: 10, gap: 8 }}>
              {orderedSteps.map((s, i) => (
                <View
                  key={s.name}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: colors.line,
                  }}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.mute }}>{i + 1}</Text>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink }}>{s.name}</Text>
                </View>
              ))}
              {orderedSteps.length === 0 && (
                <Text style={{ fontFamily: fonts.bodyItalic, fontSize: 13, color: colors.mute }}>{t("onboarding.emptySteps")}</Text>
              )}
            </View>
            {orderedSteps.length > 1 && (
              <Text style={{ marginTop: 10, fontFamily: fonts.bodyItalic, fontSize: 12, color: colors.mute }}>
                {t("onboarding.orderHint")}
              </Text>
            )}

            <View style={{ marginTop: "auto", paddingTop: 20 }}>
              <Continue label={t("onboarding.continue")} onPress={() => setScreen(3)} />
            </View>
          </View>
        )}

        {screen === 3 && (
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => setScreen(2)}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.mute }}>{BACK_ARROW} 3 / 3</Text>
            </Pressable>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 30,
                lineHeight: 32,
                marginTop: 14,
                textTransform: "uppercase",
                color: colors.ink,
              }}
            >
              {t("onboarding.step3Title")}
            </Text>

            <View style={{ marginTop: 20, flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: colors.mute }}>
                  {t("onboarding.morningLabel")}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <TimeEntryField value={morningTime} onChange={setMorningTime} fontSize={19} color={colors.ink} />
                </View>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: colors.accent }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: colors.accent }}>
                  {t("onboarding.nightLabel")}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <TimeEntryField value={nightTime} onChange={setNightTime} fontSize={19} color={colors.ink} />
                </View>
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <SectionLabel>{t("onboarding.whereLabel")}</SectionLabel>
            </View>
            <Pressable
              onPress={() => setChannel("push")}
              accessibilityRole="radio"
              accessibilityState={{ selected: channel === "push" }}
              style={{
                marginTop: 10,
                backgroundColor: colors.card,
                borderWidth: channel === "push" ? 1.5 : 1,
                borderColor: channel === "push" ? colors.accent : colors.line,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink }}>{t("onboarding.pushTitle")}</Text>
              <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("onboarding.pushBody")}</Text>
            </Pressable>
            <View
              style={{
                marginTop: 10,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 14,
                padding: 16,
                opacity: 0.6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink }}>{t("onboarding.whatsappTitle")}</Text>
                <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 4, paddingVertical: 1, paddingHorizontal: 5 }}>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.mute }}>{t("onboarding.comingSoon")}</Text>
                </View>
              </View>
              <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("onboarding.whatsappBody")}</Text>
            </View>
            <Text style={{ marginTop: 12, fontFamily: fonts.body, fontSize: 12, color: colors.mute }}>{t("onboarding.quietHours")}</Text>

            <View style={{ marginTop: "auto", paddingTop: 20 }}>
              <Continue label={t("onboarding.setReminders")} onPress={() => setScreen(4)} />
            </View>
          </View>
        )}

        {screen === 4 && (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 34,
                lineHeight: 36,
                marginTop: 22,
                textTransform: "uppercase",
                color: colors.ink,
              }}
            >
              {t("onboarding.step4Title")}
            </Text>
            <Text style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 15, color: "#2A342C" }}>
              {t("onboarding.reminderArrivesPrefix")}{" "}
              <Text style={{ fontFamily: fonts.monoSemiBold }}>{formatTimeForDisplay(nightTime)}</Text> {t("onboarding.reminderArrivesSuffix")}
            </Text>

            <View style={{ marginTop: 22, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 18 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 14, letterSpacing: 1.1, textTransform: "uppercase", color: colors.ink }}>
                  {t("onboarding.tonightPm")}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.mute }}>
                  {t("onboarding.stepsCount", { count: orderedSteps.length })}
                </Text>
              </View>
              <View style={{ marginTop: 14, gap: 12 }}>
                {orderedSteps.map((s, i) => (
                  <View key={s.name} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.mute, width: 14 }}>{i + 1}</Text>
                    <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>{s.name}</Text>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.line }} />
                  </View>
                ))}
                {orderedSteps.length === 0 && (
                  <Text style={{ fontFamily: fonts.bodyItalic, fontSize: 13, color: colors.mute }}>{t("onboarding.addAnytime")}</Text>
                )}
              </View>
            </View>

            <Text style={{ marginTop: 16, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.mute }}>
              {t("onboarding.tryFromScan")}
            </Text>

            <View style={{ marginTop: "auto", paddingTop: 20 }}>
              <Continue
                label={saving ? t("onboarding.saving") : t("onboarding.goToRoutine")}
                onPress={finish}
                disabled={saving}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
