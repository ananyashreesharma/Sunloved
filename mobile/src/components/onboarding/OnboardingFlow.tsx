// V3 onboarding: welcome (a lens drifting over a label, bringing words into focus), then country,
// skin as a sentence, tonight's products (sorted into order as you tap), reminders, and "You're set".
// Everything stays on the device; nothing to sign up for.

import { useEffect, useMemo, useState } from "react"
import { Dimensions, I18nManager, Pressable, ScrollView, Switch, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated"
import { CONCERNS, countryByCode, guessCountry, MAX_CONCERNS, NIGHT_ANCHORS, SKIN_TYPES, type NightAnchor, type StepKind } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { loadGuestData, updateGuestData } from "@/lib/guest-store"
import { addStep, saveProfile } from "@/lib/data"
import { reminderText, syncReminders } from "@/lib/notifications"
import { BACK_ARROW, localDigits } from "@/lib/i18n"
import { formatTimeForDisplay } from "@/lib/time-format"
import { useReduceMotion, useTheme } from "@/lib/theme"
import { PrimaryButton } from "@/components/check/parts"
import { CountrySheet, useCountryName } from "@/components/shared/CountryPicker"
import { Moon } from "@/components/routine/Moon"

/** Countries shown up front; everything else is one tap away in the searchable sheet. */
const SHORT_LIST = ["IN", "US", "GB", "AE", "SA", "MX", "ES", "NG", "ID"]

/** Tonight's products, in the order they go on (thinnest first, oil last). */
const PRODUCTS: { key: string; kind: StepKind }[] = [
  { key: "pCleanser", kind: "cleanse" },
  { key: "pToner", kind: "exfoliate" },
  { key: "pNiacinamide", kind: "serum" },
  { key: "pRetinol", kind: "treat" },
  { key: "pMoisturiser", kind: "moisturise" },
  { key: "pOil", kind: "seal" },
]

const KIND_KEY: Record<StepKind, string> = {
  cleanse: "kindCleanse",
  exfoliate: "kindExfoliate",
  serum: "kindSerum",
  treat: "kindTreat",
  moisturise: "kindMoisturise",
  seal: "kindSeal",
  sunscreen: "kindSunscreen",
}

type Tone = "coach" | "plain"

export function OnboardingFlow() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const reduce = useReduceMotion()
  const nameOf = useCountryName()

  // From Me: "/onboarding?edit=skin" or "?edit=country" opens just that step, with Save.
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const editing = edit === "skin" || edit === "country"
  const [step, setStep] = useState(edit === "country" ? 1 : edit === "skin" ? 2 : 0)
  const [country, setCountry] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [skinType, setSkinType] = useState<string | null>(null)
  const [concerns, setConcerns] = useState<string[]>([])
  const [products, setProducts] = useState<string[]>([])
  const [remindMorning, setRemindMorning] = useState(true)
  const [remindNight, setRemindNight] = useState(true)
  const [tone, setTone] = useState<Tone>("coach")
  const [anchor, setAnchor] = useState<NightAnchor | null>(null)
  const [times, setTimes] = useState({ morning: "07:30", night: "21:30" })

  // Start from whatever this device already knows (a returning guest, or one who went back).
  useEffect(() => {
    loadGuestData().then((g) => {
      setCountry(g.country ?? guessCountry(i18n.language))
      if (g.skinType) setSkinType(g.skinType)
      if (g.concerns.length) setConcerns(g.concerns.slice(0, MAX_CONCERNS))
      setTimes({ morning: g.morningTime, night: g.nightTime })
      // A reminder for an empty routine is just noise: morning starts off until there are morning steps.
      setRemindMorning(g.remindMorning && g.steps.some((st) => st.when !== "night"))
      setRemindNight(g.remindNight)
      if (g.reminderTone === "plain") setTone("plain")
      setAnchor(g.nightAnchor)
    })
  }, [i18n.language])

  const countries = useMemo(() => {
    const codes = [...SHORT_LIST]
    if (country && !codes.includes(country)) codes.unshift(country)
    return codes
  }, [country])

  const sorted = PRODUCTS.filter((p) => products.includes(p.key))

  function toggleConcern(code: string) {
    setConcerns((c) => (c.includes(code) ? c.filter((x) => x !== code) : c.length >= MAX_CONCERNS ? c : [...c, code]))
  }

  async function finish() {
    const data = await updateGuestData({
      country,
      skinType,
      concerns,
      remindMorning,
      remindNight,
      reminderTone: tone,
      nightAnchor: anchor,
    })
    const existing = new Set(data.steps.map((s) => s.name.toLowerCase()))
    for (const p of sorted) {
      const name = t(`ob.${p.key}`)
      if (!existing.has(name.toLowerCase())) await addStep({ name, when: "night", frequency: "daily", kind: p.kind })
    }
    const latest = await loadGuestData()
    // They just chose reminders, so this is the moment to ask for permission (iOS asks only once).
    if (remindMorning || remindNight) syncReminders(latest, { interactive: true }).catch(() => {})
    else syncReminders(latest).catch(() => {})
    setStep(5)
  }

  async function saveEdit() {
    // Saved on the phone, and to the account when signed in.
    await saveProfile(edit === "country" ? { country } : { skinType, concerns })
    router.back()
  }

  function next() {
    if (editing) saveEdit()
    else if (step === 4) finish()
    else setStep((s) => s + 1)
  }

  const enter = (delay = 0) => (reduce ? FadeIn.duration(160) : FadeInUp.duration(420).delay(delay))
  const title = { fontFamily: rubik.semibold, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: T.ink }
  const sub = { marginTop: 8, fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink2 }

  // ── Welcome ──
  if (step === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, paddingHorizontal: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: T.ink }} />
          <Text style={{ fontFamily: rubik.semibold, fontSize: 15, color: T.ink }}>{t("ob.brand")}</Text>
        </View>
        <Animated.View entering={reduce ? FadeIn.duration(160) : FadeIn.duration(600)} style={{ marginTop: 22 }}>
          <LensCard />
        </Animated.View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <Animated.Text entering={enter(250)} accessibilityRole="header" style={{ fontFamily: rubik.semibold, fontSize: 46, lineHeight: 48, letterSpacing: -1.8, color: T.ink }}>
          {t("ob.welcomeTitle")}
        </Animated.Text>
        <Animated.Text entering={enter(350)} style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink2 }}>
          {t("ob.welcomeSub")}
        </Animated.Text>
        <View style={{ marginTop: 20 }}>
          <PrimaryButton label={t("ob.getStarted")} onPress={() => setStep(1)} />
        </View>
        <Text style={{ marginTop: 12, textAlign: "center", fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t("ob.noAccount")}</Text>
        <Pressable onPress={() => router.push({ pathname: "/login", params: { from: "welcome" } })} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.ink, textDecorationLine: "underline" }}>{t("ob.haveAccount")}</Text>
        </Pressable>
      </View>
    )
  }

  // ── You're set ──
  if (step === 5) {
    const reminderOn = remindNight && sorted.length > 0
    const subText = sorted.length
      ? t("ob.allSetSteps", { count: sorted.length }) + (reminderOn ? t("ob.allSetReminder", { time: formatTimeForDisplay(times.night) }) : "")
      : t("ob.allSetEmpty")
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16, paddingHorizontal: 28 }}>
        <Animated.View entering={reduce ? FadeIn.duration(160) : ZoomIn.duration(400).delay(100)} style={{ alignSelf: "flex-start" }}>
          <Moon progress={0.6} label="" />
        </Animated.View>
        <Animated.Text entering={enter(250)} accessibilityRole="header" style={{ marginTop: 24, fontFamily: rubik.semibold, fontSize: 52, lineHeight: 54, letterSpacing: -2, color: T.ink }}>
          {t("ob.allSet")}
        </Animated.Text>
        <Animated.Text entering={enter(350)} style={{ marginTop: 14, fontFamily: rubik.regular, fontSize: 19, lineHeight: 28, color: T.ink }}>
          {subText}
        </Animated.Text>
        <Text style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("ob.noSignup")}</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton label={sorted.length ? t("ob.startTonight") : t("ob.goRoutine")} onPress={() => router.replace({ pathname: "/routine", params: { period: "night" } })} />
        <Pressable onPress={() => router.replace("/scan")} style={{ minHeight: 48, marginTop: 6, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink, textDecorationLine: "underline" }}>{t("ob.checkFirst")}</Text>
        </Pressable>
      </View>
    )
  }

  // ── Steps 1–4 ──
  const canGo = step === 1 ? !!country : step === 2 ? !!skinType : true
  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top + 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 12, paddingRight: 28, paddingBottom: 10 }}>
        <Pressable onPress={() => (editing ? router.back() : setStep((s) => s - 1))} accessibilityRole="button" accessibilityLabel={t("ob.back")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
        </Pressable>
        <View
          accessible
          accessibilityRole="progressbar"
          // Editing one answer from Me isn't a journey, so no progress bar.
          importantForAccessibility={editing ? "no-hide-descendants" : "auto"}
          accessibilityLabel={t("ob.progress", { a: step, b: 4 })}
          style={{ flex: 1, flexDirection: "row", gap: 6 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: editing ? "transparent" : i <= step ? T.ink : T.line }} />
          ))}
        </View>
      </View>

      <Animated.View key={step} entering={reduce ? FadeIn.duration(160) : FadeIn.duration(260)} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <>
              <Text accessibilityRole="header" style={title}>
                {t("ob.whereLive")}
              </Text>
              <Text style={sub}>{t("ob.whereSub")}</Text>
              <View style={{ marginTop: 14 }}>
                {countries.map((code) => {
                  const on = country === code
                  return (
                    <Pressable
                      key={code}
                      onPress={() => setCountry(code)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: T.line }}
                    >
                      <Text style={{ fontFamily: on ? rubik.semibold : rubik.light, fontSize: 19, color: T.ink }}>{nameOf(code, countryByCode(code)?.name ?? code)}</Text>
                      {on && <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>✓</Text>}
                    </Pressable>
                  )
                })}
                <Pressable
                  onPress={() => setMoreOpen(true)}
                  accessibilityRole="button"
                  style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: T.line }}
                >
                  <Text style={{ fontFamily: rubik.light, fontSize: 19, color: T.ink }}>{t("ob.moreCountries")}</Text>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 18, color: T.ink2 }}>{I18nManager.isRTL ? "‹" : "›"}</Text>
                </Pressable>
              </View>
              <CountrySheet visible={moreOpen} onClose={() => setMoreOpen(false)} value={country} onChange={setCountry} title={t("ob.pickCountry")} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={{ fontFamily: rubik.semibold, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: T.ink2 }}>{t("ob.yourSkin")}</Text>
              <SkinSentence skinType={skinType} concerns={concerns} />
              <Text style={{ marginTop: 28, marginBottom: 10, fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("ob.skinType")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {SKIN_TYPES.map((s) => (
                  <Chip key={s.code} on={skinType === s.code} label={t(`onboarding.skinTypes.${s.code}`)} onPress={() => setSkinType(s.code)} radio />
                ))}
              </View>
              <View style={{ marginTop: 28, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <Text style={{ fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("ob.concernsT")}</Text>
                <Text style={{ fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>
                  {localDigits(`${concerns.length} / ${MAX_CONCERNS}`, i18n.language)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CONCERNS.map((c) => (
                  <Chip key={c.code} on={concerns.includes(c.code)} label={t(`onboarding.concerns.${c.code}`)} onPress={() => toggleConcern(c.code)} />
                ))}
              </View>
              {concerns.length >= MAX_CONCERNS && (
                <Animated.Text entering={FadeIn.duration(200)} style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>
                  {t("ob.twoPlenty")}
                </Animated.Text>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Text accessibilityRole="header" style={title}>
                {t("ob.nightQ")}
              </Text>
              <Text style={sub}>{t("ob.nightSub")}</Text>
              <View style={{ marginVertical: 20 }}>
                {sorted.length === 0 ? (
                  <View style={{ minHeight: 60, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: T.line, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("ob.emptyList")}</Text>
                  </View>
                ) : (
                  sorted.map((p, i) => (
                    <Animated.View
                      key={p.key}
                      layout={reduce ? undefined : LinearTransition.duration(340).easing(Easing.bezier(0.2, 0.8, 0.2, 1))}
                      entering={reduce ? FadeIn.duration(160) : FadeIn.duration(220)}
                      exiting={FadeOut.duration(160)}
                      style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: T.line }}
                    >
                      <Text style={{ width: 44, fontFamily: rubik.light, fontSize: 28, letterSpacing: -1, color: T.ink2 }}>
                        {localDigits(String(i + 1).padStart(2, "0"), i18n.language)}
                      </Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontFamily: rubik.medium, fontSize: 17, color: T.ink }}>{t(`ob.${p.key}`)}</Text>
                        <Text style={{ fontFamily: rubik.regular, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase", color: T.ink2 }}>{t(`routine.${KIND_KEY[p.kind]}`)}</Text>
                      </View>
                      <Pressable
                        onPress={() => setProducts((list) => list.filter((k) => k !== p.key))}
                        accessibilityRole="button"
                        accessibilityLabel={t("ob.removeStep", { name: t(`ob.${p.key}`) })}
                        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                      >
                        <Text style={{ fontFamily: rubik.regular, fontSize: 20, color: T.ink2 }}>×</Text>
                      </Pressable>
                    </Animated.View>
                  ))
                )}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PRODUCTS.filter((p) => !products.includes(p.key)).map((p) => (
                  <Chip key={p.key} on={false} label={`+ ${t(`ob.${p.key}`)}`} onPress={() => setProducts((list) => [...list, p.key])} />
                ))}
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Text accessibilityRole="header" style={title}>
                {t("ob.nudgeQ")}
              </Text>
              <Text style={sub}>{t("ob.nudgeSub")}</Text>
              <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: T.line }}>
                {(
                  [
                    ["morningRoutine", times.morning, remindMorning, setRemindMorning],
                    ["nightRoutine", times.night, remindNight, setRemindNight],
                  ] as const
                ).map(([key, time, on, set]) => (
                  <View key={key} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: T.line }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: rubik.regular, fontSize: 17, color: T.ink }}>{t(`ob.${key}`)}</Text>
                      <Text style={{ fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>{formatTimeForDisplay(time)}</Text>
                    </View>
                    <Switch value={on} onValueChange={set} accessibilityLabel={t(`ob.${key}`)} trackColor={{ true: T.ink, false: T.line }} thumbColor={T.surface} ios_backgroundColor={T.line} />
                  </View>
                ))}
              </View>
              {/* An existing habit is a stronger cue than a clock time; the reminder then names it. */}
              <Text style={{ marginTop: 24, fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("ob.anchorQ")}</Text>
              <Text style={{ marginTop: 2, marginBottom: 10, fontFamily: rubik.regular, fontSize: 13, lineHeight: 18, color: T.ink2 }}>{t("ob.anchorSub")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {NIGHT_ANCHORS.map((a) => (
                  <Chip key={a} on={anchor === a} label={t(`ob.anchor.${a}`)} onPress={() => setAnchor(anchor === a ? null : a)} radio />
                ))}
              </View>
              <Text style={{ marginTop: 24, marginBottom: 10, fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("ob.toneQ")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Chip on={tone === "coach"} label={t("ob.gentle")} onPress={() => setTone("coach")} radio />
                <Chip on={tone === "plain"} label={t("ob.facts")} onPress={() => setTone("plain")} radio />
              </View>
              {/* What the reminder will actually say. */}
              <View style={{ marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: T.surface, flexDirection: "row", gap: 12, alignItems: "center", opacity: remindNight ? 1 : 0.45 }}>
                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: T.ink, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: T.bg }} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 12, color: T.ink2 }}>SkinLens · {formatTimeForDisplay(times.night)}</Text>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink }}>
                    {reminderText(tone, "night", sorted.length, anchor)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>

      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <PrimaryButton label={editing ? t("me.save") : t("ob.continue")} onPress={next} disabled={!canGo} />
        {step === 3 && (
          <Pressable onPress={next} style={{ minHeight: 44, marginTop: 4, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("ob.skip")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

// Same weight on and off, so selecting a chip never reflows its neighbours.
function Chip({ on, label, onPress, radio }: { on: boolean; label: string; onPress: () => void; radio?: boolean }) {
  const { T } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={radio ? "radio" : "checkbox"}
      accessibilityState={radio ? { selected: on } : { checked: on }}
      style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: on ? T.ink : T.line, backgroundColor: on ? T.ink : "transparent", justifyContent: "center" }}
    >
      <Text style={{ fontFamily: rubik.regular, fontSize: 16, color: on ? T.bg : T.ink }}>{label}</Text>
    </Pressable>
  )
}

/** "My skin is oily, and I'd like help with acne and dark spots." — the answers, highlighted. */
function SkinSentence({ skinType, concerns }: { skinType: string | null; concerns: string[] }) {
  const { t } = useTranslation()
  const { T } = useTheme()
  const mark = { backgroundColor: T.done, fontFamily: rubik.regular }
  const lower = (s: string) => s.toLocaleLowerCase()
  const cs = concerns.map((c) => lower(t(`onboarding.concerns.${c}`)))
  return (
    // Room for four lines (the longest answer), so the chips below don't jump as the sentence fills in.
    <Text style={{ marginTop: 12, minHeight: 160, fontFamily: rubik.light, fontSize: 28, lineHeight: 40, letterSpacing: -0.4, color: T.ink }}>
      {skinType === "unsure" ? (
        t("ob.sentenceUnsure")
      ) : (
        <>
          {t("ob.sentenceStart")}
          {skinType ? <Text style={mark}>{lower(t(`onboarding.skinTypes.${skinType}`))}</Text> : <Text style={{ color: T.ink3 }}>{t("ob.blank")}</Text>}
        </>
      )}
      {t("ob.sentenceMid")}
      {cs.length === 0 ? (
        <Text style={{ color: T.ink3 }}>{t("ob.sentenceNothing")}</Text>
      ) : (
        cs.map((c, i) => (
          <Text key={c}>
            {i > 0 ? t("ob.sentenceAnd") : ""}
            <Text style={mark}>{c}</Text>
          </Text>
        ))
      )}
      {t("ob.sentenceEnd")}
    </Text>
  )
}

const LENS = 124
const LABEL = ["Aqua", "Glycerin", "Squalane", "Glycolic acid", "Panthenol", "Coconut oil", "Allantoin", "Ceramide NP", "Xanthan gum"]
// Points the lens drifts between (top-left of the lens, in card coordinates).
const STOPS = [
  { x: 30, y: 20 },
  { x: 174, y: 58 },
  { x: 70, y: 124 },
]

/**
 * The welcome image: a label, out of focus, with a lens drifting across it. Inside the lens the
 * words are sharp and marked the way a result marks them. Built as a window: the lens moves one way
 * while the sharp copy inside it moves the opposite way, so the two layers always line up.
 */
function LensCard() {
  const { T } = useTheme()
  const reduce = useReduceMotion()
  const x = useSharedValue(STOPS[0].x)
  const y = useSharedValue(STOPS[0].y)

  useEffect(() => {
    if (reduce) return
    const ease = Easing.bezier(0.45, 0, 0.55, 1)
    const seq = (key: "x" | "y") =>
      withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(STOPS[1][key], { duration: 2333, easing: ease }),
            withTiming(STOPS[2][key], { duration: 2333, easing: ease }),
            withTiming(STOPS[0][key], { duration: 2334, easing: ease }),
          ),
          -1,
        ),
      )
    x.value = seq("x")
    y.value = seq("y")
  }, [reduce, x, y])

  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }))
  const inner = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }, { translateY: -y.value }] }))

  const text = (sharp: boolean) => {
    const hi: Record<string, string> = { Glycerin: T.hiFine, "Glycolic acid": T.hiCaution, "Coconut oil": T.hiNfy }
    return (
      <Text style={{ fontFamily: rubik.light, fontSize: 24, lineHeight: 36, color: sharp ? T.ink : T.ink3, opacity: sharp ? 1 : 0.55 }}>
        {LABEL.map((w, i) => (
          <Text key={w}>
            <Text style={sharp && hi[w] ? { backgroundColor: hi[w] } : undefined}>{w}</Text>
            {i < LABEL.length - 1 ? ", " : ""}
          </Text>
        ))}
      </Text>
    )
  }

  return (
    // The label is Latin script, so the illustration stays left-to-right in every language.
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ height: 250, borderRadius: 24, backgroundColor: T.surface, overflow: "hidden", direction: "ltr" }}>
      <View style={{ position: "absolute", top: 30, left: 26, right: 26 }}>{text(false)}</View>
      <Animated.View
        style={[
          { position: "absolute", left: 0, top: 0, width: LENS, height: LENS, borderRadius: LENS / 2, overflow: "hidden", backgroundColor: T.surface, borderWidth: 2, borderColor: T.ink },
          lens,
        ]}
      >
        {/* Same layout as the blurred copy, offset back by the lens position (and its 2px border). */}
        <Animated.View style={[{ position: "absolute", top: 28, left: 24, width: 0 }, inner]}>
          <View style={{ width: CARD_TEXT_WIDTH }}>{text(true)}</View>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

// The card spans the screen minus its 28px side padding; the text sits 26px inside the card.
// Measured once from the window so the sharp copy wraps exactly like the blurred one.
const CARD_TEXT_WIDTH = Dimensions.get("window").width - 28 * 2 - 26 * 2
