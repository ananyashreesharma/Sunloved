// Port of frontend/components/marketing/ValuePropCarousel.tsx (the web "/" guest landing
// carousel) to React Native. Same copy, same 4 pages, same color tokens (src/constants/tokens.ts
// was already extracted from this design system) — laid out with RN primitives instead of DOM/CSS,
// and using @expo-google-fonts in place of next/font/google (src/constants/fonts.ts).

import { useEffect, useRef, useState } from "react"
import { View, Text, Pressable, Animated, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Link } from "expo-router"
import { colors } from "@/constants/tokens"
import { fonts } from "@/constants/fonts"
import { TickIcon, WarningIcon, ListIcon, ScanIcon, QuestionIcon } from "./icons"

const G = "#1D5C3B"
const C = "#7C5410"
const U = "#A9B2A8"

const STRIP_GOOD = [G, G, C, G, G, G, G, G, U, G, G, G, G, G, G, G, G, G, C, G, G, G, U, G]
const STRIP_LOW = [G, U, U, G, U, C, G, U, U, G, U, U, G, G, U, U, G, U, U, G, G, U, U, G]

const INTRO_ROWS = [
  { title: "Build tonight's routine", body: "Type product names. We order them and remind you.", Icon: ListIcon },
  // The web version's carousel says "Photo or paste" here — but its own Photo tab is a decorative
  // viewfinder mockup (the shutter just switches to Paste; see OumaScanClient.tsx), not real camera
  // capture, on web or mobile. Not repeating that promise on the very first screen a stranger sees.
  { title: "Read any label", body: "Paste it in. A plain sentence per ingredient. Photo scanning is coming soon.", Icon: ScanIcon },
  { title: "Say what we don't know", body: "No verdict when we can't read enough of a label.", Icon: QuestionIcon },
] as const

const PROMISES = [
  "Scans are free. We gate nothing that helps you decide.",
  "One reminder per routine, muted in a tap.",
  "No affiliate links, no sponsored verdicts.",
]

const CTA_LABELS = ["See the routine", "See a scan", "One more thing", "Get SkinLens — free"]
const FINEPRINT = [
  "Two features, no funnel. Neither needs the other.",
  "Tap a step — that's the whole interaction at 10pm.",
  "You don't have to own the bottle to read it.",
  "Free to start. No affiliate links, no sponsored verdicts.",
]

const INITIAL_STEPS = [
  { name: "Cleanser", brand: "CeraVe · Foaming", done: true },
  { name: "Serum", brand: "Minimalist · Niacinamide 10%", done: true },
  { name: "Retinol", brand: "d'you · in my defence", done: false },
  { name: "Moisturiser", brand: "Cetaphil · typed, not scanned", done: false },
]

function Strip({ swatches }: { swatches: string[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 2, height: 24, borderRadius: 6, overflow: "hidden" }}>
      {swatches.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  )
}

function Dot({ active, dark, onPress }: { active: boolean; dark: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View
        style={{
          width: active ? 22 : 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: active ? (dark ? colors.night.accent : colors.accent) : dark ? "rgba(231,236,231,.25)" : "rgba(23,33,26,.18)",
        }}
      />
    </Pressable>
  )
}

export function ValuePropCarousel() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [page, setPage] = useState(0)
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const fade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    fade.setValue(0)
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start()
  }, [page, fade])

  const dark = page === 1 || page === 3
  const bg = dark ? colors.night.bg : colors.bone
  const ink = dark ? colors.night.ink : colors.ink
  const mute = dark ? colors.night.mute : colors.mute
  const accent = dark ? colors.night.accent : colors.accent
  const maxWidth = Math.min(width, 430)

  function toggleStep(i: number) {
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, done: !s.done } : s)))
  }

  const doneCount = steps.filter((s) => s.done).length
  const tapHint = doneCount === steps.length ? "Done for tonight. See you at 7:30." : "Tap a step to check it off."

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Link href={{ pathname: "/login", params: { next: "/onboarding" } }} asChild>
        <Pressable
          hitSlop={10}
          style={{ position: "absolute", top: insets.top + 8, right: 22, zIndex: 2 }}
        >
          <Text style={{ fontSize: 12.5, color: mute, fontFamily: fonts.body }}>Skip →</Text>
        </Pressable>
      </Link>

      <View style={{ flex: 1, width: "100%", maxWidth, alignSelf: "center", paddingHorizontal: 22, paddingTop: insets.top + 46 }}>
        <Animated.View style={{ flex: 1, opacity: fade }}>
          {page === 0 && (
            <View style={{ flex: 1 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#E4EBE2",
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 13,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: G }} />
                <Text style={{ fontSize: 12.5, color: "#2A342C", fontFamily: fonts.mono }}>Scans free, always</Text>
              </View>
              <Text
                style={{
                  fontSize: 50,
                  lineHeight: 48,
                  textTransform: "uppercase",
                  marginTop: 18,
                  color: ink,
                  fontFamily: fonts.display,
                  letterSpacing: -1,
                }}
              >
                Skincare that talks to you straight
              </Text>
              <Text style={{ marginTop: 16, fontSize: 16, lineHeight: 25, color: "#2A342C", fontFamily: fonts.body }}>
                Doesn&apos;t scare you. Doesn&apos;t sell to you. Keeps you consistent, and reads any label you point
                it at.
              </Text>
              <View style={{ marginTop: "auto", paddingTop: 24, gap: 9 }}>
                {INTRO_ROWS.map((r) => (
                  <View
                    key={r.title}
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "rgba(23,33,26,.08)",
                      borderRadius: 15,
                      padding: 15,
                      flexDirection: "row",
                      gap: 13,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: "#DFF0E4",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <r.Icon />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15.5, fontWeight: "600", color: ink, fontFamily: fonts.bodySemiBold }}>
                        {r.title}
                      </Text>
                      <Text style={{ fontSize: 13.5, color: "#5A6259", marginTop: 1, fontFamily: fonts.body }}>
                        {r.body}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {page === 1 && (
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 12, letterSpacing: 1.7, textTransform: "uppercase", color: colors.night.mute, fontFamily: fonts.display }}
              >
                The routine · your evening
              </Text>
              <Text
                style={{ fontSize: 36, lineHeight: 36, textTransform: "uppercase", marginTop: 8, color: ink, fontFamily: fonts.display, letterSpacing: -0.7 }}
              >
                Three names is a working routine
              </Text>
              <Text style={{ marginTop: 11, fontSize: 15, lineHeight: 23, color: "#C6D2C7", fontFamily: fonts.body }}>
                Type what you use. We order it, explain why, and remind you once — with tonight&apos;s actual steps.
              </Text>
              <View style={{ marginTop: 16, gap: 8 }}>
                {steps.map((s, i) => (
                  <Pressable
                    key={s.name}
                    onPress={() => toggleStep(i)}
                    style={{
                      backgroundColor: colors.night.card,
                      borderWidth: 1,
                      borderColor: colors.night.line,
                      borderRadius: 14,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 11,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.night.mute, fontFamily: fonts.mono }}>{i + 1}</Text>
                    <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: "#2A362C" }} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: 14.5,
                          fontWeight: "600",
                          color: s.done ? colors.night.mute : colors.night.ink,
                          textDecorationLine: s.done ? "line-through" : "none",
                          fontFamily: fonts.bodySemiBold,
                        }}
                      >
                        {s.name}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: colors.night.mute, fontFamily: fonts.body }}>{s.brand}</Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: s.done ? colors.night.accent : "transparent",
                        borderWidth: 1.5,
                        borderColor: s.done ? colors.night.accent : "rgba(231,236,231,.3)",
                      }}
                    >
                      {s.done && <TickIcon />}
                    </View>
                  </Pressable>
                ))}
              </View>
              <Text style={{ marginTop: 12, fontSize: 13, color: colors.night.mute, textAlign: "center", fontFamily: fonts.body }}>
                {tapHint}
              </Text>
              <View
                style={{
                  marginTop: "auto",
                  marginBottom: 16,
                  backgroundColor: colors.night.card,
                  borderWidth: 1,
                  borderColor: colors.night.line,
                  borderRadius: 15,
                  padding: 15,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      backgroundColor: colors.night.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: "700", color: colors.night.bg, fontFamily: fonts.display }}>SL</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.night.ink, fontFamily: fonts.bodySemiBold }}>
                    SkinLens
                  </Text>
                  <Text style={{ marginLeft: "auto", fontSize: 11, color: colors.night.mute, fontFamily: fonts.mono }}>
                    21:30
                  </Text>
                </View>
                <Text style={{ marginTop: 7, fontSize: 13.5, fontWeight: "600", color: colors.night.ink, fontFamily: fonts.bodySemiBold }}>
                  PM routine · 4 steps
                </Text>
                <Text style={{ fontSize: 13, color: "#C6D2C7", marginTop: 2, fontFamily: fonts.body }}>
                  CeraVe cleanser → Minimalist serum → retinol → Cetaphil
                </Text>
                <Text style={{ fontSize: 13, color: colors.night.mute, marginTop: 4, fontFamily: fonts.bodyItalic }}>
                  &quot;Consistency beats intensity.&quot;
                </Text>
              </View>
              <Text style={{ marginTop: -8, fontSize: 12.5, color: colors.night.mute, textAlign: "center", fontFamily: fonts.body }}>
                Miss a night and the streak pauses. It never breaks.
              </Text>
            </View>
          )}

          {page === 2 && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, letterSpacing: 1.7, textTransform: "uppercase", color: "#5A6259", fontFamily: fonts.display }}>
                The scan · in the aisle
              </Text>
              <Text style={{ fontSize: 36, lineHeight: 36, textTransform: "uppercase", marginTop: 8, color: ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
                Read any label, no camera needed
              </Text>
              <Text style={{ marginTop: 11, fontSize: 15, lineHeight: 23, color: "#2A342C", fontFamily: fonts.body }}>
                Paste the ingredient list from any bottle — you don&apos;t have to own it. You see what we read
                before you see what we think.
              </Text>
              <View style={{ marginTop: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(23,33,26,.08)", borderRadius: 18, padding: 17 }}>
                <View
                  style={{
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingVertical: 7,
                    paddingHorizontal: 13,
                    borderRadius: 999,
                    backgroundColor: colors.zone.yellow.soft,
                  }}
                >
                  <WarningIcon />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.zone.yellow.fg, letterSpacing: 1, fontFamily: fonts.monoSemiBold }}>
                    USE WITH CAUTION
                  </Text>
                </View>
                <View style={{ marginTop: 12 }}>
                  <Strip swatches={STRIP_GOOD} />
                </View>
                <View style={{ marginTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 11.5, color: "#5A6259", fontFamily: fonts.body }}>Label order = concentration order</Text>
                  <Text style={{ fontSize: 11.5, color: "#5A6259", fontFamily: fonts.mono }}>27/29 read</Text>
                </View>
                <View style={{ marginTop: 11, flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
                  {[
                    { label: "fine", color: colors.zone.green.fg },
                    { label: "caution", color: colors.zone.yellow.fg },
                    { label: "not for you", color: colors.zone.red.fg },
                    { label: "no info", color: colors.zone.none },
                  ].map((l) => (
                    <View key={l.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: l.color }} />
                      <Text style={{ fontSize: 11, color: "#5A6259", fontFamily: fonts.body }}>{l.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ marginTop: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(23,33,26,.08)", borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: "600", color: ink, fontFamily: fonts.bodySemiBold }}>Alcohol Denat.</Text>
                  <Text style={{ fontSize: 11, color: "#5A6259", fontFamily: fonts.mono }}>#4</Text>
                </View>
                <Text style={{ marginTop: 4, fontSize: 13.5, color: "#2A342C", fontFamily: fonts.body }}>
                  Solvent — evaporates fast; can dry and sting.
                </Text>
                <Text style={{ marginTop: 3, fontSize: 13.5, color: colors.zone.yellow.fg, fontFamily: fonts.body }}>
                  Fourth on the label is high. On acne-prone skin, expect tightness.
                </Text>
              </View>
              <Text style={{ marginTop: "auto", paddingTop: 16, fontSize: 13, color: "#5A6259", textAlign: "center", fontFamily: fonts.body }}>
                One plain sentence per ingredient. No chemistry lecture, no scare score.
              </Text>
            </View>
          )}

          {page === 3 && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, letterSpacing: 1.7, textTransform: "uppercase", color: colors.night.mute, fontFamily: fonts.display }}>
                Why you can trust the rest
              </Text>
              <Text style={{ fontSize: 36, lineHeight: 36, textTransform: "uppercase", marginTop: 8, color: ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
                We tell you when we don&apos;t know
              </Text>
              <Text style={{ marginTop: 11, fontSize: 15, lineHeight: 23, color: "#C6D2C7", fontFamily: fonts.body }}>
                Most scanners guess. If we can&apos;t read enough of a label, you get no verdict at all — an
                ingredient we missed must never quietly read as safe.
              </Text>
              <View style={{ marginTop: 16, backgroundColor: colors.night.card, borderWidth: 1, borderColor: colors.night.line, borderRadius: 16, padding: 17 }}>
                <Strip swatches={STRIP_LOW} />
                <Text style={{ marginTop: 11, fontSize: 13, color: colors.night.ink, fontFamily: fonts.mono }}>18/31 read · 58%</Text>
                <Text style={{ marginTop: 8, fontSize: 14.5, lineHeight: 21, color: "#C6D2C7", fontFamily: fonts.body }}>
                  We could only read 18 of 31 ingredients — not enough to judge this product. Type in the ones we
                  missed, or paste the full list again.
                </Text>
              </View>
              <View style={{ marginTop: 12, gap: 8 }}>
                {PROMISES.map((p) => (
                  <View key={p} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                    <View
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: 9,
                        backgroundColor: "rgba(92,153,119,.2)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 1,
                      }}
                    >
                      <TickIcon size={10} color={colors.night.accent} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, color: "#C6D2C7", fontFamily: fonts.body }}>{p}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ marginTop: "auto", paddingTop: 16, fontSize: 13, color: colors.night.mute, textAlign: "center", fontFamily: fonts.body }}>
                Every verdict is colour, icon and words — readable if you don&apos;t see red and green.
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: dark ? "rgba(231,236,231,.08)" : "rgba(23,33,26,.08)",
          paddingTop: 14,
          paddingHorizontal: 22,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View style={{ width: "100%", maxWidth, alignSelf: "center" }}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 7, marginBottom: 13 }}>
            {[0, 1, 2, 3].map((i) => (
              <Dot key={i} active={i === page} dark={dark} onPress={() => setPage(i)} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            {page > 0 && (
              <Pressable
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                style={{
                  width: 52,
                  borderWidth: 1.5,
                  borderColor: dark ? "rgba(231,236,231,.25)" : "rgba(23,33,26,.2)",
                  borderRadius: 13,
                  paddingVertical: 15,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: dark ? "#C6D2C7" : "#2A342C" }}>←</Text>
              </Pressable>
            )}
            {page < 3 ? (
              <Pressable
                onPress={() => setPage((p) => Math.min(3, p + 1))}
                style={{ flex: 1, backgroundColor: accent, borderRadius: 13, paddingVertical: 15, alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: dark ? colors.night.bg : colors.bone, fontFamily: fonts.bodySemiBold }}>
                  {CTA_LABELS[page]}
                </Text>
              </Pressable>
            ) : (
              <Link href={{ pathname: "/login", params: { next: "/onboarding" } }} asChild>
                <Pressable style={{ flex: 1, backgroundColor: accent, borderRadius: 13, paddingVertical: 15, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.night.bg, fontFamily: fonts.bodySemiBold }}>
                    {CTA_LABELS[3]}
                  </Text>
                </Pressable>
              </Link>
            )}
          </View>
          <Text style={{ marginTop: 10, textAlign: "center", fontSize: 12.5, color: mute, fontFamily: fonts.body }}>
            {FINEPRINT[page]}
          </Text>
        </View>
      </View>
    </View>
  )
}
