// V3 My products: every step in the routine, grouped by when it's used, with whether its label has
// been checked (matched by name against saved checks). Tap one to edit it; add more at the bottom.

import { useCallback, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { stepKind, type GuestScan } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { getScans, listSteps, type EditableStep } from "@/lib/data"
import { BACK_ARROW } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
import { PrimaryButton, SectionLabel, StatusScrim } from "@/components/check/parts"

const KIND_KEY = {
  cleanse: "kindCleanse",
  exfoliate: "kindExfoliate",
  serum: "kindSerum",
  treat: "kindTreat",
  moisturise: "kindMoisturise",
  seal: "kindSeal",
  sunscreen: "kindSunscreen",
} as const
const FREQ_KEY = { daily: "daily", alternate: "alternate", twice_weekly: "twice" } as const

export function ProductsScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const [data, setData] = useState<{ steps: EditableStep[] } | null>(null)
  const [scans, setScans] = useState<GuestScan[]>([])

  // Re-read on focus: the step sheet edits on top of this screen.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      Promise.all([listSteps(), getScans()]).then(([steps, s]) => {
        if (cancelled) return
        setData({ steps })
        setScans(s)
      })
      return () => {
        cancelled = true
      }
    }, []),
  )

  function status(name: string): { text: string; color: string | null } {
    const scan = scans.find((s) => s.title.trim().toLowerCase() === name.trim().toLowerCase())
    if (!scan) return { text: t("prod.notChecked"), color: null }
    if (scan.verdict === "GREEN") return { text: t("prod.checkedFine"), color: T.tFine }
    if (scan.verdict === "YELLOW") return { text: t("prod.checkedCaution"), color: T.tCaution }
    if (scan.verdict === "RED") return { text: t("prod.checkedAvoid"), color: T.tAvoid }
    return { text: t("prod.checkedNone"), color: T.ink3 }
  }

  const groups = data
    ? ([
        ["morning", t("step.morning"), data.steps.filter((s) => s.when === "morning")],
        ["night", t("step.night"), data.steps.filter((s) => s.when === "night")],
        ["both", t("prod.bothTimes"), data.steps.filter((s) => s.when === "both")],
      ] as const).filter(([, , items]) => items.length > 0)
    : []

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: 24 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("check.back")} style={{ width: 44, height: 44, justifyContent: "center", marginLeft: -4 }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.semibold, fontSize: 36, letterSpacing: -1.2, color: T.ink }}>
          {t("prod.title")}
        </Text>

        {data && groups.length === 0 && <Text style={{ marginTop: 16, fontFamily: rubik.regular, fontSize: 17, color: T.ink2 }}>{t("prod.empty")}</Text>}

        {groups.map(([key, label, items]) => (
          <View key={key} style={{ marginTop: 26 }}>
            <SectionLabel>{label}</SectionLabel>
            <View style={{ marginTop: 6 }}>
              {items.map((s) => {
                const kind = s.kind ?? stepKind(s.name)
                const st = status(s.name)
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => router.push({ pathname: "/add-step", params: { id: s.id } })}
                    accessibilityRole="button"
                    accessibilityHint={t("routine.editStep")}
                    style={{ minHeight: 64, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: T.line }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: rubik.medium, fontSize: 17, color: T.ink }}>{s.name}</Text>
                      <Text style={{ marginTop: 2, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>
                        {kind ? `${t(`routine.${KIND_KEY[kind]}`)} · ` : ""}
                        {t(`step.${FREQ_KEY[s.frequency]}`)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0, maxWidth: "45%" }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          ...(st.color ? { backgroundColor: st.color } : { borderWidth: 1.5, borderColor: T.ink3 }),
                        }}
                      />
                      <Text numberOfLines={2} style={{ fontFamily: rubik.regular, fontSize: 13, color: T.ink2, flexShrink: 1 }}>
                        {st.text}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <PrimaryButton label={t("prod.add")} onPress={() => router.push("/add-step")} />
      </View>
      <StatusScrim />
    </View>
  )
}
