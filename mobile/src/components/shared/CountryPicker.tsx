// Country field: shows the chosen country, opens a searchable list. Used in onboarding and Me.

import { useMemo, useState } from "react"
import { View, Text, Pressable, Modal, TextInput, FlatList } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { COUNTRIES } from "@skinlens/shared"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { SoftPressable } from "@/components/shared/SoftPressable"

/** Country names in the app's language when the JS engine supports it; English otherwise. */
function useCountryName() {
  const { i18n } = useTranslation()
  return useMemo(() => {
    let display: { of: (code: string) => string | undefined } | null = null
    try {
      display = new Intl.DisplayNames([i18n.language], { type: "region" })
    } catch {
      display = null
    }
    return (code: string, fallback: string) => {
      try {
        return display?.of(code) ?? fallback
      } catch {
        return fallback
      }
    }
  }, [i18n.language])
}

export function CountryPicker({ value, onChange, label }: { value: string; onChange: (code: string) => void; label: string }) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const nameOf = useCountryName()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const current = COUNTRIES.find((c) => c.code === value)
  const q = query.trim().toLowerCase()
  const list = COUNTRIES.filter((c) => !q || nameOf(c.code, c.name).toLowerCase().includes(q) || c.name.toLowerCase().includes(q))

  return (
    <>
      <SoftPressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current ? nameOf(current.code, current.name) : value}`}
        style={{
          marginTop: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          paddingVertical: 13,
          paddingHorizontal: 14,
        }}
      >
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>
          {current ? nameOf(current.code, current.name) : value}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>▾</Text>
      </SoftPressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bone, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 18, textTransform: "uppercase", color: colors.ink }}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent }}>{t("common.close")}</Text>
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("common.searchCountries")}
            placeholderTextColor={colors.mute}
            autoCorrect={false}
            style={{
              marginHorizontal: 20,
              marginTop: 14,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.ink,
            }}
          />
          <FlatList
            data={list}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => {
              const selected = item.code === value
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.code)
                    setOpen(false)
                    setQuery("")
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}
                >
                  <Text style={{ fontFamily: selected ? fonts.bodySemiBold : fonts.body, fontSize: 15, color: colors.ink }}>
                    {nameOf(item.code, item.name)}
                  </Text>
                  {selected && <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.accent }}>✓</Text>}
                </Pressable>
              )
            }}
          />
        </View>
      </Modal>
    </>
  )
}
