// V3 "Check what we read": the list as we split it, before anything is judged. Remove what we got
// wrong, add what we missed, then continue to the reading.

import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import { rubik } from "@/constants/fonts"
import { BACK_ARROW } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
import { labelDirection, splitLabel } from "@skinlens/shared"
import { PrimaryButton, StatusScrim } from "@/components/check/parts"

export function ScanConfirmScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const params = useLocalSearchParams<{ inci?: string; name?: string }>()
  const [chips, setChips] = useState(() => splitLabel(params.inci ?? ""))
  const [draft, setDraft] = useState("")

  function add() {
    const more = splitLabel(draft)
    if (!more.length) return
    setChips((c) => [...c, ...more])
    setDraft("")
  }

  function check() {
    router.replace({ pathname: "/scan-result", params: { inci: chips.join(", "), name: params.name ?? "" } })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("check.back")} style={{ width: 44, height: 44, justifyContent: "center", marginLeft: -4 }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
        </Pressable>

        <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.light, fontSize: 40, lineHeight: 46, letterSpacing: -1.6, color: T.ink }}>
          {t("check.confirmT")}
        </Text>
        <Text style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 17, lineHeight: 24, color: T.ink }}>
          {t("check.weRead", { count: chips.length })} <Text style={{ color: T.ink2 }}>{t("check.notJudged")}</Text>
        </Text>
        <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>{t("check.tapToRemove")}</Text>

        <View style={{ marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 8, direction: labelDirection(chips) }}>
          {chips.map((c, i) => (
            <Pressable
              key={`${c}-${i}`}
              onPress={() => setChips((list) => list.filter((_, j) => j !== i))}
              accessibilityRole="button"
              accessibilityLabel={t("check.remove", { name: c })}
              style={{
                minHeight: 40,
                paddingLeft: 14,
                paddingRight: 10,
                borderRadius: 20,
                backgroundColor: T.surface,
                borderWidth: 1,
                borderColor: T.line,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                maxWidth: "100%",
              }}
            >
              <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink, flexShrink: 1 }}>{c}</Text>
              <Text style={{ fontFamily: rubik.regular, fontSize: 16, color: T.ink3 }}>×</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 18, flexDirection: "row", gap: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            placeholder={t("check.addMissing")}
            placeholderTextColor={T.ink3}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            style={{ flex: 1, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: T.line, fontFamily: rubik.regular, fontSize: 16, color: T.ink, textAlign: "auto" }}
          />
          <Pressable
            onPress={add}
            disabled={!draft.trim()}
            style={{ minHeight: 48, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.5, borderColor: T.ink, justifyContent: "center", opacity: draft.trim() ? 1 : 0.35 }}
          >
            <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.ink }}>{t("check.add")}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <StatusScrim />
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <PrimaryButton label={t("check.checkThese")} onPress={check} disabled={chips.length === 0} />
      </View>
    </KeyboardAvoidingView>
  )
}
