// Port of frontend/components/ouma/app/OumaProductsClient.tsx. Guest-only for now — reads the
// same guest-store steps RoutineHome writes, since mobile has no session to call getMyProducts().

import { useCallback, useState } from "react"
import { View, Text, Pressable, ScrollView, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useFocusEffect } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { BACK_ARROW } from "@/lib/i18n"
import { loadGuestData } from "@/lib/guest-store"

type ProductRow = { id: string; name: string; brand: string; usage: string[] }

export function ProductsScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [products, setProducts] = useState<ProductRow[] | null>(null)

  // This screen is pushed on top of the tab navigator (app/products.tsx, not a tab itself), but it
  // can still be reached more than once across a session, so a one-time useEffect would go stale —
  // useFocusEffect re-fetches every time it regains focus instead, e.g. after Add Step pops back.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      loadGuestData().then((data) => {
        if (cancelled) return
        setProducts(
          data.steps.map((s) => ({
            id: s.id,
            name: s.name,
            brand: s.brand ?? "",
            usage: s.when === "both" ? [t("routine.amTab"), t("routine.pmTab")] : s.when === "morning" ? [t("routine.amTab")] : [t("routine.pmTab")],
          })),
        )
      })
      return () => {
        cancelled = true
      }
    }, [t]),
  )

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bone }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: 40 }}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{BACK_ARROW} {t("common.backRoutine")}</Text>
      </Pressable>
      <View style={{ marginTop: 12, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 26, textTransform: "uppercase", color: colors.ink }}>
          {t("products.title")}
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.mute }}>{products?.length ?? 0}</Text>
      </View>
      <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13, color: colors.mute }}>{t("products.subtitle")}</Text>

      <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {(products ?? []).map((p) => (
          <View
            key={p.id}
            style={{
              width: "47%",
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.line,
              padding: 13,
            }}
          >
            <View style={{ height: 64, borderRadius: 9, backgroundColor: "#E4EBE2" }} />
            <Text style={{ marginTop: 9, fontFamily: fonts.bodySemiBold, fontSize: 13.5, lineHeight: 17, color: colors.ink }}>
              {p.name}
            </Text>
            {!!p.brand && <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.mute, marginTop: 2 }}>{p.brand}</Text>}
            <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, backgroundColor: "#E4EBE2", color: colors.mute }}>
                {p.usage.join(" + ") || t("products.unused")}
              </Text>
              <Pressable
                onPress={() => Alert.alert(t("products.comingSoonTitle"), t("products.comingSoonBody"))}
                accessibilityRole="button"
                hitSlop={10}
              >
                <Text
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10.5,
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: "rgba(23,33,26,.25)",
                    color: colors.mute,
                  }}
                >
                  {t("products.scanToCheck")}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {products?.length === 0 && (
        <Text style={{ marginTop: 24, fontFamily: fonts.body, fontSize: 13, color: colors.mute, textAlign: "center" }}>
          {t("products.empty")}
        </Text>
      )}
    </ScrollView>
  )
}
