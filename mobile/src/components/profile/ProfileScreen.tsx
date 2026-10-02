// Port of frontend/components/ouma/app/OumaProfileClient.tsx. Guest-only for now (see
// OnboardingWizard/RoutineHome) — the account section shows the same "sign in to get this" prompt
// the web version shows guests, and Learn/Insights are dropped since neither has a mobile screen at
// all yet (unlike Scan, which at least has a route to point at).
//
// This is also the first place on mobile the morning/night reminder times set during onboarding are
// visible or editable anywhere — until now they were saved to guest-store and never surfaced again.

import { useCallback, useEffect, useRef, useState } from "react"
import { View, Text, Pressable, Animated, ScrollView, KeyboardAvoidingView, Platform, Linking } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { CountryPicker } from "@/components/shared/CountryPicker"
import { DEFAULT_COUNTRY } from "@skinlens/shared"
import { loadGuestData, updateGuestData, getGuestRoutine, type GuestData, type GuestRoutineStepView } from "@/lib/guest-store"
import { syncReminders, getReminderStatus, type ReminderStatus } from "@/lib/notifications"
import { formatTimeForDisplay } from "@/lib/time-format"
import { TimeEntryField } from "@/components/shared/TimeEntryField"
import { SoftPressable } from "@/components/shared/SoftPressable"

const TONE_CODES: GuestData["reminderTone"][] = ["coach", "plain", "off"]

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: colors.mute }}>
      {children}
    </Text>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16 }}>
      {children}
    </View>
  )
}

// Was a plain View flipping marginLeft in one frame — a toggle switch snapping instantly is one of
// the more noticeably "hard" interactions a settings screen can have, since it's a control whose
// whole job is to show a state change. Animates both the thumb's slide and the track's color.
function MuteToggle({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current
  useEffect(() => {
    Animated.spring(anim, { toValue: checked ? 1 : 0, useNativeDriver: false, friction: 8, tension: 200 }).start()
  }, [checked, anim])

  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ["#D2DAD1", colors.accent] })
  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] })

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={10}
    >
      <Animated.View style={{ width: 42, height: 24, borderRadius: 12, backgroundColor: trackColor, justifyContent: "center" }}>
        <Animated.View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", transform: [{ translateX: thumbX }] }} />
      </Animated.View>
    </Pressable>
  )
}

export function ProfileScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<GuestData | null>(null)
  const [nightSteps, setNightSteps] = useState<GuestRoutineStepView[]>([])
  const [editingTimes, setEditingTimes] = useState(false)
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      loadGuestData().then((d) => {
        if (cancelled) return
        setData(d)
        // Re-checked every time this screen gains focus (not just after a local edit) so coming
        // back from the iOS Settings app — the only way to undo a denied permission — picks up the
        // change immediately instead of showing a stale warning.
        getReminderStatus(d).then((s) => !cancelled && setReminderStatus(s))
      })
      getGuestRoutine("night").then((r) => {
        if (!cancelled) setNightSteps(r.steps)
      })
      return () => {
        cancelled = true
      }
    }, []),
  )

  async function patch(fields: Partial<GuestData>) {
    if (!data) return
    const next = { ...data, ...fields }
    setData(next) // optimistic
    await updateGuestData(fields)
    if ("morningTime" in fields || "nightTime" in fields || "reminderTone" in fields || "muted" in fields) {
      await syncReminders(next, { interactive: true })
      setReminderStatus(await getReminderStatus(next))
    }
  }

  const stepNames = nightSteps.map((s) => s.name).join(" · ")

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bone }}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: 40, gap: 14 }}
      >
        <Text style={{ fontFamily: fonts.display, fontSize: 28, textTransform: "uppercase", color: colors.ink }}>{t("profile.title")}</Text>

        {/* Skin profile */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <SectionLabel>{t("profile.skinProfile")}</SectionLabel>
            <Pressable onPress={() => router.push("/onboarding")}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent }}>{t("profile.edit")}</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {data?.skinType && (
              <Text style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#E4EBE2", fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                {t(`onboarding.skinTypes.${data.skinType}`, { defaultValue: data.skinType })}
              </Text>
            )}
            {data?.concerns.map((code) => (
              <Text key={code} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#E4EBE2", fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                {t(`onboarding.concerns.${code}`, { defaultValue: code })}
              </Text>
            ))}
            {data && !data.skinType && data.concerns.length === 0 && (
              <Text style={{ fontFamily: fonts.bodyItalic, fontSize: 13, color: colors.mute }}>{t("profile.notSetYet")}</Text>
            )}
          </View>
        </Card>

        {/* Country */}
        <Card>
          <SectionLabel>{t("profile.country")}</SectionLabel>
          <CountryPicker value={data?.country ?? DEFAULT_COUNTRY} onChange={(code) => patch({ country: code })} label={t("profile.country")} />
          <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, color: colors.mute }}>{t("profile.countryHelp")}</Text>
        </Card>

        {/* Reminders */}
        <Card>
          <SectionLabel>{t("profile.reminders")}</SectionLabel>

          {editingTimes ? (
            <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.mute }}>{t("onboarding.morningLabel")}</Text>
                <View style={{ marginTop: 4 }}>
                  <TimeEntryField
                    value={data?.morningTime ?? "07:30"}
                    onChange={(time) => patch({ morningTime: time })}
                    fontSize={15}
                    bordered
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.mute }}>{t("onboarding.nightLabel")}</Text>
                <View style={{ marginTop: 4 }}>
                  <TimeEntryField
                    value={data?.nightTime ?? "21:30"}
                    onChange={(time) => patch({ nightTime: time })}
                    fontSize={15}
                    bordered
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 14.5, color: colors.ink }}>
                {t("onboarding.morningLabel")} · {data?.morningTime ? formatTimeForDisplay(data.morningTime) : "–"} ·{" "}
                {t("onboarding.nightLabel")} · {data?.nightTime ? formatTimeForDisplay(data.nightTime) : "–"}
              </Text>
              <Pressable onPress={() => setEditingTimes(true)}>
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent }}>{t("profile.change")}</Text>
              </Pressable>
            </View>
          )}

          <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.ink }}>{t("profile.channel")}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("profile.pushNotifications")}</Text>
          </View>

          {reminderStatus === "permission-denied" && (
            <View
              style={{
                marginTop: 10,
                backgroundColor: "#F7EDD8",
                borderRadius: 12,
                padding: 13,
                gap: 8,
              }}
            >
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: "#7C5410", lineHeight: 17 }}>
                {t("profile.notificationsBlocked")}
              </Text>
              <Pressable onPress={() => Linking.openSettings()}>
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: "#7C5410", textDecorationLine: "underline" }}>
                  {t("profile.openSettings")}
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={{ marginTop: 14, fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("profile.tone")}</Text>
          <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
            {TONE_CODES.map((code) => (
              <SoftPressable
                key={code}
                onPress={() => patch({ reminderTone: code })}
                accessibilityRole="radio"
                accessibilityState={{ selected: data?.reminderTone === code }}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: data?.reminderTone === code ? 1.5 : 1,
                  borderColor: data?.reminderTone === code ? colors.accent : colors.line,
                  backgroundColor: colors.card,
                }}
              >
                <Text
                  style={{
                    fontFamily: data?.reminderTone === code ? fonts.bodySemiBold : fonts.body,
                    fontSize: 13.5,
                    color: data?.reminderTone === code ? colors.accent : colors.ink,
                  }}
                >
                  {t(`profile.tones.${code}`)}
                </Text>
              </SoftPressable>
            ))}
          </View>

          {/* Notification preview */}
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("profile.previewIntro")}</Text>
            <View style={{ marginTop: 8, backgroundColor: colors.bone, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 13 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 9, color: "#fff" }}>SL</Text>
                </View>
                <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink }}>SkinLens</Text>
                <Text style={{ marginLeft: "auto", fontFamily: fonts.mono, fontSize: 11, color: colors.mute }}>
                  {formatTimeForDisplay(data?.nightTime ?? "21:30")}
                </Text>
              </View>
              <Text style={{ marginTop: 7, fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink }}>
                {nightSteps.length > 0 ? t("profile.pmRoutineSteps", { count: nightSteps.length }) : t("profile.pmRoutineNoSteps")}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: "#2A342C", marginTop: 2 }}>
                {data?.reminderTone === "off" ? t("profile.remindersOff") : stepNames || t("profile.gentleNudge")}
              </Text>
              {data?.reminderTone === "coach" && (
                <Text style={{ fontFamily: fonts.bodyItalic, fontSize: 12.5, color: colors.mute, marginTop: 4 }}>{t("profile.coachQuote")}</Text>
              )}
            </View>
          </View>

          <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.ink }}>{t("profile.muteAll")}</Text>
            <MuteToggle checked={!!data?.muted} onToggle={() => patch({ muted: !data?.muted })} label={t("profile.muteAll")} />
          </View>
        </Card>

        {/* Account */}
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.ink }}>{t("profile.plan")}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("profile.planValue")}</Text>
          </View>
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.ink }}>{t("profile.referFriend")}</Text>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent }}>{t("profile.earnRewards")}</Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/login", params: { next: "/routine" } })}
              style={{ marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bone, paddingVertical: 10, paddingHorizontal: 12 }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent }}>{t("profile.signInForCode")}</Text>
            </Pressable>
          </View>
        </Card>

        <Text style={{ textAlign: "center", fontFamily: fonts.body, fontSize: 11, color: colors.mute }}>{t("profile.footer")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
