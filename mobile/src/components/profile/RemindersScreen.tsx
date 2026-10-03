// V3 Reminders: one switch per routine with its time, the tone, a preview of the actual
// notification, and a pause switch. Says plainly when the phone has notifications turned off.

import { useCallback, useState } from "react"
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import type { GuestData } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { loadGuestData, updateGuestData } from "@/lib/guest-store"
import { getReminderStatus, syncReminders, type ReminderStatus } from "@/lib/notifications"
import { BACK_ARROW } from "@/lib/i18n"
import { formatTimeForDisplay } from "@/lib/time-format"
import { useTheme } from "@/lib/theme"
import { TimeEntryField } from "@/components/shared/TimeEntryField"
import { StatusScrim } from "@/components/check/parts"

export function RemindersScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const [data, setData] = useState<GuestData | null>(null)
  const [status, setStatus] = useState<ReminderStatus | null>(null)
  const [editing, setEditing] = useState<"morning" | "night" | null>(null)

  // Re-checked on focus, so coming back from the phone's Settings clears a stale warning.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      loadGuestData().then((d) => {
        if (cancelled) return
        setData(d)
        getReminderStatus(d).then((s) => !cancelled && setStatus(s))
      })
      return () => {
        cancelled = true
      }
    }, []),
  )

  async function patch(fields: Partial<GuestData>) {
    if (!data) return
    // Turning a routine's reminder on also undoes the old all-off tone from earlier app versions.
    const next = { ...data, ...fields, ...(data.reminderTone === "off" && (fields.remindMorning || fields.remindNight) ? { reminderTone: "coach" as const } : {}) }
    setData(next)
    await updateGuestData(next)
    await syncReminders(next, { interactive: true })
    setStatus(await getReminderStatus(next))
  }

  if (!data) return <View style={{ flex: 1, backgroundColor: T.bg }} />

  const off = data.reminderTone === "off"
  const morningOn = !off && data.remindMorning
  const nightOn = !off && data.remindNight
  const nightCount = data.steps.filter((s) => s.when !== "morning").length
  const preview = data.reminderTone === "plain" && nightCount > 0 ? t("reminders.factsNight", { count: nightCount }) : t("reminders.gentleNight")

  const row = (key: "morning" | "night", on: boolean, time: string) => (
    <View key={key} style={{ minHeight: 64, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 17, color: T.ink }}>{t(`rem.${key}`)}</Text>
          <Pressable onPress={() => setEditing(editing === key ? null : key)} accessibilityRole="button" style={{ flexDirection: "row", gap: 8, minHeight: 28, alignItems: "center" }}>
            <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{formatTimeForDisplay(time)}</Text>
            <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.ink, textDecorationLine: "underline" }}>{editing === key ? t("rem.done") : t("rem.change")}</Text>
          </Pressable>
        </View>
        <Switch
          value={on}
          onValueChange={(v) => patch(key === "morning" ? { remindMorning: v } : { remindNight: v })}
          accessibilityLabel={t(`rem.${key}`)}
          trackColor={{ true: T.ink, false: T.line }}
          thumbColor={T.surface}
          ios_backgroundColor={T.line}
        />
      </View>
      {editing === key && (
        <View style={{ marginTop: 10 }}>
          <TimeEntryField value={time} onChange={(v) => patch(key === "morning" ? { morningTime: v } : { nightTime: v })} fontSize={18} bordered />
        </View>
      )}
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("check.back")} style={{ width: 44, height: 44, justifyContent: "center", marginLeft: -4 }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.semibold, fontSize: 36, letterSpacing: -1.2, color: T.ink }}>
          {t("rem.title")}
        </Text>
        <Text style={{ marginTop: 8, fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink2 }}>{t("rem.quiet")}</Text>

        {status === "permission-denied" && (
          <View style={{ marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: T.hiCaution }}>
            <Text style={{ fontFamily: rubik.regular, fontSize: 15, lineHeight: 21, color: T.ink }}>{t("rem.blocked")}</Text>
            <Pressable onPress={() => Linking.openSettings()} style={{ minHeight: 40, justifyContent: "center" }}>
              <Text style={{ fontFamily: rubik.semibold, fontSize: 15, color: T.ink, textDecorationLine: "underline" }}>{t("rem.openSettings")}</Text>
            </Pressable>
          </View>
        )}

        <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: T.line, opacity: data.muted ? 0.45 : 1 }}>
          {row("morning", morningOn, data.morningTime)}
          {row("night", nightOn, data.nightTime)}
        </View>

        <Text style={{ marginTop: 26, marginBottom: 10, fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("rem.tone")}</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(
            [
              ["coach", t("rem.gentle")],
              ["plain", t("rem.facts")],
            ] as const
          ).map(([v, label]) => {
            const on = data.reminderTone === v
            return (
              <Pressable
                key={v}
                onPress={() => patch({ reminderTone: v })}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: on ? T.ink : T.line, backgroundColor: on ? T.ink : "transparent", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: rubik.regular, fontSize: 16, color: on ? T.bg : T.ink }}>{label}</Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={{ marginTop: 18, marginBottom: 8, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t("rem.preview")}</Text>
        <View style={{ padding: 14, borderRadius: 18, backgroundColor: T.surface, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: T.ink, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: T.bg }} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: rubik.regular, fontSize: 12, color: T.ink2 }}>SkinLens · {formatTimeForDisplay(data.nightTime)}</Text>
            <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink }}>{preview}</Text>
          </View>
        </View>

        <View style={{ marginTop: 24, minHeight: 64, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.line }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: rubik.regular, fontSize: 17, color: T.ink }}>{t("rem.pause")}</Text>
            <Text style={{ marginTop: 2, fontFamily: rubik.regular, fontSize: 13, lineHeight: 18, color: T.ink2 }}>{t("rem.pauseSub")}</Text>
          </View>
          <Switch
            value={data.muted}
            onValueChange={(v) => patch({ muted: v })}
            accessibilityLabel={t("rem.pause")}
            trackColor={{ true: T.ink, false: T.line }}
            thumbColor={T.surface}
            ios_backgroundColor={T.line}
          />
        </View>
      </ScrollView>
      <StatusScrim />
    </KeyboardAvoidingView>
  )
}
