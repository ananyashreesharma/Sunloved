// Port of frontend/components/ouma/OumaScanResultClient.tsx, guest/inci-only branch (mobile has no
// product catalog to browse, so the productId path from the web version is dropped — every scan
// here comes from typed/pasted ingredient text). skinLabel personalization is dropped too: the web
// version only fetches it for signed-in users (`if (!isApp || isGuest) return`), so it's always null
// for guests anyway — not a deviation, just the guest path with the always-false branch removed.

import { useEffect, useState } from "react"
import { View, Text, Pressable, ScrollView, ActivityIndicator, Animated } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { BACK_ARROW } from "@/lib/i18n"
import { analyzeIngredients, reportUnknownIngredient } from "@/lib/api-client"
import { saveGuestScan } from "@/lib/guest-store"
import { breakdownFromAnalyze, rowsFromAnalyze, riskFromScore, type IngredientBreakdown, type IngredientRow, type Zone } from "@/lib/ingredient-scoring"
import { TickIcon, WarningIcon } from "@/components/onboarding/icons"
import { SoftPressable } from "@/components/shared/SoftPressable"

const COVERAGE_THRESHOLD = 0.7

const STRIP_HEX: Record<Zone | "NONE", string> = { RED: colors.zone.red.fg, YELLOW: colors.zone.yellow.fg, GREEN: colors.zone.green.fg, NONE: colors.zone.none }

export function ScanResultScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ inci?: string }>()
  const inci = (params.inci ?? "").trim()

  const VERDICTS: Record<Zone, { hex: string; soft: string; caps: string }> = {
    RED: { hex: colors.zone.red.fg, soft: colors.zone.red.soft, caps: t("scanResult.verdictAvoidCaps") },
    YELLOW: { hex: colors.zone.yellow.fg, soft: colors.zone.yellow.soft, caps: t("scanResult.verdictCautionCaps") },
    GREEN: { hex: colors.zone.green.fg, soft: colors.zone.green.soft, caps: t("scanResult.verdictFineCaps") },
  }

  function buildInShort(leadName: string | undefined, flagged: IngredientRow[], verdictKey: Zone): string {
    const lead = leadName ? t("scanResult.leadWithName", { name: leadName.toLowerCase() }) : t("scanResult.leadGeneric")
    if (flagged.length === 0) return t("scanResult.inShortNoFlags", { lead })
    const top = flagged[0]
    const advice = verdictKey === "RED" ? t("scanResult.adviceAvoid") : t("scanResult.adviceTry")
    return t("scanResult.inShortFlagged", { lead, name: top.name, note: top.note, advice })
  }

  const [phase, setPhase] = useState<"analyzing" | "reveal">("analyzing")
  const [err, setErr] = useState<string | null>(null)
  const [bd, setBd] = useState<IngredientBreakdown>({ high: 0, med: 0, safe: 0, score: 0, warnings: [] })
  const [rows, setRows] = useState<IngredientRow[]>([])
  const [coverage, setCoverage] = useState(1)
  const [readCount, setReadCount] = useState(0)
  const [parsedCount, setParsedCount] = useState(0)
  const [unknownNames, setUnknownNames] = useState<string[]>([])
  const [reported, setReported] = useState<Set<string>>(new Set())
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const [attempt, setAttempt] = useState(0)
  const spin = useState(() => new Animated.Value(0))[0]

  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1400, useNativeDriver: true })).start()
  }, [spin])

  useEffect(() => {
    if (!inci) {
      setTimeout(() => setPhase("reveal"), 1100)
      return
    }
    let cancelled = false
    setPhase("analyzing")
    setErr(null)
    ;(async () => {
      try {
        const api = await analyzeIngredients(inci)
        if (cancelled) return
        const b = breakdownFromAnalyze(api)
        setBd(b)
        setCoverage(api.coverage)
        setReadCount(api.foundIngredients.length)
        setParsedCount(api.parsed.length)
        setUnknownNames(api.unknownIngredients)
        setRows(rowsFromAnalyze(api))
        setTimeout(() => setPhase("reveal"), 600)
      } catch (e) {
        // phase still needs to leave "analyzing" here, same as the success path — the render's
        // `if (err)` branch (checked right after the analyzing-spinner branch) is what keeps this
        // from falling through to the verdict card: bd's default {score: 0, ...} scores as HIGH
        // RISK (see riskFromScore), so reaching the verdict card here would show a fabricated
        // "AVOID FOR YOU" verdict on a plain network failure — worse than no verdict at all.
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Analysis failed.")
          setTimeout(() => setPhase("reveal"), 300)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [inci, attempt])

  function retry() {
    setAttempt((a) => a + 1)
  }

  const riskKey = riskFromScore(bd.score)
  const verdictKey: Zone = riskKey === "HIGH RISK" ? "RED" : riskKey === "CAUTION" ? "YELLOW" : "GREEN"
  const verdict = VERDICTS[verdictKey]

  if (phase === "analyzing") {
    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] })
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", padding: 40 }}>
        <Animated.View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 3,
            borderColor: "rgba(243,245,239,0.2)",
            borderTopColor: colors.bone,
            transform: [{ rotate }],
          }}
        />
        <Text style={{ marginTop: 30, fontFamily: fonts.display, fontSize: 24, fontStyle: "italic", color: colors.bone, textAlign: "center" }}>
          {t("scanResult.analyzing")}
        </Text>
      </View>
    )
  }

  // ── Analysis failed (offline, server error, timeout) ──
  // Renders instead of the verdict card, not alongside it — a zeroed breakdown scores HIGH RISK,
  // so falling through to "reveal" here would show a scary, fabricated "AVOID FOR YOU" verdict for
  // what's actually just a failed network call.
  if (err) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bone }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, flexGrow: 1 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("common.backScan")}</Text>
          </Pressable>
          <Text style={{ marginTop: 12, fontFamily: fonts.display, fontSize: 26, lineHeight: 29, textTransform: "uppercase", color: colors.ink }}>
            {t("scanResult.couldntAnalyse")}
          </Text>
          <View style={{ marginTop: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 18 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: "#2A342C" }}>{t("scanResult.couldntAnalyseBody")}</Text>
            <Text style={{ marginTop: 10, fontFamily: fonts.mono, fontSize: 11.5, color: colors.mute }}>{err}</Text>
          </View>
          <View style={{ marginTop: "auto", paddingTop: 18, flexDirection: "row", gap: 10 }}>
            <SoftPressable
              onPress={() => router.back()}
              style={{ flex: 1, borderWidth: 1.5, borderColor: "rgba(23,33,26,.2)", borderRadius: 12, paddingVertical: 15, alignItems: "center" }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#2A342C" }}>{t("scanResult.back")}</Text>
            </SoftPressable>
            <SoftPressable
              onPress={retry}
              style={{ flex: 1.4, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center" }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#fff" }}>{t("scanResult.tryAgain")}</Text>
            </SoftPressable>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ── Coverage refusal ──
  if (coverage < COVERAGE_THRESHOLD) {
    const totalCount = parsedCount
    const pct = Math.round(coverage * 100)
    const swatchCount = Math.max(totalCount, 10)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bone }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, flexGrow: 1 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("common.backScan")}</Text>
          </Pressable>
          <Text style={{ marginTop: 12, fontFamily: fonts.display, fontSize: 26, lineHeight: 29, textTransform: "uppercase", color: colors.ink }}>
            {t("scanResult.cantJudgeYet")}
          </Text>

          <View style={{ marginTop: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 18 }}>
            <View style={{ flexDirection: "row", gap: 2, height: 26, borderRadius: 6, overflow: "hidden" }}>
              {Array.from({ length: swatchCount }).map((_, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: i < readCount ? colors.mute : "#E4EBE2" }} />
              ))}
            </View>
            <Text style={{ marginTop: 10, fontFamily: fonts.mono, fontSize: 13, color: colors.ink }}>
              {t("scanResult.readPct", { read: readCount, total: totalCount || "?", pct })}
            </Text>
            <Text style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: "#2A342C" }}>
              {t("scanResult.coverageBody", { read: readCount, total: totalCount || t("scanResult.unknownCount") })}
            </Text>
          </View>

          <Text style={{ marginTop: 12, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.mute }}>
            {t("scanResult.coverageFootnote", { pct: Math.round(COVERAGE_THRESHOLD * 100) })}
          </Text>

          <View style={{ marginTop: "auto", paddingTop: 18, flexDirection: "row", gap: 10 }}>
            <SoftPressable
              onPress={() => router.back()}
              style={{ flex: 1, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(23,33,26,.3)", borderRadius: 12, paddingVertical: 15, alignItems: "center" }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#2A342C" }}>{t("scanResult.retakePhoto")}</Text>
            </SoftPressable>
            <SoftPressable
              onPress={() => router.replace({ pathname: "/scan-confirm", params: { inci } })}
              style={{ flex: 1.4, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center" }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: "#fff" }}>{t("scanResult.typeInstead")}</Text>
            </SoftPressable>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ── Reveal ──
  const totalIngredients = parsedCount || rows.length
  const readIngredients = readCount || rows.length
  const flaggedRows = rows.filter((r) => r.zone !== "GREEN" && !unknownNames.includes(r.name))
  const fineRows = rows.filter((r) => r.zone === "GREEN" && !unknownNames.includes(r.name))
  const inShortText = buildInShort(rows[0]?.name, flaggedRows, verdictKey)

  async function saveScan() {
    setSaveState("saving")
    await saveGuestScan({
      title: t("scanResult.ingredientAnalysis"),
      brand: t("scanResult.fromIngredientList"),
      flagCount: bd.high + bd.med,
      coverage,
      score: bd.score,
      rawIngredientText: inci,
    })
    setSaveState("saved")
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bone }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("common.backScan")}</Text>
          </Pressable>
        </View>

        <Text style={{ marginTop: 12, fontFamily: fonts.mono, fontSize: 13, color: colors.mute }}>{t("scanResult.fromIngredientList")}</Text>
        <Text style={{ marginTop: 2, fontFamily: fonts.display, fontSize: 26, lineHeight: 29, textTransform: "uppercase", color: colors.ink }}>
          {t("scanResult.ingredientAnalysis")}
        </Text>

        {/* Verdict card */}
        <View style={{ marginTop: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 18 }}>
          <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: verdict.soft }}>
            {verdictKey === "GREEN" ? <TickIcon size={13} color={verdict.hex} /> : <WarningIcon size={13} color={verdict.hex} />}
            <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 12, letterSpacing: 0.7, color: verdict.hex }}>{verdict.caps}</Text>
          </View>

          <View style={{ marginTop: 16, flexDirection: "row", gap: 2, height: 26, borderRadius: 6, overflow: "hidden" }}>
            {(rows.length > 0 ? rows : Array.from({ length: Math.max(totalIngredients, 1) })).map((r, i) => (
              <View
                key={i}
                style={{ flex: 1, backgroundColor: r ? STRIP_HEX[unknownNames.includes((r as IngredientRow).name) ? "NONE" : (r as IngredientRow).zone] : "#E4EBE2" }}
              />
            ))}
          </View>
          <View style={{ marginTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.mute }}>{t("scanResult.labelOrder")}</Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 11.5, color: colors.ink }}>
              {t("scanResult.readOfTotal", { read: readIngredients, total: totalIngredients })}
            </Text>
          </View>
          <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              { label: t("scanResult.legendFine"), c: STRIP_HEX.GREEN },
              { label: t("scanResult.legendCaution"), c: STRIP_HEX.YELLOW },
              { label: t("scanResult.legendAvoid"), c: STRIP_HEX.RED },
              { label: t("scanResult.legendNoInfo"), c: STRIP_HEX.NONE },
            ].map((l) => (
              <View key={l.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: l.c }} />
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.mute }}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* In short */}
        <View style={{ marginTop: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 18 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: colors.mute }}>
            {t("scanResult.inShort")}
          </Text>
          <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: "#2A342C" }}>{inShortText}</Text>
        </View>

        {/* Flagged for you */}
        {flaggedRows.length > 0 && (
          <>
            <Text style={{ marginTop: 16, fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: colors.mute }}>
              {t("scanResult.flaggedForYou")}
            </Text>
            <View style={{ marginTop: 8, gap: 8 }}>
              {flaggedRows.map((r) => {
                const pos = rows.indexOf(r) + 1
                const pillBg = r.zone === "RED" ? colors.zone.red.soft : colors.zone.yellow.soft
                const pillFg = r.zone === "RED" ? colors.zone.red.fg : colors.zone.yellow.fg
                return (
                  <View key={r.name} style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.ink }}>{r.name}</Text>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.mute }}>#{pos}</Text>
                      <Text style={{ marginLeft: "auto", fontFamily: fonts.bodySemiBold, fontSize: 11, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: pillBg, color: pillFg }}>
                        {r.zone === "RED" ? t("scanResult.legendAvoid") : t("scanResult.legendCaution")}
                      </Text>
                    </View>
                    <Text style={{ marginTop: 5, fontFamily: fonts.body, fontSize: 13, color: "#2A342C" }}>{r.note}</Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Everything else */}
        {fineRows.length > 0 && (
          <>
            <Text style={{ marginTop: 16, fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: colors.mute }}>
              {t("scanResult.everythingElse")}
            </Text>
            <View style={{ marginTop: 8, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line }}>
              {fineRows.map((r, i) => {
                const pos = rows.indexOf(r) + 1
                return (
                  <View
                    key={r.name}
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: 8,
                      padding: 14,
                      borderBottomWidth: i < fineRows.length - 1 ? 1 : 0,
                      borderBottomColor: colors.line,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink }}>{r.name}</Text>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.mute }}>#{pos}</Text>
                    <Text style={{ marginLeft: "auto", fontFamily: fonts.body, fontSize: 12, color: colors.mute, textAlign: "right" }}>{r.note}</Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* No info */}
        {unknownNames.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: colors.mute }}>
              {t("scanResult.noInfo", { count: unknownNames.length })}
            </Text>
            <View style={{ marginTop: 8, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line }}>
              {unknownNames.map((name, i) => (
                <View
                  key={name}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    padding: 14,
                    borderBottomWidth: i < unknownNames.length - 1 ? 1 : 0,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.mute }}>{name}</Text>
                  <Pressable
                    disabled={reported.has(name)}
                    onPress={() => {
                      reportUnknownIngredient(name, "Ingredient analysis").catch(() => {})
                      setReported((prev) => new Set(prev).add(name))
                    }}
                    style={{ marginLeft: "auto" }}
                  >
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: reported.has(name) ? colors.mute : colors.accent }}>
                      {reported.has(name) ? t("scanResult.reported") : t("scanResult.report")}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12, color: colors.mute }}>{t("scanResult.notInDatabase")}</Text>
          </View>
        )}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          backgroundColor: "rgba(243,245,239,.97)",
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <SoftPressable
          onPress={saveScan}
          disabled={saveState !== "idle"}
          style={{ borderWidth: 1.5, borderColor: colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center" }}
        >
          {saveState === "saving" ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent }}>
              {saveState === "saved" ? t("scanResult.saved") : t("scanResult.saveScan")}
            </Text>
          )}
        </SoftPressable>
      </View>
    </View>
  )
}
