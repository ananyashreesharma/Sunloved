// Routine home, V3 design: huge light "Tonight", the moon (sunrise in the morning) filling as steps
// are done, numbered steps that get a highlighter when ticked, the retinoid + acid clash note, and a
// quiet "Done for tonight." Guest-only for now — mobile has no session yet (see guest-store.ts).

import { useCallback, useEffect, useMemo, useState } from "react"
import { View, Text, Pressable, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import * as Haptics from "expo-haptics"
import Animated, {
  FadeIn,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { findRoutineClash, MILESTONES, motion, newMilestone, palettes, REMINDER_CHECK_NIGHTS, todayKey, type GuestData, type GuestRoutineStepView, type GuestRoutineView, type StreakDayStatus } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { FORWARD_ARROW, localDigits } from "@/lib/i18n"
import { useAppChrome } from "@/lib/app-chrome-context"
import { ease, useReduceMotion, useTheme } from "@/lib/theme"
import { loadGuestData, updateGuestData } from "@/lib/guest-store"
import { getRoutine, getStreak, getStreakHistory, setStepFrequency, toggleStep } from "@/lib/data"
import { useAccount } from "@/lib/account"
import { track } from "@/lib/analytics"
import { syncReminders } from "@/lib/notifications"
import { MilestoneOverlay } from "./Milestone"
import { Highlight } from "@/components/shared/Highlight"
import { Moon, Sunrise } from "./Moon"

type Period = "morning" | "night"

const QUICK_STEPS = [
  { name: "Cleanser", labelKey: "cleanser" },
  { name: "Toner", labelKey: "toner" },
  { name: "Serum", labelKey: "serum" },
  { name: "Moisturiser", labelKey: "moisturiser" },
  { name: "SPF", labelKey: "spf" },
] as const

const KIND_KEY = {
  cleanse: "kindCleanse",
  exfoliate: "kindExfoliate",
  serum: "kindSerum",
  treat: "kindTreat",
  moisturise: "kindMoisturise",
  seal: "kindSeal",
  sunscreen: "kindSunscreen",
} as const

const FREQ_KEY = { daily: "freqDaily", alternate: "freqAlternate", twice_weekly: "freqTwice" } as const

function shiftDay(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function RoutineHome() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const { setNight } = useAppChrome()
  const { T } = useTheme()
  const reduce = useReduceMotion()
  // Opens on whichever routine is next, unless the caller asked for one ("Start tonight's routine").
  const params = useLocalSearchParams<{ period?: string }>()
  const [period, setPeriod] = useState<Period>(() =>
    params.period === "night" || params.period === "morning" ? params.period : new Date().getHours() < 15 ? "morning" : "night",
  )
  const [data, setData] = useState<GuestRoutineView | null>(null)
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)
  const [guest, setGuest] = useState<GuestData | null>(null)
  const [week, setWeek] = useState<StreakDayStatus[]>([])
  const [clashDismissed, setClashDismissed] = useState(false)
  const [milestone, setMilestone] = useState<number | null>(null)
  const { signedIn } = useAccount()

  const night = period === "night"

  // Whole palette cross-fades between day and night (600 ms); content dips briefly so text colours
  // don't visibly snap.
  const nightV = useSharedValue(night ? 1 : 0)
  const contentO = useSharedValue(1)
  useEffect(() => {
    nightV.value = reduce ? (night ? 1 : 0) : withTiming(night ? 1 : 0, { duration: motion.ms.themeSwitch, easing: ease.standard })
    if (!reduce) contentO.value = withSequence(withTiming(0, { duration: 150 }), withDelay(200, withTiming(1, { duration: 250 })))
  }, [night, reduce, nightV, contentO])
  const bgStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(nightV.value, [0, 1], [palettes.day.bg, palettes.night.bg]) }))
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentO.value }))

  const load = useCallback(async (p: Period) => {
    const routine = await getRoutine(p)
    setData(routine)
    const s = await getStreak()
    setStreak(s.currentStreak)
    setTotal(s.totalDaysCompleted)
    setGuest(await loadGuestData())
    // Last seven days for the tally next to the streak.
    const today = todayKey()
    const months = Array.from(new Set([shiftDay(today, -6).slice(0, 7), today.slice(0, 7)]))
    const days = (await Promise.all(months.map((m) => getStreakHistory(m)))).flatMap((h) => h.days)
    const byDate = new Map(days.map((d) => [d.date, d.status]))
    const last7 = Array.from({ length: 7 }, (_, i) => byDate.get(shiftDay(today, i - 6)) ?? "paused")
    // Days before the first completed day aren't "paused" — the user hadn't started yet.
    const first = last7.findIndex((st) => st === "both" || st === "one")
    setWeek(last7.map((st, i) => (first === -1 || i < first ? "future" : st)))
  }, [])

  useFocusEffect(
    useCallback(() => {
      setNight(night)
      load(period)
      return () => setNight(false)
    }, [night, period, load, setNight]),
  )

  async function toggle(step: GuestRoutineStepView) {
    if (step.rest) return
    if (!step.done) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    await toggleStep(step.id, period)
    load(period)
    if (!step.done) {
      track("routine_step_ticked", period)
      // This tick finishes the routine: every other step due today was already done.
      if (due.every((s) => s.id === step.id || s.done)) track("routine_completed", period)
      celebrateIfMilestone()
    }
  }

  // A tick that completes the day can reach 7, 30 or 100: celebrate once, after the done animation.
  // Smaller milestones are marked seen too, so a week never pops up after a month.
  async function celebrateIfMilestone() {
    const [s, g] = await Promise.all([getStreak(), loadGuestData()])
    const m = newMilestone(s.currentStreak, g.milestonesSeen)
    if (!m) return
    await updateGuestData({ milestonesSeen: Array.from(new Set([...g.milestonesSeen, ...MILESTONES.filter((x) => x <= m)])) })
    setTimeout(() => setMilestone(m), reduce ? 400 : 1600)
  }

  // "Keep the reminders?" once, after REMINDER_CHECK_NIGHTS nights done: reminders help most while a
  // routine is new, and some people stop needing them.
  const remindersOn = !!guest && !guest.muted && guest.reminderTone !== "off" && (guest.remindMorning || guest.remindNight)
  const askReminders = remindersOn && !guest?.reminderCheckDone && total >= REMINDER_CHECK_NIGHTS

  async function answerReminders(keep: boolean) {
    const next = await updateGuestData(keep ? { reminderCheckDone: true } : { reminderCheckDone: true, remindMorning: false, remindNight: false })
    setGuest(next)
    if (!keep) syncReminders(next).catch(() => {})
  }

  const clash = useMemo(() => (data ? findRoutineClash(data.steps) : null), [data])

  async function alternateClash() {
    if (!clash) return
    await setStepFrequency(clash.alternateStepId, "alternate")
    load(period)
  }

  const due = data?.steps.filter((s) => !s.rest) ?? []
  const doneN = due.filter((s) => s.done).length
  const complete = due.length > 0 && doneN === due.length
  const progress = due.length ? doneN / due.length : 0
  const countText = t("routine.ofDone", { a: localDigits(String(doneN), i18n.language), b: localDigits(String(due.length), i18n.language) })
  // After a missed night: welcome back, never "you broke your streak". People who see a broken
  // streak tend to quit; a streak that can still be saved, and a kind word, bring them back.
  const didOn = (st: StreakDayStatus | undefined) => st === "both" || st === "one"
  const welcome =
    total > 0 && doneN === 0 && week.length === 7 && !didOn(week.at(6)) && !didOn(week.at(5))
      ? streak > 0
        ? night
          ? t("routine.welcomePausedNight")
          : t("routine.welcomePausedMorning")
        : t("routine.welcomeBack")
      : null
  // The streak readout never shows 0: after a break it shows every night done so far.
  const streakText = streak > 0 ? t("routine.nights", { count: streak }) : total > 0 ? t("routine.totalNights", { count: total }) : t("history.title")
  const dateLabel = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long" }).format(new Date())

  return (
    <Animated.View style={[{ flex: 1 }, bgStyle]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 6, paddingBottom: 28 }}>
        <Animated.View style={contentStyle}>
          {/* Period switch + streak */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 20 }}>
              {(["morning", "night"] as const).map((p) => {
                const on = period === p
                return (
                  <Pressable
                    key={p}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    onPress={() => setPeriod(p)}
                    style={{ minHeight: 44, justifyContent: "center", borderBottomWidth: 2, borderBottomColor: on ? T.ink : "transparent" }}
                  >
                    <Text style={{ fontFamily: on ? rubik.semibold : rubik.regular, fontSize: 16, color: on ? T.ink : T.ink3 }}>
                      {p === "morning" ? t("routine.tabMorning") : t("routine.tabNight")}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Pressable
              onPress={() => router.push("/history")}
              accessibilityRole="button"
              accessibilityLabel={`${localDigits(streakText, i18n.language)}. ${t("history.title")}`}
              style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View style={{ flexDirection: "row", gap: 3, alignItems: "center", direction: "ltr" }}>
                {week.map((st, i) => {
                  const today = i === 6
                  const filled = st === "both" || st === "one"
                  return (
                    <View
                      key={i}
                      style={{
                        width: 3,
                        height: 13,
                        borderRadius: 1,
                        ...(filled
                          ? { backgroundColor: T.ink }
                          : today || st === "future"
                            ? { backgroundColor: T.line }
                            : { borderWidth: 1, borderStyle: "dashed", borderColor: T.ink2 }),
                      }}
                    />
                  )
                })}
              </View>
              <Text style={{ fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>
                {localDigits(streakText, i18n.language)} {FORWARD_ARROW}
              </Text>
            </Pressable>
          </View>

          {/* Hero */}
          <View style={{ marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>{dateLabel}</Text>
              <View style={{ marginTop: 4, alignSelf: "stretch" }}>
                <Highlight
                  on={complete}
                  color={T.done}
                  thickness={0.38}
                  position={0.88}
                  duration={motion.ms.doneTitle}
                  delay={200}
                  fit
                  style={{ fontFamily: rubik.light, fontSize: 64, lineHeight: 68, letterSpacing: -3, color: T.ink }}
                >
                  {night ? t("routine.heroNight") : t("routine.heroMorning")}
                </Highlight>
              </View>
              {due.length > 0 && (
                <Text accessibilityLiveRegion="polite" style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 17, color: T.ink2 }}>
                  {countText}
                </Text>
              )}
            </View>
            {night ? <Moon progress={progress} label={countText} /> : <Sunrise progress={progress} label={countText} />}
          </View>

          {welcome && (
            <Text style={{ marginTop: 18, fontFamily: rubik.regular, fontSize: 17, lineHeight: 24, color: T.ink }}>{welcome}</Text>
          )}

          {/* Clash note: stays still, never bounces */}
          {clash && !clashDismissed && (
            <Animated.View
              entering={reduce ? FadeIn.duration(motion.ms.reducedFade) : FadeIn.duration(400)}
              style={{ marginTop: 24, paddingTop: 16, paddingBottom: 4, borderTopWidth: 1, borderColor: T.line }}
            >
              <Text style={{ fontFamily: rubik.regular, fontSize: 19, lineHeight: 27, color: T.ink }}>
                <Text style={{ backgroundColor: T.hiCaution }}>{t("routine.clashAnd", { a: clash.a, b: clash.b })}</Text>
                {night ? t("routine.clashNight") : t("routine.clashMorning")}
              </Text>
              <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 15, lineHeight: 21, color: T.ink2 }}>{t("routine.clashBody")}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Pressable
                  onPress={alternateClash}
                  style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: T.btn, justifyContent: "center" }}
                >
                  <Text style={{ fontFamily: rubik.semibold, fontSize: 15, color: T.btnInk }}>{t("routine.alternate")}</Text>
                </Pressable>
                <Pressable onPress={() => setClashDismissed(true)} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: "center" }}>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink }}>{t("routine.notNow")}</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Steps */}
          {data && data.steps.length > 0 && (
            <View style={{ marginTop: 20 }}>
              {data.steps.map((s) => {
                const numIndex = due.indexOf(s)
                return <StepRow key={s.id} step={s} num={s.rest ? "—" : localDigits(String(numIndex + 1).padStart(2, "0"), i18n.language)} night={night} onPress={() => toggle(s)} onEdit={() => router.push({ pathname: "/add-step", params: { id: s.id } })} />
              })}
              <Pressable
                onPress={() => router.push({ pathname: "/add-step", params: { type: period } })}
                style={{ minHeight: 56, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: T.line }}
              >
                <Text style={{ width: 72, fontFamily: rubik.light, fontSize: 24, color: T.ink2 }}>+</Text>
                <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("routine.addStep")}</Text>
              </Pressable>
            </View>
          )}

          {/* Empty routine (not in the design: same language, quick-add steps) */}
          {data && data.steps.length === 0 && (
            <View style={{ marginTop: 28, borderTopWidth: 1, borderTopColor: T.line, paddingTop: 20 }}>
              <Text style={{ fontFamily: rubik.medium, fontSize: 22, letterSpacing: -0.3, color: T.ink }}>
                {night ? t("routine.emptyNight") : t("routine.emptyMorning")}
              </Text>
              <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("routine.emptySub")}</Text>
              <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {QUICK_STEPS.map((q) => (
                  <Pressable
                    key={q.name}
                    onPress={() => router.push({ pathname: "/add-step", params: { type: period, name: q.name } })}
                    style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: T.line, justifyContent: "center" }}
                  >
                    <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink }}>+ {t(`common.quickSteps.${q.labelKey}`)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {complete && (
            <Animated.View entering={reduce ? FadeIn.duration(motion.ms.reducedFade) : FadeInDown.duration(400).delay(500)} style={{ marginTop: 24 }}>
              <Text style={{ fontFamily: rubik.medium, fontSize: 28, letterSpacing: -0.5, color: T.ink }}>
                {night ? t("routine.doneNightTitle") : t("routine.doneMorningTitle")}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 16, color: T.ink2 }}>
                {night ? t("routine.doneNightSub") : t("routine.doneMorningSub")}
              </Text>
              {askReminders && (
                <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: T.line }}>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 19, lineHeight: 26, color: T.ink }}>
                    {localDigits(t("routine.keepRemindersQ", { count: total }), i18n.language)}
                  </Text>
                  <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 15, lineHeight: 21, color: T.ink2 }}>{t("routine.keepRemindersSub")}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <Pressable onPress={() => answerReminders(true)} accessibilityRole="button" style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: T.btn, justifyContent: "center" }}>
                      <Text style={{ fontFamily: rubik.semibold, fontSize: 15, color: T.btnInk }}>{t("routine.keepThem")}</Text>
                    </Pressable>
                    <Pressable onPress={() => answerReminders(false)} accessibilityRole="button" style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: "center" }}>
                      <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink }}>{t("routine.turnOff")}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
      {/* Paper behind the status bar, so scrolled content does not run under the clock */}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top }, bgStyle]} />
      <MilestoneOverlay
        milestone={milestone}
        onClose={() => setMilestone(null)}
        onSave={
          signedIn
            ? undefined
            : () => {
                setMilestone(null)
                router.push({ pathname: "/login", params: { reason: "streak" } })
              }
        }
      />
    </Animated.View>
  )
}

function StepRow({ step, num, night, onPress, onEdit }: { step: GuestRoutineStepView; num: string; night: boolean; onPress: () => void; onEdit: () => void }) {
  const { t } = useTranslation()
  const { T } = useTheme()
  const reduce = useReduceMotion()
  const dip = useSharedValue(1)

  useEffect(() => {
    if (step.done && !reduce) dip.value = withSequence(withTiming(0.9, { duration: 115 }), withTiming(1, { duration: 145 }))
  }, [step.done, reduce, dip])
  const numStyle = useAnimatedStyle(() => ({ transform: [{ scale: dip.value }] }))

  const kind = step.kind
  const sub = step.rest
    ? `${night ? t("routine.restNight") : t("routine.restDay")} · ${t(`routine.${FREQ_KEY[step.frequency]}`)}`
    : `${kind ? `${t(`routine.${KIND_KEY[kind]}`)} · ` : ""}${t(`routine.${FREQ_KEY[step.frequency]}`)}`

  return (
    <Pressable
      // Tap ticks the step (rest days can't be ticked); long-press edits it, rest days included.
      onPress={onPress}
      onLongPress={onEdit}
      accessibilityActions={[{ name: "edit", label: t("routine.editStep") }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === "edit" && onEdit()}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: step.done, disabled: step.rest }}
      accessibilityLabel={`${step.name}${step.brand ? `, ${step.brand}` : ""}. ${sub}`}
      accessibilityHint={step.rest ? undefined : step.done ? t("routine.hintDone") : t("routine.hintNotDone")}
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        gap: 16,
        minHeight: step.rest ? 60 : 80,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: T.line,
        opacity: step.rest ? 0.6 : 1,
      }}
    >
      <Animated.Text
        style={[
          { width: 56, fontFamily: rubik.light, fontSize: step.rest ? 24 : 40, letterSpacing: -1, color: step.done ? T.ink : T.ink3 },
          numStyle,
        ]}
        numberOfLines={1}
      >
        {num}
      </Animated.Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Highlight on={step.done} color={T.done} style={{ fontFamily: rubik.medium, fontSize: step.rest ? 17 : 22, lineHeight: step.rest ? 22 : 28, letterSpacing: -0.2, color: step.rest ? T.ink2 : T.ink }}>
          {step.name}
        </Highlight>
        <Text style={{ marginTop: 5, fontFamily: rubik.regular, fontSize: 12, letterSpacing: 0.7, textTransform: "uppercase", color: T.ink2 }}>{sub}</Text>
      </View>
    </Pressable>
  )
}
