// Port of frontend/components/ouma/app/OumaStreakHistoryClient.tsx. Guest-only, same reasoning as
// RoutineHome/ProfileScreen — reads getGuestStreak()/getGuestStreakHistory() from guest-store, which
// existed already (built alongside the routine/scan work) but had no screen calling them yet.

import { useCallback, useState } from "react"
import { View, Text, Pressable, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { fonts } from "@/constants/fonts"
import { colors } from "@/constants/tokens"
import { BACK_ARROW, FORWARD_ARROW } from "@/lib/i18n"
import { getGuestStreak, getGuestStreakHistory, type GuestStreakDay } from "@/lib/guest-store"
import { StreakLeafIcon } from "./icons"

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function monthLabel(month: string, locale: string): string {
  const [y, m] = month.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, 1))
    .toLocaleDateString(locale, { month: "long", timeZone: "UTC" })
    .toUpperCase()
}

const STATUS_STYLE: Record<GuestStreakDay["status"], { bg: string; fg: string; border?: string; dashed?: boolean }> = {
  both: { bg: "#1D5C3B", fg: "#FFFFFF" },
  one: { bg: "rgba(29,92,59,.35)", fg: "#FFFFFF" },
  paused: { bg: "#E4EBE2", fg: colors.mute },
  // fg was #AAB4AB (1.95:1 contrast on the bone background — fails WCAG AA badly, close to
  // unreadable for anyone with low vision). colors.mute is the app's existing "de-emphasized but
  // legible" text color elsewhere (5.75:1) — reuses that instead of a one-off very-light grey.
  future: { bg: "transparent", fg: colors.mute, border: "rgba(23,33,26,.15)", dashed: true },
}

export function StreakHistoryScreen() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const [month, setMonth] = useState(currentMonth())
  const [days, setDays] = useState<GuestStreakDay[]>([])
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number; totalDaysCompleted: number } | null>(null)

  const STATUS_LABEL: Record<GuestStreakDay["status"], string> = {
    both: t("history.statusBoth"),
    one: t("history.statusOne"),
    paused: t("history.statusPaused"),
    future: t("history.statusFuture"),
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      getGuestStreak().then((s) => !cancelled && setStreak(s))
      getGuestStreakHistory(month).then((r) => !cancelled && setDays(r.days))
      return () => {
        cancelled = true
      }
    }, [month]),
  )

  const firstWeekday = (() => {
    const [y, m] = month.split("-").map(Number)
    return new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  })()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bone }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: 40, gap: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("common.backRoutine")}</Text>
        </Pressable>

        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <StreakLeafIcon size={20} color={colors.accent} />
            <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 34, color: colors.ink }}>{streak?.currentStreak ?? "–"}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.mute }}>{t("history.nightsInRow")}</Text>
          </View>
          <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>
            {t("history.longest")} <Text style={{ fontFamily: fonts.mono, color: colors.ink }}>{streak?.longestStreak ?? "–"}</Text> ·{" "}
            {t("history.totalLogged")} <Text style={{ fontFamily: fonts.mono, color: colors.ink }}>{streak?.totalDaysCompleted ?? "–"}</Text>
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
          <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("history.prev")}</Text>
          </Pressable>
          <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.mute, letterSpacing: 1.3 }}>
            {monthLabel(month, i18n.language)}
          </Text>
          <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("history.next")} {FORWARD_ARROW}</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <View key={`pad-${i}`} style={{ width: "14.28%", aspectRatio: 1 }} />
          ))}
          {days.map((d) => {
            const style = STATUS_STYLE[d.status]
            const dayNum = Number(d.date.slice(-2))
            const dateLabel = new Date(`${d.date}T00:00:00Z`).toLocaleDateString(i18n.language, { month: "long", day: "numeric", timeZone: "UTC" })
            return (
              <View
                key={d.date}
                accessible
                accessibilityLabel={`${dateLabel}: ${STATUS_LABEL[d.status]}`}
                style={{ width: "14.28%", aspectRatio: 1, padding: 3 }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: style.bg,
                    borderWidth: style.border ? 1 : 0,
                    borderColor: style.border,
                    borderStyle: style.dashed ? "dashed" : "solid",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: style.fg }}>{dayNum}</Text>
                </View>
              </View>
            )
          })}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {[
            { label: t("history.legendBoth"), color: "#1D5C3B" },
            { label: t("history.legendOne"), color: "rgba(29,92,59,.35)" },
            { label: t("history.legendPaused"), color: "#E4EBE2" },
          ].map((l) => (
            <View key={l.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color }} />
              <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.mute }}>{l.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 14 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 }}>{t("history.footerNote")}</Text>
        </View>
      </ScrollView>
    </View>
  )
}
