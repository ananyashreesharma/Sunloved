// Progress photos: the first and the latest side by side, every photo by week, and how skin has
// felt after the night routine. Everything here stays on this phone.

import { useCallback, useState } from "react"
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { daysBetween, SKIN_FEELS, type SkinFeel } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { BACK_ARROW, localDigits } from "@/lib/i18n"
import { useTheme } from "@/lib/theme"
import { loadGuestData } from "@/lib/guest-store"
import { addPhoto, deletePhoto, listPhotos, type ProgressPhoto } from "@/lib/progress-photos"
import { StatusScrim } from "@/components/check/parts"

/** Check-ins counted in the summary. */
const FEEL_WINDOW = 14

export function ProgressScreen() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [feels, setFeels] = useState<SkinFeel[]>([])

  const load = useCallback(() => {
    setPhotos(listPhotos())
    loadGuestData().then((g) => {
      const log = g.skinLog ?? {}
      setFeels(
        Object.keys(log)
          .sort()
          .slice(-FEEL_WINDOW)
          .map((d) => log[d]),
      )
    })
  }, [])
  useFocusEffect(load)

  async function add(source: "camera" | "library") {
    if (await addPhoto(source)) load()
  }

  function confirmDelete(p: ProgressPhoto) {
    Alert.alert(t("progress.deleteQ"), t("progress.deleteBody"), [
      { text: t("progress.cancel"), style: "cancel" },
      {
        text: t("progress.delete"),
        style: "destructive",
        onPress: () => {
          deletePhoto(p)
          load()
        },
      },
    ])
  }

  const first = photos[0]
  const latest = photos.length > 1 ? photos[photos.length - 1] : null
  const weekOf = (p: ProgressPhoto) => (first ? Math.floor(daysBetween(first.date, p.date) / 7) : 0)
  const label = (p: ProgressPhoto) => (p === first ? t("progress.start") : localDigits(t("progress.week", { count: weekOf(p) }), i18n.language))
  const dateText = (p: ProgressPhoto) => new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" }).format(new Date(`${p.date}T12:00:00`))
  const count = (f: SkinFeel) => feels.filter((x) => x === f).length

  const button = (text: string, onPress: () => void, primary: boolean) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ flex: 1, minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: primary ? T.btn : "transparent", borderWidth: primary ? 0 : 1.5, borderColor: T.line }}
    >
      <Text style={{ fontFamily: rubik.semibold, fontSize: 15, color: primary ? T.btnInk : T.ink }}>{text}</Text>
    </Pressable>
  )

  const photoCard = (p: ProgressPhoto, title: string) => (
    <View style={{ flex: 1 }}>
      <Image source={{ uri: p.uri }} accessibilityLabel={`${title}, ${dateText(p)}`} style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 14, backgroundColor: T.line }} />
      <Text style={{ marginTop: 6, fontFamily: rubik.medium, fontSize: 15, color: T.ink }}>{title}</Text>
      <Text style={{ fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{dateText(p)}</Text>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("check.back")} style={{ width: 44, height: 44, justifyContent: "center", marginLeft: -4 }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.semibold, fontSize: 36, letterSpacing: -1.2, color: T.ink }}>
          {t("progress.title")}
        </Text>
        <Text style={{ marginTop: 8, fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink2 }}>{t("progress.sub")}</Text>

        {first ? (
          <View style={{ marginTop: 22, flexDirection: "row", gap: 12 }}>
            {photoCard(first, t("progress.start"))}
            {latest ? photoCard(latest, label(latest)) : <View style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", borderColor: T.line, alignItems: "center", justifyContent: "center", padding: 12 }}><Text style={{ fontFamily: rubik.regular, fontSize: 14, lineHeight: 20, textAlign: "center", color: T.ink2 }}>{t("progress.nextIn")}</Text></View>}
          </View>
        ) : (
          <Text style={{ marginTop: 22, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink }}>{t("progress.empty")}</Text>
        )}

        <View style={{ marginTop: 18, flexDirection: "row", gap: 10 }}>
          {button(t("progress.take"), () => add("camera"), true)}
          {button(t("progress.pick"), () => add("library"), false)}
        </View>
        <Text style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 13, lineHeight: 18, color: T.ink2 }}>{t("progress.tip")}</Text>

        {feels.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("progress.feelT")}</Text>
            <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
              {SKIN_FEELS.map((f) => (
                <View key={f} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, backgroundColor: T.surface }}>
                  <Text style={{ fontFamily: rubik.light, fontSize: 30, color: T.ink }}>{localDigits(String(count(f)), i18n.language)}</Text>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t(`routine.feel.${f}`)}</Text>
                </View>
              ))}
            </View>
            <Text style={{ marginTop: 8, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{localDigits(t("progress.feelWindow", { count: feels.length }), i18n.language)}</Text>
          </View>
        )}

        {photos.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{t("progress.all")}</Text>
            {[...photos].reverse().map((p) => (
              <View key={p.name} style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: T.line }}>
                <Image source={{ uri: p.uri }} style={{ width: 56, height: 75, borderRadius: 8, backgroundColor: T.line }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>{label(p)}</Text>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>{dateText(p)}</Text>
                </View>
                <Pressable onPress={() => confirmDelete(p)} accessibilityRole="button" accessibilityLabel={`${t("progress.delete")}: ${label(p)}`} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 6 }}>
                  <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink2, textDecorationLine: "underline" }}>{t("progress.delete")}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <StatusScrim />
    </View>
  )
}
