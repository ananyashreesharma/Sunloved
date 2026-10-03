// Country choice: a searchable sheet (CountrySheet), plus a field that opens it (CountryPicker).
// Onboarding shows a short list and opens the sheet for everything else; Me uses the field.

import { useMemo, useState } from "react"
import { View, Text, Pressable, Modal, TextInput, FlatList } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { COUNTRIES } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { useTheme } from "@/lib/theme"

/** Country names in the app's language when the JS engine supports it; English otherwise. */
export function useCountryName() {
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

export function CountrySheet({
  visible,
  onClose,
  value,
  onChange,
  title,
}: {
  visible: boolean
  onClose: () => void
  value: string | null
  onChange: (code: string) => void
  title: string
}) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const nameOf = useCountryName()
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const list = COUNTRIES.map((c) => ({ ...c, label: nameOf(c.code, c.name) }))
    .filter((c) => !q || c.label.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    .sort((a, b) => a.label.localeCompare(b.label))

  function close() {
    setQuery("")
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: rubik.semibold, fontSize: 20, color: T.ink }}>{title}</Text>
          <Pressable onPress={close} hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>{t("common.close")}</Text>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("common.searchCountries")}
          placeholderTextColor={T.ink3}
          autoCorrect={false}
          style={{
            marginHorizontal: 24,
            marginTop: 10,
            minHeight: 48,
            borderWidth: 1.5,
            borderColor: T.line,
            borderRadius: 14,
            paddingHorizontal: 14,
            fontFamily: rubik.regular,
            fontSize: 16,
            color: T.ink,
          }}
        />
        <FlatList
          data={list}
          keyExtractor={(c) => c.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => {
            const selected = item.code === value
            return (
              <Pressable
                onPress={() => {
                  onChange(item.code)
                  close()
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: T.line }}
              >
                <Text style={{ fontFamily: selected ? rubik.semibold : rubik.light, fontSize: 19, color: T.ink }}>{item.label}</Text>
                {selected && <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>✓</Text>}
              </Pressable>
            )
          }}
        />
      </View>
    </Modal>
  )
}

export function CountryPicker({ value, onChange, label }: { value: string; onChange: (code: string) => void; label: string }) {
  const { T } = useTheme()
  const nameOf = useCountryName()
  const [open, setOpen] = useState(false)
  const current = COUNTRIES.find((c) => c.code === value)
  const name = current ? nameOf(current.code, current.name) : value

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${name}`}
        style={{
          marginTop: 10,
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1.5,
          borderColor: T.line,
          borderRadius: 14,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ fontFamily: rubik.regular, fontSize: 16, color: T.ink }}>{name}</Text>
        <Text style={{ fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>▾</Text>
      </Pressable>
      <CountrySheet visible={open} onClose={() => setOpen(false)} value={value} onChange={onChange} title={label} />
    </>
  )
}
