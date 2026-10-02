// Port of frontend/components/ouma/app/OumaAddStepClient.tsx. Guest-only for now (see
// OnboardingWizard/RoutineHome) — the "from my products" section is dropped since it only ever
// populates from the backend's getMyProducts(), which mobile has no session to call yet.

import { useState } from "react"
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { BACK_ARROW } from "@/lib/i18n"
import { addGuestStep, loadGuestData } from "@/lib/guest-store"
import { SoftPressable } from "@/components/shared/SoftPressable"

type When = "morning" | "night" | "both"
type Frequency = "daily" | "alternate" | "twice_weekly"

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        marginTop: 20,
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

export function AddStepScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ type?: string; name?: string }>()
  const initialType = params.type === "morning" || params.type === "night" ? params.type : "night"

  const [customName, setCustomName] = useState(params.name ?? "")
  const [when, setWhen] = useState<When>(initialType)
  const [frequency, setFrequency] = useState<Frequency>("daily")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const WHEN_OPTIONS: { v: When; label: string }[] = [
    { v: "morning", label: t("addStep.am") },
    { v: "night", label: t("addStep.pm") },
    { v: "both", label: t("addStep.both") },
  ]

  function frequencyOptions(w: When): { v: Frequency; label: string; flex: number }[] {
    return [
      { v: "daily", label: t("addStep.daily"), flex: 1 },
      // "Alternate nights" only makes sense once there's a night step involved — an AM-only step
      // gets the time-neutral phrasing instead.
      { v: "alternate", label: w === "morning" ? t("addStep.alternateDays") : t("addStep.alternateNights"), flex: 1.3 },
      { v: "twice_weekly", label: t("addStep.twiceWeek"), flex: 1 },
    ]
  }

  async function submit() {
    const trimmed = customName.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    // addGuestStep silently no-ops on a duplicate name (same as the web version) — check first so
    // the user gets told instead of watching the screen navigate away as if it worked.
    const before = await loadGuestData()
    if (before.steps.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSaving(false)
      setError(t("addStep.alreadyInRoutine", { name: trimmed }))
      return
    }
    await addGuestStep({ name: trimmed, when, frequency })
    // A real pushed screen now (see app/add-step.tsx) — pop back to Routine rather than replace it;
    // Routine's own useFocusEffect picks up the new step on refocus.
    router.back()
  }

  const routineLabel = when === "both" ? t("addStep.routineLabelBoth") : when === "night" ? t("addStep.pm") : t("addStep.am")

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bone }}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("common.backRoutine")}</Text>
      </Pressable>
      <Text style={{ marginTop: 12, fontFamily: fonts.display, fontSize: 26, textTransform: "uppercase", color: colors.ink }}>
        {t("addStep.title")}
      </Text>

      <FieldLabel>{t("addStep.orTypeNew")}</FieldLabel>
      <TextInput
        value={customName}
        onChangeText={(text) => {
          setCustomName(text)
          if (error) setError(null)
        }}
        placeholder={t("addStep.placeholder")}
        placeholderTextColor={colors.mute}
        style={{
          marginTop: 10,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          paddingVertical: 13,
          paddingHorizontal: 16,
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.ink,
        }}
      />

      <FieldLabel>{t("addStep.whenLabel")}</FieldLabel>
      <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>
        {WHEN_OPTIONS.map((w) => (
          <SoftPressable
            key={w.v}
            onPress={() => setWhen(w.v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: when === w.v }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 11,
              borderRadius: 10,
              borderWidth: when === w.v ? 1.5 : 1,
              borderColor: when === w.v ? colors.accent : colors.line,
              backgroundColor: colors.card,
            }}
          >
            <Text
              style={{
                fontFamily: when === w.v ? fonts.bodySemiBold : fonts.body,
                fontSize: 14,
                color: when === w.v ? colors.accent : colors.ink,
              }}
            >
              {w.label}
            </Text>
          </SoftPressable>
        ))}
      </View>

      <FieldLabel>{t("addStep.howOften")}</FieldLabel>
      <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>
        {frequencyOptions(when).map((f) => (
          <SoftPressable
            key={f.v}
            onPress={() => setFrequency(f.v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: frequency === f.v }}
            style={{
              flex: f.flex,
              alignItems: "center",
              paddingVertical: 11,
              borderRadius: 10,
              borderWidth: frequency === f.v ? 1.5 : 1,
              borderColor: frequency === f.v ? colors.accent : colors.line,
              backgroundColor: colors.card,
            }}
          >
            <Text
              style={{
                fontFamily: frequency === f.v ? fonts.bodySemiBold : fonts.body,
                fontSize: 13.5,
                color: frequency === f.v ? colors.accent : colors.ink,
              }}
            >
              {f.label}
            </Text>
          </SoftPressable>
        ))}
      </View>

      <View style={{ marginTop: 16, backgroundColor: "rgba(30,77,58,.07)", borderRadius: 12, padding: 15 }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: "#16382B" }}>
          {t("addStep.placementHint")}
          {frequency === "alternate" && (when === "morning" ? t("addStep.alternateHintDay") : t("addStep.alternateHintNight"))}
        </Text>
      </View>

      {error && (
        <Text style={{ marginTop: 12, fontFamily: fonts.body, fontSize: 13, color: "#8A2E22" }}>{error}</Text>
      )}

      <SoftPressable
        onPress={submit}
        disabled={saving || !customName.trim()}
        style={{
          marginTop: 22,
          backgroundColor: colors.accent,
          borderRadius: 12,
          paddingVertical: 15,
          alignItems: "center",
          // 0.4 (not e.g. 0.7) for "nothing typed yet" so it reads as off, not just dim — a first-
          // time tapper shouldn't wonder whether the button is broken. "saving" is a separate,
          // lighter dim since that state means "working," not "unavailable."
          opacity: !customName.trim() ? 0.4 : saving ? 0.7 : 1,
        }}
      >
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#fff" }}>
          {saving ? t("addStep.adding") : t("addStep.addToRoutine", { label: routineLabel })}
        </Text>
      </SoftPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
