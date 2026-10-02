// Port of frontend/components/ouma/OumaScanClient.tsx. The web version's "Photo" tab isn't real
// camera+OCR either — it's a decorative viewfinder mockup, and tapping the shutter just switches to
// the Paste tab (see its onClick: setTab("paste")). The actual analysis path is entirely
// type-or-paste-the-ingredients → Confirm → Result, which is what this ports faithfully. A real
// camera capture (expo-camera) would be a genuine upgrade over the web version, not parity — noted
// as a follow-up, not required to match what the web app itself does today.

import { useCallback, useState } from "react"
import { View, Text, Pressable, TextInput, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { getGuestScans, type GuestScan } from "@/lib/guest-store"
import { riskFromScore } from "@/lib/ingredient-scoring"
import { SoftPressable } from "@/components/shared/SoftPressable"

const DEMO_INCI =
  "Aqua, Glycerin, Niacinamide, Dimethicone, Phenoxyethanol, Fragrance (Parfum), Carbomer, Sodium Hyaluronate, Methylparaben, Tocopherol, Retinol, Limonene, Linalool, Citric Acid"

type Tab = "photo" | "paste"

const VERDICT_PILL_KEY = {
  "HIGH RISK": { bg: colors.zone.red.soft, fg: colors.zone.red.fg, labelKey: "legendAvoid" },
  CAUTION: { bg: colors.zone.yellow.soft, fg: colors.zone.yellow.fg, labelKey: "legendCaution" },
  SAFE: { bg: colors.zone.green.soft, fg: colors.zone.green.fg, labelKey: "legendFine" },
} as const

export function ScanCaptureScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>("photo")
  const [inci, setInci] = useState("")
  const [recents, setRecents] = useState<GuestScan[]>([])

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      getGuestScans().then((scans) => {
        if (!cancelled) setRecents(scans)
      })
      return () => {
        cancelled = true
      }
    }, []),
  )

  function relativeDate(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (days <= 0) return t("scan.relativeToday")
    if (days === 1) return t("scan.relativeDaysAgo", { days: 1 })
    return t("scan.relativeDaysAgo", { days })
  }

  const parsedChips = inci
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)

  function analyse() {
    if (!inci.trim()) return
    router.push({ pathname: "/scan-confirm", params: { inci } })
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bone }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: colors.ink, textTransform: "uppercase" }}>
        {t("scan.title")}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 15, color: "#2A342C" }}>{t("scan.subtitle")}</Text>

      <View style={{ marginTop: 18, flexDirection: "row", backgroundColor: "#E4EBE2", borderRadius: 12, padding: 4 }}>
        {(["photo", "paste"] as Tab[]).map((tabKey) => (
          <SoftPressable
            key={tabKey}
            onPress={() => setTab(tabKey)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === tabKey }}
            scaleTo={0.98}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 9,
              backgroundColor: tab === tabKey ? "#fff" : "transparent",
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.3, color: tab === tabKey ? colors.ink : colors.mute }}>
              {tabKey === "photo" ? t("scan.photoTab") : t("scan.pasteTab")}
            </Text>
          </SoftPressable>
        ))}
      </View>

      {tab === "photo" ? (
        <>
          <View style={{ marginTop: 12, backgroundColor: "#141A16", borderRadius: 16, height: 280, alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", top: 32, left: 26, right: 26, bottom: 74, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255,255,255,.35)", borderRadius: 10 }} />
            <Text style={{ position: "absolute", top: "38%", paddingHorizontal: 32, textAlign: "center", fontFamily: fonts.bodySemiBold, fontSize: 14, color: "rgba(255,255,255,.9)" }}>
              {t("scan.cameraComingSoon")}
            </Text>
            <Text style={{ position: "absolute", top: "48%", paddingHorizontal: 40, textAlign: "center", fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,.6)" }}>
              {t("scan.tapBelowToType")}
            </Text>
            <Pressable
              onPress={() => setTab("paste")}
              accessibilityLabel={t("scan.tapBelowToType")}
              accessibilityHint={t("scan.cameraComingSoon")}
              style={{
                position: "absolute",
                bottom: 12,
                width: 58,
                height: 58,
                borderRadius: 29,
                borderWidth: 3,
                borderColor: "rgba(255,255,255,.5)",
                backgroundColor: "rgba(255,255,255,.12)",
              }}
            />
          </View>
          <Text style={{ marginTop: 8, textAlign: "center", fontFamily: fonts.body, fontSize: 12, color: colors.mute }}>
            {t("scan.noCameraNeeded")}
          </Text>
        </>
      ) : (
        <View style={{ marginTop: 16 }}>
          <TextInput
            value={inci}
            onChangeText={setInci}
            placeholder={t("scan.placeholder")}
            placeholderTextColor={colors.mute}
            multiline
            numberOfLines={6}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 16,
              padding: 16,
              minHeight: 150,
              fontFamily: fonts.body,
              fontSize: 16,
              lineHeight: 22,
              color: colors.ink,
              textAlignVertical: "top",
            }}
          />

          {!inci && (
            <Pressable onPress={() => setInci(DEMO_INCI)} style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.mute, textDecorationLine: "underline" }}>
                {t("scan.useSample")}
              </Text>
            </Pressable>
          )}

          {parsedChips.length > 0 && (
            <>
              <Text style={{ marginTop: 14, fontFamily: fonts.mono, fontSize: 12, color: colors.mute }}>
                {t("scan.weRead", { count: parsedChips.length })}
              </Text>
              <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {parsedChips.map((c, i) => (
                  <Text
                    key={i}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 11,
                      borderRadius: 8,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.line,
                      fontFamily: fonts.body,
                      fontSize: 12.5,
                      color: colors.ink,
                    }}
                  >
                    {c}
                  </Text>
                ))}
              </View>
            </>
          )}

          <SoftPressable
            onPress={analyse}
            disabled={!inci.trim()}
            style={{
              marginTop: 14,
              paddingVertical: 16,
              borderRadius: 999,
              backgroundColor: colors.ink,
              alignItems: "center",
              opacity: inci.trim() ? 1 : 0.4,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.bone }}>
              {t("scan.analyse", { count: parsedChips.length })}
            </Text>
          </SoftPressable>
        </View>
      )}

      {recents.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: colors.mute }}>
            {t("scan.recentScans")}
          </Text>
          <View style={{ marginTop: 9, gap: 8 }}>
            {recents.map((r) => {
              const risk = riskFromScore(r.score)
              const pill = VERDICT_PILL_KEY[risk]
              return (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    if (!r.rawIngredientText) return
                    router.push({ pathname: "/scan-result", params: { inci: r.rawIngredientText } })
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.line,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink }} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: pill.bg, color: pill.fg }}>
                    {t(`scanResult.${pill.labelKey}`)}
                  </Text>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.mute }}>{relativeDate(r.savedAt)}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}
    </ScrollView>
  )
}
