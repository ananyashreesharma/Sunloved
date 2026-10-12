// V3 Streak: the streak as a big number, the pause rule in plain words, a month of dots (done,
// part done, paused, today) and the milestones, each of which replays its celebration.

import { useCallback, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { MILESTONES, todayKey, type StreakSummary } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { getStreak, getStreakHistory } from "@/lib/data"
import type { GuestStreakDay } from "@/lib/guest-store"
import { BACK_ARROW, isRTL, localDigits } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
import { SectionLabel, StatusScrim } from "@/components/check/parts"
import { MilestoneOverlay } from "./Milestone"

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export function StreakHistoryScreen() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const today = todayKey()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [days, setDays] = useState<GuestStreakDay[]>([])
  const [streak, setStreak] = useState<StreakSummary | null>(null)
  const [open, setOpen] = useState<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      getStreak().then((s) => !cancelled && setStreak(s))
      getStreakHistory(month).then((h) => !cancelled && setDays(h.days))
      return () => {
        cancelled = true
      }
    }, [month]),
  )

  const num = (n: number) => localDigits(String(n), i18n.language)
  const [y, m] = month.split("-").map(Number)
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)))
  // Weeks start on Monday; blanks before the 1st.
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  )
  const current = streak?.currentStreak ?? 0
  const longest = streak?.longestStreak ?? 0
  const total = streak?.totalDaysCompleted ?? 0
  const isCurrentMonth = month === today.slice(0, 7)

  function dot(d: GuestStreakDay) {
    const isToday = d.date === today
    // Today keeps a ring around whatever it shows, so it's always findable.
    const ring = isToday ? { borderWidth: 2, borderColor: T.ink, padding: 2, borderRadius: 10 } : null
    if (d.status === "both" || d.status === "one")
      return (
        <View style={ring ?? undefined}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: T.ink, opacity: d.status === "one" ? 0.4 : 1 }} />
        </View>
      )
    if (isToday) return <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: T.ink }} />
    if (d.status === "paused") return <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderStyle: "dashed", borderColor: T.ink2 }} />
    return <View style={{ width: 4, height: 4, borderRadius: 2, margin: 4, backgroundColor: T.line }} />
  }

  function label(d: GuestStreakDay) {
    const date = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d.date}T00:00:00Z`))
    const key = d.status === "both" ? "dayDone" : d.status === "one" ? "dayPart" : d.status === "paused" ? "dayPaused" : "dayFuture"
    return t(`history.${key}`, { date })
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: -12 }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("check.back")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
          </Pressable>
          <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>{t("history.title")}</Text>
        </View>

        {/* Never a big 0: after a break, every night done so far, and the next one starts a new run. */}
        {current > 0 || total === 0 ? (
          <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.light, fontSize: current > 0 ? 68 : 44, lineHeight: current > 0 ? 72 : 50, letterSpacing: current > 0 ? -3.4 : -1.6, color: T.ink }}>
            {current > 0 ? localDigits(t("history.nights", { count: current }), i18n.language) : t("history.firstNight")}
          </Text>
        ) : (
          <>
            <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.light, fontSize: 68, lineHeight: 72, letterSpacing: -3.4, color: T.ink }}>
              {localDigits(t("history.nights", { count: total }), i18n.language)}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink }}>{t("history.newRun")}</Text>
          </>
        )}
        <Text style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink2 }}>{t("history.note")}</Text>
        {longest > current && <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{localDigits(t("history.longest", { count: longest }), i18n.language)}</Text>}

        {/* Month */}
        <View style={{ marginTop: 28, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel>{monthName}</SectionLabel>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <Pressable onPress={() => setMonth(shiftMonth(month, -1))} accessibilityRole="button" accessibilityLabel={t("history.prev")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: rubik.regular, fontSize: 20, color: T.ink }}>{isRTL ? "›" : "‹"}</Text>
            </Pressable>
            <Pressable
              onPress={() => setMonth(shiftMonth(month, 1))}
              disabled={isCurrentMonth}
              accessibilityRole="button"
              accessibilityLabel={t("history.next")}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", opacity: isCurrentMonth ? 0.25 : 1 }}
            >
              <Text style={{ fontFamily: rubik.regular, fontSize: 20, color: T.ink }}>{isRTL ? "‹" : "›"}</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {weekdays.map((w, i) => (
            <Text key={`w${i}`} style={{ width: `${100 / 7}%`, textAlign: "center", paddingBottom: 6, fontFamily: rubik.regular, fontSize: 12, color: T.ink2 }}>
              {w}
            </Text>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <View key={`b${i}`} style={{ width: `${100 / 7}%` }} />
          ))}
          {days.map((d) => (
            <View key={d.date} accessible accessibilityLabel={label(d)} style={{ width: `${100 / 7}%`, alignItems: "center", gap: 3, paddingVertical: 5 }}>
              <View style={{ height: 20, justifyContent: "center" }}>{dot(d)}</View>
              <Text style={{ fontFamily: rubik.regular, fontSize: 11, color: T.ink3 }}>{num(Number(d.date.slice(8)))}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6 }}>
          {(
            [
              ["done", <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: T.ink }} />],
              ["part", <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: T.ink, opacity: 0.4 }} />],
              ["paused", <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderStyle: "dashed", borderColor: T.ink2 }} />],
              ["today", <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: T.ink }} />],
            ] as const
          ).map(([k, sw]) => (
            <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {sw}
              <Text style={{ fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t(`history.${k}`)}</Text>
            </View>
          ))}
        </View>

        {/* Milestones */}
        <View style={{ marginTop: 28, marginBottom: 4 }}>
          <SectionLabel>{t("history.milestones")}</SectionLabel>
        </View>
        {MILESTONES.map((n) => {
          const reached = longest >= n
          return (
            <Pressable
              key={n}
              onPress={() => reached && setOpen(n)}
              disabled={!reached}
              accessibilityRole={reached ? "button" : undefined}
              style={{ minHeight: 56, flexDirection: "row", alignItems: "baseline", gap: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.line }}
            >
              <Text style={{ width: 56, fontFamily: rubik.light, fontSize: 28, letterSpacing: -1, color: reached ? T.ink : T.ink3 }}>{num(n)}</Text>
              <Text style={{ flex: 1, fontFamily: rubik.regular, fontSize: 16, color: T.ink }}>{t(`history.ms${n}`)}</Text>
              <Text style={{ fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>{reached ? t("history.reached") : localDigits(t("history.toGo", { count: n - current }), i18n.language)}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
      <StatusScrim />
      <MilestoneOverlay milestone={open} onClose={() => setOpen(null)} />
    </View>
  )
}
