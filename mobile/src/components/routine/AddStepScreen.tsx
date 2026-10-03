// V3 step sheet: add a step or edit one (name, kind, when, how often), with a live line saying where
// it lands in the routine. Editing also offers removal. Opened as a sheet over Routine or My products.

import { useEffect, useMemo, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import { STEP_KINDS, stepKind, stepNeighbours, type GuestData, type StepFrequency, type StepKind } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { addGuestStep, loadGuestData, removeGuestStep, updateGuestStep } from "@/lib/guest-store"
import { useTheme } from "@/lib/theme"
import { PrimaryButton } from "@/components/check/parts"

type When = "morning" | "night" | "both"

const KIND_KEY: Record<StepKind, string> = {
  cleanse: "kindCleanse",
  exfoliate: "kindExfoliate",
  serum: "kindSerum",
  treat: "kindTreat",
  moisturise: "kindMoisturise",
  seal: "kindSeal",
  sunscreen: "kindSunscreen",
}

export function AddStepScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const params = useLocalSearchParams<{ id?: string; type?: string; name?: string }>()
  const editing = !!params.id

  const [data, setData] = useState<GuestData | null>(null)
  const [name, setName] = useState(params.name ?? "")
  // Guessed from the name until the person picks one themselves.
  const [kind, setKind] = useState<StepKind | null>(null)
  const [kindPicked, setKindPicked] = useState(false)
  const [when, setWhen] = useState<When>(params.type === "morning" ? "morning" : "night")
  const [frequency, setFrequency] = useState<StepFrequency>("daily")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGuestData().then((d) => {
      setData(d)
      const step = params.id ? d.steps.find((s) => s.id === params.id) : null
      if (step) {
        setName(step.name)
        setWhen(step.when)
        setFrequency(step.frequency)
        if (step.kind) {
          setKind(step.kind)
          setKindPicked(true)
        }
      }
    })
  }, [params.id])

  const effectiveKind = kindPicked ? kind : stepKind(name)

  const goes = useMemo(() => {
    if (!data || !name.trim()) return ""
    const period = when === "morning" ? "morning" : "night"
    const n = stepNeighbours(data, period, { name: name.trim(), kind: effectiveKind ?? undefined }, params.id)
    if (n.after && n.before) return t("step.goesBetween", { a: n.after, b: n.before })
    if (n.after) return t("step.goesAfter", { a: n.after })
    if (n.before) return t("step.goesBefore", { b: n.before })
    return t("step.goesOnly")
  }, [data, name, when, effectiveKind, params.id, t])

  async function save() {
    const trimmed = name.trim()
    if (!trimmed || !data) return
    const clash = data.steps.find((s) => s.id !== params.id && s.name.toLowerCase() === trimmed.toLowerCase())
    if (clash) {
      setError(t("step.duplicate", { name: trimmed }))
      return
    }
    const kindField = effectiveKind ?? undefined
    if (params.id) await updateGuestStep(params.id, { name: trimmed, when, frequency, kind: kindField })
    else await addGuestStep({ name: trimmed, when, frequency, kind: kindField })
    router.back()
  }

  function confirmRemove() {
    if (!params.id) return
    Alert.alert(t("step.removeConfirmTitle", { name: name.trim() }), t("step.removeConfirmBody"), [
      { text: t("step.cancel"), style: "cancel" },
      {
        text: t("step.remove"),
        style: "destructive",
        onPress: async () => {
          await removeGuestStep(params.id!)
          router.back()
        },
      },
    ])
  }

  const label = (s: string) => <Text style={{ marginTop: 24, marginBottom: 10, fontFamily: rubik.semibold, fontSize: 14, color: T.ink2 }}>{s}</Text>

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 14 : insets.top + 8, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: T.line, marginBottom: 14 }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text accessibilityRole="header" style={{ fontFamily: rubik.semibold, fontSize: 26, letterSpacing: -0.6, color: T.ink }}>
            {editing ? t("step.editTitle") : t("step.addTitle")}
          </Text>
          <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>{t("step.close")}</Text>
          </Pressable>
        </View>

        {label(t("step.name"))}
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v)
            setError(null)
          }}
          placeholder={t("step.namePlaceholder")}
          placeholderTextColor={T.ink3}
          autoFocus={!editing && !params.name}
          returnKeyType="done"
          style={{ minHeight: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: name ? T.ink : T.line, fontFamily: rubik.regular, fontSize: 17, color: T.ink }}
        />
        {error && <Text style={{ marginTop: 8, fontFamily: rubik.regular, fontSize: 14, color: T.tAvoid }}>{error}</Text>}

        {label(t("step.kind"))}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {STEP_KINDS.map((k) => (
            <Chip
              key={k}
              on={effectiveKind === k}
              label={t(`routine.${KIND_KEY[k]}`)}
              onPress={() => {
                setKind(k)
                setKindPicked(true)
              }}
            />
          ))}
        </View>

        {label(t("step.when"))}
        <Segmented
          value={when}
          onChange={setWhen}
          options={[
            ["morning", t("step.morning")],
            ["night", t("step.night")],
            ["both", t("step.both")],
          ]}
        />

        {label(t("step.often"))}
        <Segmented
          value={frequency}
          onChange={setFrequency}
          options={[
            ["daily", t("step.daily")],
            ["alternate", t("step.alternate")],
            ["twice_weekly", t("step.twice")],
          ]}
        />

        {goes ? <Text style={{ marginTop: 20, fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink2 }}>{goes}</Text> : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <PrimaryButton label={editing ? t("step.save") : t("step.add")} onPress={save} disabled={!name.trim()} />
        {editing && (
          <Pressable onPress={confirmRemove} style={{ minHeight: 48, marginTop: 4, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.tAvoid }}>{t("step.remove")}</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  const { T } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: on ? T.ink : T.line, backgroundColor: on ? T.ink : "transparent", justifyContent: "center" }}
    >
      <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: on ? T.bg : T.ink }}>{label}</Text>
    </Pressable>
  )
}

function Segmented<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: [V, string][] }) {
  const { T } = useTheme()
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: 4, padding: 3, borderRadius: 16, backgroundColor: T.line }}>
      {options.map(([v, text]) => {
        const on = v === value
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{ flex: 1, minHeight: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, backgroundColor: on ? T.bg : "transparent" }}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontFamily: on ? rubik.semibold : rubik.regular, fontSize: 15, color: T.ink }}>
              {text}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
