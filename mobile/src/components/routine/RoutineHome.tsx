// Port of frontend/components/ouma/app/OumaRoutineClient.tsx. Guest-only for now — mobile has no
// session/login flow yet (see src/lib/guest-store.ts), so this always reads/writes the on-device
// guest routine instead of branching on useIsGuest() like the web version does.

import { useCallback, useEffect, useRef, useState } from "react"
import { View, Text, Pressable, Animated, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { Link, router, useFocusEffect } from "expo-router"
import { fonts } from "@/constants/fonts"
import { FORWARD_ARROW } from "@/lib/i18n"
import { useAppChrome } from "@/lib/app-chrome-context"
import { getGuestRoutine, getGuestStreak, toggleGuestStep, type GuestRoutineView } from "@/lib/guest-store"
import { StreakLeafIcon, WarnTriangleIcon, CameraIcon, CheckIcon } from "./icons"
import { SoftPressable } from "@/components/shared/SoftPressable"

// Mirrors OumaRoutineClient's LIGHT/DARK theme consts exactly — there's no shared token for these
// on the web side either (routine screen defines its own palette inline).
const LIGHT = {
  bg: "#F3F5EF",
  ink: "#17211A",
  mute: "#5A6259",
  accent: "#1E4D3A",
  card: "#FFFFFF",
  line: "rgba(23,33,26,.07)",
  track: "#E4EBE2",
  warnBg: "#F7EDD8",
  warnFg: "#7C5410",
  doneTint: "rgba(29,92,59,.08)",
  doneText: "#1D5C3B",
  enrichBorder: "rgba(23,33,26,.2)",
  checkBorder: "rgba(23,33,26,.25)",
  iconTile: "#E4EBE2",
}

const DARK = {
  bg: "#0E1411",
  ink: "#E7ECE7",
  mute: "#9FB0A4",
  accent: "#5C9977",
  card: "#202B23",
  line: "rgba(231,236,231,.09)",
  track: "#17201A",
  warnBg: "#33301E",
  warnFg: "#E3C27E",
  doneTint: "rgba(92,153,119,.12)",
  doneText: "#5C9977",
  enrichBorder: "rgba(231,236,231,.25)",
  checkBorder: "rgba(231,236,231,.3)",
  iconTile: "#2A362C",
}

// Stored/matched by this literal English name (see OnboardingWizard's QUICK_STEPS comment for why —
// same STEP_ORDER coupling); labelKey is only for the button/chip's display text.
const QUICK_STEPS = [
  { name: "Cleanser", labelKey: "cleanser" },
  { name: "Toner", labelKey: "toner" },
  { name: "Serum", labelKey: "serum" },
  { name: "Moisturiser", labelKey: "moisturiser" },
  { name: "SPF", labelKey: "spf" },
] as const

function StepCheckbox({ done, T }: { done: boolean; T: typeof LIGHT }) {
  const scale = useRef(new Animated.Value(done ? 1 : 1)).current
  useEffect(() => {
    if (!done) return
    scale.setValue(0.6)
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 200 }).start()
  }, [done, scale])

  return (
    <Animated.View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: done ? T.accent : "transparent",
        borderWidth: 1.5,
        borderColor: done ? T.accent : T.checkBorder,
        transform: [{ scale: done ? scale : 1 }],
      }}
    >
      {done && <CheckIcon />}
    </Animated.View>
  )
}

export function RoutineHome() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [ampm, setAmpm] = useState<"morning" | "night">("night")
  const [data, setData] = useState<GuestRoutineView | null>(null)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState<number | null>(null)
  const { setNight } = useAppChrome()

  const night = ampm === "night"
  const T = night ? DARK : LIGHT

  // AM ↔ PM swaps this screen's entire palette instantly (T.bg/ink/card/... all flip in one frame)
  // — of everything on this screen, that full-theme snap was the harshest transition to fix, more
  // than any single button. A real per-token color cross-fade would mean interpolating ~14 separate
  // tokens across every element below; fading the content out and back in around the swap gets the
  // same soft "the theme eased in" feeling for a fraction of the risk of touching every color.
  const contentFade = useRef(new Animated.Value(1)).current
  useEffect(() => {
    contentFade.setValue(0.3)
    Animated.timing(contentFade, { toValue: 1, duration: 220, useNativeDriver: true }).start()
  }, [ampm, contentFade])

  const load = useCallback(async (type: "morning" | "night") => {
    setLoading(true)
    const res = await getGuestRoutine(type)
    setData(res)
    setLoading(false)
    const s = await getGuestStreak()
    setStreak(s.currentStreak)
  }, [])

  // This tab screen stays mounted when Add Step/Products get pushed on top of it (see
  // app/add-step.tsx, app/products.tsx), so a plain useEffect only ever fires once and never sees a
  // step added elsewhere. useFocusEffect re-runs on every return to this tab, and — unlike
  // useEffect — its cleanup fires on blur too, so night-mode chrome doesn't stay stuck dark after
  // leaving the PM tab for another screen.
  useFocusEffect(
    useCallback(() => {
      setNight(night)
      load(ampm)
      return () => setNight(false)
    }, [night, ampm, load, setNight]),
  )

  async function toggle(stepId: string) {
    await toggleGuestStep(stepId)
    load(ampm)
  }

  async function markAllDone() {
    if (!data) return
    const targets = data.steps.filter((s) => !data.allDone && !s.done)
    for (const s of targets) await toggleGuestStep(s.id)
    load(ampm)
  }

  // Guest routines never carry conflicts (see getGuestRoutine's GuestRoutineView type — conflicts
  // is always []). This stays an empty map until mobile has a session and swaps this screen's data
  // source for the real backend RoutineResponse, which does populate conflicts.
  const conflictsByStep = new Map<string, { ingredientAName: string; ingredientBName: string; timingNote: string | null }[]>()

  const dayLabel = ampm === "night" ? t("routine.tonight") : t("routine.thisMorning")
  const routineTitle = ampm === "night" ? t("routine.pmRoutine") : t("routine.amRoutine")
  const missing = data ? QUICK_STEPS.filter((q) => !data.steps.some((s) => s.name === q.name)) : []

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 24 }}
      >
        <Animated.View style={{ opacity: contentFade }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: T.mute }}>{dayLabel}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, textTransform: "uppercase", lineHeight: 30, color: T.ink }}>
              {routineTitle}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/history")}
            accessibilityRole="button"
            accessibilityLabel={t("routine.streakLabel", { count: streak ?? 0 })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.line,
              borderRadius: 999,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            <StreakLeafIcon size={12} color={T.accent} />
            <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 13, color: T.accent }}>{streak ?? "–"}</Text>
          </Pressable>
        </View>

        {!loading && data && data.steps.length > 0 && (
          <View style={{ marginTop: 14, gap: 8 }}>
            {data.steps.map((step, i) => {
              const stepConflicts = conflictsByStep.get(step.id) ?? []
              return (
                <View key={step.id} style={{ backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.line, padding: 14 }}>
                  <Pressable
                    onPress={() => toggle(step.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: step.done }}
                    accessibilityLabel={`${step.name}${step.brand ? `, ${step.brand}` : ""}`}
                    accessibilityHint={step.done ? t("routine.hintDone") : t("routine.hintNotDone")}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: T.mute, width: 12 }}>{i + 1}</Text>
                    <View style={{ width: 40, height: 40, borderRadius: 9, backgroundColor: T.iconTile }} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontFamily: fonts.bodySemiBold,
                          fontSize: 15,
                          color: step.done ? T.mute : T.ink,
                          textDecorationLine: step.done ? "line-through" : "none",
                        }}
                      >
                        {step.name}
                      </Text>
                      {step.brand && <Text style={{ fontFamily: fonts.body, fontSize: 12, color: T.mute }}>{step.brand}</Text>}
                    </View>
                    <StepCheckbox done={step.done} T={T} />
                  </Pressable>

                  {stepConflicts.map((c, ci) => (
                    <View key={ci} style={{ marginTop: 10, flexDirection: "row", gap: 8, backgroundColor: T.warnBg, borderRadius: 9, padding: 11 }}>
                      <WarnTriangleIcon color={T.warnFg} />
                      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: T.warnFg, lineHeight: 17 }}>
                        {t("routine.conflictNote", {
                          a: c.ingredientAName,
                          b: c.ingredientBName,
                          when: ampm === "night" ? t("routine.night") : t("routine.morning"),
                          timing: c.timingNote ? ` — ${c.timingNote}` : "",
                        })}{" "}
                        <Text style={{ fontWeight: "600", textDecorationLine: "underline" }}>{t("routine.splitAcrossNights")}</Text>
                      </Text>
                    </View>
                  ))}

                  {step.enrich && (
                    <Link href="/scan" asChild>
                      <Pressable
                        style={{
                          marginTop: 10,
                          alignSelf: "flex-start",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          borderWidth: 1,
                          borderStyle: "dashed",
                          borderColor: T.enrichBorder,
                          borderRadius: 999,
                          paddingVertical: 5,
                          paddingHorizontal: 11,
                        }}
                      >
                        <CameraIcon color={T.mute} />
                        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: T.mute }}>{t("routine.scanToCheck")}</Text>
                      </Pressable>
                    </Link>
                  )}
                </View>
              )
            })}

            <SoftPressable
              onPress={markAllDone}
              disabled={data.allDone}
              style={{
                marginTop: 6,
                borderWidth: 1.5,
                borderColor: T.accent,
                backgroundColor: data.allDone ? T.doneTint : "transparent",
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: data.allDone ? T.doneText : T.accent }}>
                {data.allDone ? t("routine.allDone") : t("routine.markAllDone")}
              </Text>
            </SoftPressable>
            {data.allDone && (
              <Text style={{ textAlign: "center", fontFamily: fonts.bodyMedium, fontSize: 13, color: T.doneText }}>
                {ampm === "night" ? t("routine.doneTonight") : t("routine.doneToday")}
              </Text>
            )}

            {missing.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: T.mute }}>{t("routine.alsoUse")}</Text>
                <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {missing.map((q) => (
                    <Link key={q.name} href={{ pathname: "/add-step", params: { type: ampm, name: q.name } }} asChild>
                      <Pressable style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: T.enrichBorder, backgroundColor: T.card }}>
                        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: T.ink }}>+ {t(`common.quickSteps.${q.labelKey}`)}</Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {!loading && data && data.steps.length === 0 && (
          <View style={{ marginTop: 40, alignItems: "center", paddingHorizontal: 12 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, textTransform: "uppercase", color: T.ink, textAlign: "center" }}>
              {ampm === "night" ? t("routine.addWhatYouUseNight") : t("routine.addWhatYouUseMorning")}
            </Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 14, color: T.mute, textAlign: "center" }}>
              {t("routine.justType")}
            </Text>
            <View style={{ marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {QUICK_STEPS.map((q) => (
                <Link key={q.name} href={{ pathname: "/add-step", params: { type: ampm, name: q.name } }} asChild>
                  <Pressable style={{ paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1, borderColor: T.enrichBorder, backgroundColor: T.card }}>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: T.ink }}>{t(`common.quickSteps.${q.labelKey}`)}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        )}

        <View style={{ marginTop: 16, flexDirection: "row", backgroundColor: T.track, borderRadius: 12, padding: 4 }}>
          <SoftPressable
            onPress={() => setAmpm("morning")}
            accessibilityRole="tab"
            accessibilityState={{ selected: ampm === "morning" }}
            accessibilityLabel="Morning routine"
            scaleTo={0.98}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 9,
              borderRadius: 9,
              backgroundColor: ampm === "morning" ? (night ? T.card : "#fff") : "transparent",
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.3, color: ampm === "morning" ? T.ink : T.mute }}>
              {t("routine.amTab")}
            </Text>
          </SoftPressable>
          <SoftPressable
            onPress={() => setAmpm("night")}
            accessibilityRole="tab"
            accessibilityState={{ selected: ampm === "night" }}
            accessibilityLabel="Night routine"
            scaleTo={0.98}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 9,
              borderRadius: 9,
              backgroundColor: ampm === "night" ? (night ? T.card : "#fff") : "transparent",
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.3, color: ampm === "night" ? T.ink : T.mute }}>
              {t("routine.pmTab")}
            </Text>
          </SoftPressable>
        </View>

        <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between" }}>
          <Pressable onPress={() => router.push("/products")}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: T.accent }}>
              {t("routine.myProducts")} {FORWARD_ARROW}
            </Text>
          </Pressable>
          <Link href={{ pathname: "/add-step", params: { type: ampm } }} asChild>
            <Pressable>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: T.accent }}>+ {t("routine.addStep")}</Text>
            </Pressable>
          </Link>
        </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}
