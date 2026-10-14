// V3 label result. Flow: read the label aloud (each ingredient gets its mark as we reach it), then
// the verdict with its key word highlighted, the block strip with the 70% line, numbered notes for
// everything flagged or unknown, and the annotated label. Below 70% rated there is no verdict, and
// a failed request never turns into one.

import { useEffect, useMemo, useRef, useState } from "react"
import { Pressable, ScrollView, Share, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { router, useLocalSearchParams } from "expo-router"
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated"
import { annotateLabel, splitLabel, countryByCode, COVERAGE_THRESHOLD, type AnalyzeIngredientsResponse, type AnnotatedLabel, type HazardStep, type IngredientOverride, type LabelItem, type Zone } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { analyzeIngredients, ApiError, reportUnknownIngredient } from "@/lib/api-client"
import { loadGuestData, updateGuestData } from "@/lib/guest-store"
import { getScans, saveScan } from "@/lib/data"
import { useAccount } from "@/lib/account"
import { track } from "@/lib/analytics"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { BACK_ARROW, localDigits } from "@/lib/i18n"
import { useReduceMotion, useTheme } from "@/lib/theme"
import { Highlight } from "@/components/shared/Highlight"
import { BlockStrip, IngredientSheet, LabelWords, NumBadge, OutlineButton, PrimaryButton, SectionLabel, StateTag, StatusScrim } from "@/components/check/parts"

type Phase = "reading" | "result" | "offline" | "error"
type Profile = { skinType: string | null; concerns: string[]; country: string | null; overrides: Record<string, IngredientOverride> }

const VERDICT_KEYS: Record<Zone, { pre: string; key: string; post: string; mark: "hiFine" | "hiCaution" | "hiAvoid" }> = {
  GREEN: { pre: "vFinePre", key: "vFineKey", post: "vFinePost", mark: "hiFine" },
  YELLOW: { pre: "vCautionPre", key: "vCautionKey", post: "vCautionPost", mark: "hiCaution" },
  RED: { pre: "vAvoidPre", key: "vAvoidKey", post: "vAvoidPost", mark: "hiAvoid" },
}
const PROMPTED_CHECKS = "skinlens_prompted_save_checks"

/** Labels longer than this open on the flagged ingredients, with the full label one tap away. */
const LONG_LABEL = 15

export function ScanResultScreen() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const { T } = useTheme()
  const reduce = useReduceMotion()
  const params = useLocalSearchParams<{ inci?: string; name?: string; pid?: string }>()
  const inci = (params.inci ?? "").trim()
  const name = (params.name ?? "").trim()

  const [phase, setPhase] = useState<Phase>("reading")
  const [label, setLabel] = useState<AnnotatedLabel | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [readIdx, setReadIdx] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [sheet, setSheet] = useState<LabelItem | null>(null)
  const [view, setView] = useState<"flagged" | "full">("flagged")
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const skipRef = useRef(false)
  // The server's reading, kept so a "fine for me" / "I react to this" re-reads it without refetching.
  const apiRef = useRef<AnalyzeIngredientsResponse | null>(null)
  const { signedIn } = useAccount()
  const [askToSave, setAskToSave] = useState(false)

  // Fetch, then annotate for this person's skin.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const g = await loadGuestData()
      const p = { skinType: g.skinType ?? null, concerns: g.concerns ?? [], country: g.country ?? null, overrides: g.ingredientOverrides, lifeStage: g.lifeStage ?? null }
      if (!cancelled) setProfile(p)
      try {
        const api = await analyzeIngredients(inci)
        if (cancelled) return
        apiRef.current = api
        const read = annotateLabel(api, p)
        setLabel(read)
        track("label_checked", read.verdict ?? "NONE", p.country)
      } catch (e) {
        if (!cancelled) setPhase(e instanceof ApiError ? "error" : "offline")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [inci, attempt])

  /** "Fine for me" / "I react to this" (or null to undo): saved on the phone, and this label re-read with it. */
  async function mark(item: LabelItem, value: IngredientOverride | null) {
    if (!item.key || !apiRef.current || !profile) return
    const g = await loadGuestData()
    const overrides = { ...g.ingredientOverrides }
    if (value) overrides[item.key] = value
    else delete overrides[item.key]
    await updateGuestData({ ingredientOverrides: overrides })
    const p = { ...profile, overrides }
    setProfile(p)
    const read = annotateLabel(apiRef.current, p)
    setLabel(read)
    setSheet(read.items.find((i) => i.key === item.key) ?? null)
  }

  // Read the label one ingredient at a time (at most 1.6 s in all), then show the result.
  useEffect(() => {
    if (!label || phase !== "reading") return
    if (reduce || skipRef.current) {
      setPhase("result")
      return
    }
    const N = label.items.length
    const step = Math.max(40, Math.min(120, 1600 / Math.max(N, 1)))
    let i = 0
    const timer = setInterval(() => {
      i += 1
      setReadIdx(i)
      if (i >= N) {
        clearInterval(timer)
        setTimeout(() => setPhase("result"), 350)
      }
    }, step)
    return () => clearInterval(timer)
  }, [label, phase, reduce])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(id)
  }, [toast])

  const title = name || t("check.yourLabel")
  const placeholderItems = useMemo<LabelItem[]>(() => splitLabel(inci).map((n) => ({ name: n, state: "fine", line: "" })), [inci])

  const profLine = useMemo(() => {
    if (!profile) return ""
    const parts = [
      countryByCode(profile.country)?.name,
      profile.skinType ? t("check.skinOf", { type: t(`onboarding.skinTypes.${profile.skinType}`).toLowerCase() }) : null,
      profile.concerns.map((c) => t(`onboarding.concerns.${c}`).toLowerCase()).join(", ") || null,
    ].filter(Boolean)
    return parts.length ? t("check.basedOn") + parts.join(" · ") : ""
  }, [profile, t])

  const num = (n: number) => localDigits(String(n), i18n.language)

  function verdictText(v: Zone) {
    const k = VERDICT_KEYS[v]
    return `${t(`check.${k.pre}`)}${t(`check.${k.key}`)}${t(`check.${k.post}`)}`
  }

  async function save() {
    if (!label || saved) return
    await saveScan({
      title,
      brand: "",
      flagCount: label.flagged.length,
      coverage: label.coverage,
      score: label.score,
      rawIngredientText: inci,
      verdict: label.verdict,
    })
    setSaved(true)
    setToast(t("check.toastSaved"))
    // Third saved check, not signed in: offer an account once, so they're never lost.
    if (!signedIn && (await getScans()).length >= 3 && !(await AsyncStorage.getItem(PROMPTED_CHECKS).catch(() => "1"))) {
      AsyncStorage.setItem(PROMPTED_CHECKS, "1").catch(() => {})
      setAskToSave(true)
    }
  }

  function share() {
    if (!label) return
    const verdict = label.verdict ? verdictText(label.verdict) : t("check.noVerdict") + "."
    // A link to the check: it previews with the verdict, and whoever opens it gets the reading for
    // their own skin. Products link by id; pasted labels carry their ingredient list.
    const site = (process.env.EXPO_PUBLIC_SITE_URL ?? "https://skinlens.in").replace(/\/+$/, "")
    const url = params.pid
      ? `${site}/c?p=${encodeURIComponent(params.pid)}`
      : `${site}/c?i=${encodeURIComponent(inci.slice(0, 1500))}&n=${encodeURIComponent(title.slice(0, 80))}`
    Share.share({ message: `${t("check.shareText", { verdict, name: title })} ${url}` }).catch(() => {})
  }

  async function reportMissing() {
    if (!label) return
    await Promise.all(label.noData.map((it) => reportUnknownIngredient(it.name, title).catch(() => {})))
    setToast(t("check.reportedThanks"))
  }

  const topBar = (
    <View style={{ flexDirection: "row", alignItems: "center", minHeight: 52, marginHorizontal: -12 }}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t("check.back")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: rubik.regular, fontSize: 24, color: T.ink }}>{BACK_ARROW}</Text>
      </Pressable>
      <Text numberOfLines={1} style={{ flex: 1, textAlign: "center", fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>
        {phase === "result" ? title : ""}
      </Text>
      <Pressable
        onPress={share}
        disabled={phase !== "result"}
        style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, justifyContent: "center", opacity: phase === "result" ? 1 : 0 }}
      >
        <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.ink }}>{t("check.share")}</Text>
      </Pressable>
    </View>
  )

  // ── Reading the label ──
  if (phase === "reading") {
    const items = label?.items ?? placeholderItems
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: 24 }}>
          {topBar}
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={{ marginTop: 8, fontFamily: rubik.light, fontSize: 40, lineHeight: 46, letterSpacing: -1.6, color: T.ink }}>
            {t("check.reading")}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>
            {t("check.readOf", { a: num(Math.min(readIdx, items.length)), b: num(items.length) })}
          </Text>
          <View style={{ marginTop: 22 }}>
            <LabelWords items={items} numbered={false} marked={(i) => !!label && i < readIdx} current={label ? readIdx : 0} />
          </View>
        </ScrollView>
        <StatusScrim />
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12 }}>
          <Pressable
            onPress={() => {
              skipRef.current = true
              if (label) setPhase("result")
            }}
            style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink, textDecorationLine: "underline" }}>{t("check.showNow")}</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ── Offline / failed: never a verdict ──
  if (phase === "offline" || phase === "error" || !label) {
    const off = phase === "offline"
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, paddingHorizontal: 24, paddingTop: insets.top + 4 }}>
        {topBar}
        <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: rubik.light, fontSize: 40, lineHeight: 46, letterSpacing: -1.6, color: T.ink }}>
          {off ? t("check.offT") : t("check.errT")}
        </Text>
        <Text style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 18, lineHeight: 26, color: T.ink }}>{off ? t("check.offBody") : t("check.errBody")}</Text>
        {off && <Text style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("check.offRoutine")}</Text>}
        <View style={{ marginTop: 24 }}>
          <PrimaryButton label={t("check.tryAgain")} onPress={() => {
            setPhase("reading")
            setLabel(null)
            setReadIdx(0)
            setAttempt((a) => a + 1)
          }} />
        </View>
      </View>
    )
  }

  const enter = (ms: number, delay: number) => (reduce ? FadeIn.duration(160) : FadeInUp.duration(ms).delay(delay))
  const ratedLine = t("check.rated", { a: num(label.rated), b: num(label.total) }) + (label.noData.length ? " · " + t("check.noInfoN", { count: label.noData.length }) : "")
  const strip = (
    <View style={{ marginTop: 24 }}>
      <BlockStrip items={label.items} baseDelay={reduce ? 0 : 300} />
      <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Text style={{ fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{ratedLine}</Text>
        <Text style={{ fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t("check.needed")}</Text>
      </View>
    </View>
  )

  // ── Can't judge: too little rated ──
  if (!label.verdict) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }}>
          {topBar}
          {profLine ? <Text style={{ marginTop: 8, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{profLine}</Text> : null}
          <Animated.View entering={enter(460, 60)} style={{ marginTop: 14 }}>
            <SectionLabel>{t("check.noVerdict")}</SectionLabel>
            <Text style={{ marginTop: 8, fontFamily: rubik.semibold, fontSize: 36, lineHeight: 40, letterSpacing: -1.4, color: T.ink }}>{t("check.cantT")}</Text>
            <Text style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 18, lineHeight: 27, color: T.ink }}>
              {t("check.cantBody", { a: num(label.rated), b: num(label.total), c: num(Math.ceil(COVERAGE_THRESHOLD * label.total)) })}
            </Text>
          </Animated.View>
          {strip}
          <View style={{ marginTop: 28, marginBottom: 6 }}>
            <SectionLabel>{t("check.whatRead")}</SectionLabel>
          </View>
          <LabelWords items={label.items} onPress={setSheet} delayFor={(i) => (reduce ? 0 : 500 + Math.min(i, 14) * 60)} />
          <View style={{ marginTop: 24, gap: 10 }}>
            <PrimaryButton label={t("check.fixList")} onPress={() => router.replace({ pathname: "/scan-confirm", params: { inci, name } })} />
            {label.noData.length > 0 && <OutlineButton label={t("check.reportMissing")} onPress={reportMissing} />}
          </View>
        </ScrollView>
        <StatusScrim />
        <IngredientSheet item={sheet} onClose={() => setSheet(null)} onMark={mark} country={profile?.country} />
        <Toast text={toast} bottom={insets.bottom + 16} />
      </View>
    )
  }

  // ── Verdict ──
  const vk = VERDICT_KEYS[label.verdict]
  const notes = [...label.flagged, ...label.noData]
  // The flagged-only view is for long labels with something to point at; otherwise show the whole label.
  const long = label.total > LONG_LABEL && notes.length > 0
  const flaggedView = long && view === "flagged"
  const shown = flaggedView ? label.items.filter((i) => i.num) : label.items
  const pre = t(`check.${vk.pre}`).trim()
  const post = t(`check.${vk.post}`)
  const headStyle = { fontFamily: rubik.semibold, fontSize: 52, lineHeight: 58, letterSpacing: -2.4, color: T.ink }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }}>
        {topBar}
        {profLine ? (
          <Animated.Text entering={reduce ? FadeIn.duration(160) : FadeIn.duration(300)} style={{ marginTop: 8, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>
            {profLine}
          </Animated.Text>
        ) : null}

        <Animated.View
          entering={enter(460, 60)}
          accessible
          accessibilityRole="header"
          accessibilityLabel={verdictText(label.verdict)}
          style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end" }}
        >
          {pre ? <Text style={[headStyle, { marginRight: 14 }]}>{pre}</Text> : null}
          <Highlight on color={T[vk.mark]} thickness={0.42} position={0.86} delay={reduce ? 0 : 500} duration={480} style={headStyle}>
            {t(`check.${vk.key}`)}
          </Highlight>
          {post ? <Text style={headStyle}>{post}</Text> : null}
        </Animated.View>

        {label.summary ? (
          <Animated.Text entering={reduce ? FadeIn.duration(160) : FadeIn.duration(320).delay(380)} style={{ marginTop: 16, fontFamily: rubik.regular, fontSize: 19, lineHeight: 28, color: T.ink }}>
            {label.summary}
          </Animated.Text>
        ) : null}

        {strip}

        {label.lighteningHazard && <HazardCard steps={label.hazard} />}

        <View style={{ marginTop: 30, marginBottom: 4 }}>
          <SectionLabel>{t("check.flaggedT")}</SectionLabel>
        </View>
        {label.flagged.length === 0 && <Text style={{ paddingVertical: 8, fontFamily: rubik.regular, fontSize: 17, color: T.ink }}>{t("check.nothingFlagged")}</Text>}
        {notes.map((it, i) => (
          <Animated.View key={`${it.name}-${i}`} entering={enter(300, 900 + i * 70)}>
            <Pressable
              onPress={() => setSheet(it)}
              style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.line }}
            >
              {it.num ? <NumBadge n={it.num} /> : null}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontFamily: rubik.semibold, fontSize: 17, color: T.ink, writingDirection: "auto" }}>{it.name}</Text>
                  <StateTag state={it.state} />
                </View>
                <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 15, lineHeight: 22, color: T.ink2 }}>{it.line}</Text>
                {it.next ? <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 15, lineHeight: 22, color: T.ink }}>{it.next}</Text> : null}
                {it.bannedIn?.length ? (
                  <Text style={{ marginTop: 4, fontFamily: rubik.medium, fontSize: 14, lineHeight: 20, color: T.ink2 }}>
                    {t("check.bannedShort", { list: it.bannedIn.map((r) => t(`check.regionShort.${r}`)).join(", ") })}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <View style={{ marginTop: 30, marginBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <SectionLabel>{t("check.theLabel")}</SectionLabel>
          {long && (
            <View style={{ flexDirection: "row", gap: 4, padding: 3, borderRadius: 16, backgroundColor: T.line, flexGrow: 1, maxWidth: 240 }}>
              {(["flagged", "full"] as const).map((v) => {
                const on = view === v
                return (
                  <Pressable
                    key={v}
                    onPress={() => setView(v)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    style={{ flex: 1, minHeight: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: on ? T.bg : "transparent" }}
                  >
                    <Text style={{ fontFamily: on ? rubik.semibold : rubik.regular, fontSize: 14, color: T.ink }}>{v === "flagged" ? t("check.flaggedOnly") : t("check.fullLabel")}</Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>
        <LabelWords
          key={view}
          items={shown}
          onPress={setSheet}
          delayFor={(i) => (reduce ? 0 : 500 + Math.min(i, 14) * 60)}
          trailing={flaggedView ? t("check.moreFine", { count: label.items.filter((i) => !i.num).length }) : undefined}
        />

        <View style={{ marginTop: 22, flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <OutlineButton flex label={saved ? t("check.saved") : t("check.save")} onPress={save} />
          {label.verdict !== "RED" && <OutlineButton flex label={t("check.addRoutine")} onPress={() => router.push({ pathname: "/add-step", params: name ? { name } : {} })} />}
        </View>
      </ScrollView>
      <StatusScrim />
      <IngredientSheet item={sheet} onClose={() => setSheet(null)} onMark={mark} country={profile?.country} />
      <Toast text={toast} bottom={insets.bottom + 16} />
      {askToSave && (
        <Animated.View
          entering={reduce ? FadeIn.duration(160) : FadeInUp.duration(300)}
          style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 16, padding: 18, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.line }}
        >
          <Text style={{ fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink }}>{t("acct.reasonChecks")}</Text>
          <View style={{ marginTop: 12, flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={t("acct.saveCta")}
                onPress={() => {
                  setAskToSave(false)
                  router.push({ pathname: "/login", params: { reason: "checks" } })
                }}
              />
            </View>
            <Pressable onPress={() => setAskToSave(false)} style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: "center" }}>
              <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: T.ink2 }}>{t("acct.notNow")}</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  )
}

function Toast({ text, bottom }: { text: string | null; bottom: number }) {
  const { T } = useTheme()
  if (!text) return null
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      accessibilityLiveRegion="polite"
      style={{ position: "absolute", left: 24, right: 24, bottom, padding: 14, borderRadius: 14, backgroundColor: T.btn }}
    >
      <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.btnInk, textAlign: "center" }}>{text}</Text>
    </Animated.View>
  )
}

/** What to do when a label has a drug or toxic metal from illegal lightening creams. Calm, practical. */
function HazardCard({ steps }: { steps: HazardStep[] }) {
  const { t } = useTranslation()
  const { T } = useTheme()
  return (
    <View style={{ marginTop: 24, padding: 18, borderRadius: 18, backgroundColor: T.surface, borderStartWidth: 3, borderStartColor: T.tAvoid }}>
      <Text accessibilityRole="header" style={{ fontFamily: rubik.semibold, fontSize: 18, color: T.ink }}>
        {t("check.hazardT")}
      </Text>
      {steps.map((k) => (
        <View key={k} style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
          <Text style={{ fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink2 }}>•</Text>
          <Text style={{ flex: 1, fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink }}>{t(`check.hz.${k}`)}</Text>
        </View>
      ))}
      <Text style={{ marginTop: 12, fontFamily: rubik.regular, fontSize: 13, color: T.ink2 }}>{t("check.hazardNote")}</Text>
    </View>
  )
}
