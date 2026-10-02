// Port of frontend/components/ouma/OumaScanConfirmClient.tsx.

import { useState } from "react"
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { BACK_ARROW } from "@/lib/i18n"
import { SoftPressable } from "@/components/shared/SoftPressable"

export function ScanConfirmScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ inci?: string }>()
  const [chips, setChips] = useState<string[]>(() =>
    (params.inci ?? "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  const [addValue, setAddValue] = useState("")

  function removeChip(i: number) {
    setChips((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addChip() {
    const v = addValue.trim()
    if (!v) return
    setChips((prev) => [...prev, v])
    setAddValue("")
  }

  function analyse() {
    router.replace({ pathname: "/scan-result", params: { inci: chips.join(", ") } })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bone }}
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: insets.top + 12, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("common.backScan")}</Text>
        </Pressable>
        <Text style={{ marginTop: 12, fontFamily: fonts.display, fontSize: 26, textTransform: "uppercase", color: colors.ink }}>
          {t("scanConfirm.title")}
        </Text>
        <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("scanConfirm.subtitle")}</Text>
        <Text style={{ marginTop: 8, fontFamily: fonts.mono, fontSize: 12, color: colors.ink }}>
          {t("scanConfirm.ingredientsFound", { count: chips.length })}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {chips.map((c, i) => (
            <View
              key={`${c}-${i}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 11,
                borderRadius: 8,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.ink }}>{c}</Text>
              <Pressable
                onPress={() => removeChip(i)}
                accessibilityRole="button"
                accessibilityLabel={t("scanConfirm.removeLabel", { name: c })}
                hitSlop={10}
              >
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.mute }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <TextInput
            value={addValue}
            onChangeText={setAddValue}
            onSubmitEditing={addChip}
            returnKeyType="done"
            placeholder={t("scanConfirm.addMissing")}
            placeholderTextColor={colors.mute}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "rgba(23,33,26,.3)",
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              fontFamily: fonts.body,
              fontSize: 12.5,
              color: colors.ink,
            }}
          />
          <Pressable
            onPress={addChip}
            style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, justifyContent: "center" }}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.ink }}>{t("scanConfirm.add")}</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: "auto", paddingTop: 18, flexDirection: "row", gap: 10 }}>
          <SoftPressable
            onPress={() => router.back()}
            style={{ flex: 1, borderWidth: 1.5, borderColor: "rgba(23,33,26,.2)", borderRadius: 12, paddingVertical: 15, alignItems: "center" }}
          >
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#2A342C" }}>{t("scanConfirm.retake")}</Text>
          </SoftPressable>
          <SoftPressable
            onPress={analyse}
            disabled={chips.length === 0}
            style={{ flex: 1.6, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center", opacity: chips.length === 0 ? 0.5 : 1 }}
          >
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#fff" }}>{t("scanConfirm.analyse")}</Text>
          </SoftPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
