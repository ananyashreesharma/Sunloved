// "Search a product" on the phone: type-ahead over products we have a label for (the user's
// country's formulation first). Picking one opens its reading, as if the label had been pasted.

import { useEffect, useRef, useState } from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import { useTranslation } from "react-i18next"
import { router } from "expo-router"
import { rubik } from "@/constants/fonts"
import { api } from "@/lib/api-client"
import { useTheme } from "@/lib/theme"

type Found = { id: string; name: string; brand: string; country: string | null; ingredientCount: number }

const title = (p: { name: string; brand: string }) => (p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`)

export function ProductSearch({ country }: { country: string | null }) {
  const { t } = useTranslation()
  const { T } = useTheme()
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Found[]>([])
  const [searched, setSearched] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    timer.current = setTimeout(() => {
      api
        .get<Found[]>(`/products/find?q=${encodeURIComponent(q.trim())}${country ? `&country=${country}` : ""}`)
        .then((r) => {
          setResults(r)
          setSearched(true)
        })
        .catch(() => setResults([]))
    }, 250)
  }, [q, country])

  async function pick(p: Found) {
    const label = await api.get<{ inci: string }>(`/products/${encodeURIComponent(p.id)}/label`).catch(() => null)
    if (!label?.inci) return
    setQ("")
    setResults([])
    router.push({ pathname: "/scan-result", params: { inci: label.inci, name: title(p) } })
  }

  return (
    <View>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={t("check.searchPlaceholder")}
        placeholderTextColor={T.ink3}
        accessibilityLabel={t("check.search")}
        autoCorrect={false}
        returnKeyType="search"
        style={{ minHeight: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: q ? T.ink : T.line, backgroundColor: T.surface, fontFamily: rubik.regular, fontSize: 17, color: T.ink }}
      />
      {(results.length > 0 || searched) && (
        <View style={{ marginTop: 6, borderRadius: 14, borderWidth: 1, borderColor: T.line, backgroundColor: T.surface, overflow: "hidden" }}>
          {results.length === 0 && <Text style={{ padding: 14, fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("check.searchNone")}</Text>}
          {results.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => pick(p)}
              accessibilityRole="button"
              // Plain style object: NativeWind drops Pressable style callbacks.
              style={{ paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: i ? 1 : 0, borderTopColor: T.line }}
            >
              <Text style={{ fontFamily: rubik.regular, fontSize: 16, color: T.ink }}>{title(p)}</Text>
              <Text style={{ marginTop: 2, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t("check.searchCount", { count: p.ingredientCount })}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}
