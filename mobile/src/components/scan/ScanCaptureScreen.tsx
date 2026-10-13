// V3 "Check" tab: paste a label (photo reading comes later, so it isn't offered), optionally name
// it, or try a sample. Saved checks sit underneath with the verdict they had when saved.

import { useCallback, useState } from "react"
import { Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { countryByCode, SAMPLE_LABELS, type GuestScan, type ItemState } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { getScans } from "@/lib/data"
import { loadGuestData } from "@/lib/guest-store"
import { productCoverage, submitLabel } from "@/lib/api-client"
import { useCountryName } from "@/components/shared/CountryPicker"
import { ProductSearch } from "@/components/check/ProductSearch"
import { useTheme } from "@/lib/theme"
import { PrimaryButton, SectionLabel, StateTag, StatusScrim } from "@/components/check/parts"

const SAMPLES = SAMPLE_LABELS

const VERDICT_STATE: Record<"GREEN" | "YELLOW" | "RED", ItemState> = {
  GREEN: "fine",
  YELLOW: "caution",
  RED: "avoid",
}

export function ScanCaptureScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const [inci, setInci] = useState("")
  const [name, setName] = useState("")
  const [saved, setSaved] = useState<GuestScan[]>([])
  const [country, setCountry] = useState<string | null>(null)
  // Products we have for this person's country. The catalogue is built country by country from real
  // labels, so until there are some, search would only ever say "not found": say so honestly instead.
  const [coverage, setCoverage] = useState<number | null>(null)
  const nameOf = useCountryName()

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      loadGuestData().then((g) => {
        if (cancelled) return
        setCountry(g.country)
        if (g.country) productCoverage(g.country).then((c) => !cancelled && setCoverage(c.products)).catch(() => !cancelled && setCoverage(0))
        else setCoverage(0)
      })
      getScans().then((scans) => !cancelled && setSaved(scans))
      return () => {
        cancelled = true
      }
    }, []),
  )

  const canRead = inci.trim().length > 0 && name.trim().length >= 2

  function read(list = inci, label = name, sample = false) {
    if (!list.trim()) return
    // What people check is how the catalogue grows: name, country and list go to a review queue,
    // with nothing about the person. Our own samples don't.
    if (!sample && country && label.trim().length >= 2) submitLabel(country, label.trim(), list.trim()).catch(() => {})
    router.push({
      pathname: "/scan-confirm",
      params: { inci: list, name: label.trim() },
    })
  }

  function when(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    return days <= 0 ? t("check.today") : t("check.daysAgo", { count: days })
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: rubik.light,
            fontSize: 44,
            lineHeight: 50,
            letterSpacing: -1.8,
            color: T.ink,
          }}
        >
          {t("check.title")}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontFamily: rubik.regular,
            fontSize: 17,
            lineHeight: 24,
            color: T.ink2,
          }}
        >
          {t("check.sub")}
        </Text>

        {coverage !== null && coverage > 0 ? (
          <>
            <View style={{ marginTop: 20 }}>
              <ProductSearch country={country} />
            </View>
            <Text style={{ marginTop: 18, fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>{t("check.orPaste")}</Text>
          </>
        ) : coverage === 0 ? (
          <>
            <View style={{ marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: T.surface }}>
              <Text style={{ fontFamily: rubik.medium, fontSize: 17, lineHeight: 24, color: T.ink }}>
                {country ? t("check.buildingT", { country: nameOf(country, countryByCode(country)?.name ?? country) }) : t("check.buildingTNoCountry")}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 15, lineHeight: 22, color: T.ink2 }}>{t("check.buildingSub")}</Text>
            </View>
            <Text style={{ marginTop: 18, fontFamily: rubik.regular, fontSize: 14, color: T.ink2 }}>{t("check.pasteLabel")}</Text>
          </>
        ) : (
          <View style={{ height: 8 }} />
        )}

        <TextInput
          value={inci}
          onChangeText={setInci}
          multiline
          placeholder={t("check.placeholder")}
          placeholderTextColor={T.ink3}
          textAlignVertical="top"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel={t("check.sub")}
          style={{
            marginTop: 8,
            minHeight: 150,
            padding: 16,
            paddingTop: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: inci ? T.ink : T.line,
            backgroundColor: T.surface,
            fontFamily: rubik.regular,
            fontSize: 17,
            lineHeight: 24,
            color: T.ink,
            // Follows what's typed: INCI lists left to right, Arabic labels right to left.
            writingDirection: "auto",
            textAlign: "auto",
          }}
        />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("check.namePlaceholderRequired")}
          placeholderTextColor={T.ink3}
          accessibilityLabel={t("check.nameLabel")}
          returnKeyType="done"
          style={{
            marginTop: 10,
            minHeight: 50,
            paddingHorizontal: 16,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: T.line,
            fontFamily: rubik.regular,
            fontSize: 16,
            color: T.ink,
          }}
        />

        <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 13, lineHeight: 18, color: T.ink2 }}>
          {country ? t("check.nameWhy", { country: nameOf(country, countryByCode(country)?.name ?? country) }) : t("check.nameWhyNoCountry")}
        </Text>

        <View style={{ marginTop: 16 }}>
          <PrimaryButton label={t("check.read")} onPress={() => read()} disabled={!canRead} />
        </View>

        <Text
          style={{
            marginTop: 26,
            fontFamily: rubik.regular,
            fontSize: 14,
            color: T.ink2,
          }}
        >
          {t("check.tryOne")}
        </Text>
        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {SAMPLES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => read(s.inci, t(`check.${s.key}`), true)}
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: T.line,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: rubik.regular,
                  fontSize: 15,
                  color: T.ink,
                }}
              >
                {t(`check.${s.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text
          style={{
            marginTop: 20,
            fontFamily: rubik.regular,
            fontSize: 13,
            lineHeight: 19,
            color: T.ink2,
          }}
        >
          {t("check.promise")}
        </Text>

        {saved.length > 0 && (
          <View style={{ marginTop: 36 }}>
            <SectionLabel>{t("check.savedChecks")}</SectionLabel>
            <View style={{ marginTop: 8 }}>
              {saved.map((s) => (
                <Pressable
                  key={s.id}
                  disabled={!s.rawIngredientText}
                  onPress={() =>
                    s.rawIngredientText &&
                    router.push({
                      pathname: "/scan-result",
                      params: { inci: s.rawIngredientText, name: s.title },
                    })
                  }
                  style={{
                    minHeight: 64,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: T.line,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: rubik.medium,
                        fontSize: 17,
                        color: T.ink,
                      }}
                    >
                      {s.title}
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        fontFamily: rubik.regular,
                        fontSize: 13,
                        color: T.ink2,
                      }}
                    >
                      {when(s.savedAt)}
                    </Text>
                  </View>
                  {s.verdict ? <StateTag state={VERDICT_STATE[s.verdict]} /> : s.verdict === null ? <StateTag state="none" label={t("check.noVerdict")} /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      <StatusScrim />
    </View>
  )
}
