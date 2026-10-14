// Building blocks of the V3 label check: state tags, numbered badges, the block strip (one block per
// ingredient in label order, with the 70% line) and the annotated label itself, where every
// ingredient carries its mark. Shared by the reading animation, the result and "can't judge".

import { useEffect } from "react"
import { Modal, Platform, Pressable, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { COVERAGE_THRESHOLD, labelDirection, regionCovers, type BanRegion, type IngredientOverride, type ItemState, type LabelItem, type Palette } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { Highlight } from "@/components/shared/Highlight"
import { SoftPressable } from "@/components/shared/SoftPressable"
import { ease, useReduceMotion, useTheme } from "@/lib/theme"
import { localDigits } from "@/lib/i18n"

/** Highlighter colour per state; null = no highlighter (fine gets an underline, none a dashed one). */
export function markColor(state: ItemState, T: Palette): string | null {
  if (state === "caution") return T.hiCaution
  if (state === "nfy") return T.hiNfy
  if (state === "avoid") return T.hiAvoid
  return null
}

const TAG_KEY: Record<ItemState, string> = { caution: "tagCaution", nfy: "tagNfy", avoid: "tagAvoid", fine: "tagFine", none: "tagNone" }

export function StateTag({ state, label }: { state: ItemState; label?: string }) {
  const { t } = useTranslation()
  const { T } = useTheme()
  const bg = state === "fine" ? T.hiFine : markColor(state, T)
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 4,
        ...(bg ? { backgroundColor: bg } : { borderWidth: 1, borderStyle: "dashed", borderColor: T.ink2 }),
      }}
    >
      <Text style={{ fontFamily: rubik.semibold, fontSize: 12, color: bg ? T.ink : T.ink2 }}>{label ?? t(`check.${TAG_KEY[state]}`)}</Text>
    </View>
  )
}

export function NumBadge({ n, size = 28 }: { n: number; size?: number }) {
  const { i18n } = useTranslation()
  const { T } = useTheme()
  return (
    <View style={{ minWidth: size, height: size, borderRadius: size / 2, paddingHorizontal: size / 5, backgroundColor: T.ink, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: rubik.bold, fontSize: size * 0.5, lineHeight: size * 0.62, color: T.bg }}>{localDigits(String(n), i18n.language)}</Text>
    </View>
  )
}

function Block({ state, delay, small, T }: { state: ItemState; delay: number; small: boolean; T: Palette }) {
  const reduce = useReduceMotion()
  const grow = useSharedValue(reduce ? 1 : 0)
  useEffect(() => {
    if (!reduce) grow.value = withDelay(delay, withTiming(1, { duration: 260, easing: ease.settle }))
  }, [delay, reduce, grow])
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: grow.value }] }))
  return (
    <Animated.View
      style={[
        { flex: 1, minWidth: 0, height: 28, borderRadius: small ? 2 : 4, transformOrigin: "bottom" },
        state === "none" ? { borderWidth: 1.5, borderStyle: "dashed", borderColor: T.ink } : { backgroundColor: T.ink },
        style,
      ]}
    />
  )
}

/**
 * One block per ingredient, in label order: solid = rated, dashed = no information. Flagged
 * ingredients get their footnote number above; the line marks the 70% we need for a verdict.
 */
export function BlockStrip({ items, baseDelay = 300 }: { items: LabelItem[]; baseDelay?: number }) {
  const { i18n } = useTranslation()
  const { T } = useTheme()
  const N = items.length
  const step = Math.min(50, 700 / Math.max(N, 1))
  // Label order follows the label's own script: INCI lists left to right, Arabic ones right to left.
  const dir = labelDirection(items.map((i) => i.name))
  return (
    <View style={{ direction: dir }}>
      <View style={{ height: 16, marginBottom: 4 }}>
        {items.map((it, i) =>
          it.num && it.state !== "none" ? (
            <Text
              key={i}
              style={{ position: "absolute", top: 0, start: `${((i + 0.5) / N) * 100}%`, width: 16, marginStart: -8, textAlign: "center", fontFamily: rubik.bold, fontSize: 11, lineHeight: 13, color: T.ink }}
            >
              {localDigits(String(it.num), i18n.language)}
            </Text>
          ) : null,
        )}
      </View>
      <View>
        <View style={{ flexDirection: "row", gap: 2, alignItems: "flex-end" }}>
          {items.map((it, i) => (
            <Block key={i} state={it.state} delay={baseDelay + i * step} small={N > 20} T={T} />
          ))}
        </View>
        <View style={{ position: "absolute", start: `${COVERAGE_THRESHOLD * 100}%`, top: -6, bottom: -6, width: 2, backgroundColor: T.ink, opacity: 0.5 }} />
      </View>
    </View>
  )
}

/**
 * The label as printed, each ingredient marked by state. `marked(i)` decides whether a word's mark is
 * showing (the reading animation turns them on one by one); `delayFor(i)` staggers the sweep.
 */
export function LabelWords({
  items,
  marked = () => true,
  delayFor = () => 0,
  current = -1,
  onPress,
  numbered = true,
  trailing,
}: {
  items: LabelItem[]
  marked?: (i: number) => boolean
  delayFor?: (i: number) => number
  /** Index of the word being read right now (gets a soft box). */
  current?: number
  onPress?: (item: LabelItem) => void
  numbered?: boolean
  trailing?: string
}) {
  const { T } = useTheme()
  const textStyle = { fontFamily: rubik.light, fontSize: 21, lineHeight: 40, color: T.ink }
  const dir = labelDirection(items.map((i) => i.name))
  const comma = dir === "rtl" ? "،" : ","
  return (
    <View style={{ direction: dir, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
      {items.map((it, i) => {
        const on = marked(i)
        const pending = !on && i > current && current >= 0
        const color = markColor(it.state, T)
        const sep = i < items.length - 1 ? comma : trailing ? "" : "."
        const word =
          it.state === "none" ? (
            <View>
              {/* Dashed underline: same baseline as the other words, drawn under the text. */}
              {on && <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 36, borderBottomWidth: 1.5, borderStyle: "dashed", borderColor: T.ink2 }} />}
              <Text style={[textStyle, { color: pending ? T.ink3 : T.ink }]}>{it.name}</Text>
            </View>
          ) : (
            <Highlight
              on={on}
              color={color ?? T.hiFine}
              thickness={color ? 0.42 : 0.05}
              position={color ? 0.8 : 0.84}
              delay={delayFor(i)}
              duration={color ? 480 : 380}
              style={[textStyle, pending && { color: T.ink3 }, i === current && { backgroundColor: T.line }]}
            >
              {it.name}
            </Highlight>
          )
        return (
          <Pressable
            key={i}
            disabled={!onPress}
            onPress={() => onPress?.(it)}
            accessibilityRole={onPress ? "button" : undefined}
            style={{ flexDirection: "row", alignItems: "flex-start", maxWidth: "100%", marginEnd: 6 }}
          >
            {word}
            {numbered && it.num ? (
              <View style={{ marginStart: 3, marginTop: 4 }}>
                <NumBadge n={it.num} size={17} />
              </View>
            ) : null}
            <Text style={[textStyle, { color: T.ink2 }]}>{sep}</Text>
          </Pressable>
        )
      })}
      {trailing ? <Text style={{ fontFamily: rubik.regular, fontSize: 16, lineHeight: 40, color: T.ink2 }}>{trailing}</Text> : null}
    </View>
  )
}

/** Tapping an ingredient: what it means for you, and in general when that differs. */
export function IngredientSheet({ item, onClose, onMark, country }: { item: LabelItem | null; onClose: () => void; onMark?: (item: LabelItem, value: IngredientOverride | null) => void; country?: string | null }) {
  const { t } = useTranslation()
  const { T } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel={t("check.close")} onPress={onClose} style={{ flex: 1, backgroundColor: T.scrim }} />
      {item && (
        <View style={{ backgroundColor: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 20 }}>
          <View style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: T.line, marginBottom: 18 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {item.num ? <NumBadge n={item.num} /> : null}
            <Text style={{ fontFamily: rubik.semibold, fontSize: 24, letterSpacing: -0.4, color: T.ink, flexShrink: 1 }}>{item.name}</Text>
          </View>
          <View style={{ marginTop: 10, flexDirection: "row" }}>
            <StateTag state={item.state} />
          </View>
          {item.state === "none" ? (
            <Text style={{ marginTop: 16, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink }}>{t("check.noDataLong")}</Text>
          ) : (
            <>
              {/* "For you" only when the note is about this person's skin; otherwise it's the general note. */}
              {item.general ? (
                <Text style={{ marginTop: 18, fontFamily: rubik.semibold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.ink2 }}>
                  {t("check.forYou")}
                </Text>
              ) : null}
              <Text style={{ marginTop: item.general ? 4 : 16, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink }}>{item.line}</Text>
              {item.general && item.general !== item.line ? (
                <>
                  <Text style={{ marginTop: 16, fontFamily: rubik.semibold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.ink2 }}>
                    {t("check.inGeneral")}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 16, lineHeight: 23, color: T.ink2 }}>{item.general}</Text>
                </>
              ) : null}
            </>
          )}
          {item.next ? (
            <>
              <Text style={{ marginTop: 16, fontFamily: rubik.semibold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.ink2 }}>{t("check.whatToDo")}</Text>
              <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink }}>{item.next}</Text>
            </>
          ) : null}
          {/* Where it's banned, whatever the reader's country: the strictest rule anywhere is worth knowing. */}
          {item.bannedIn?.length ? (
            <>
              <Text style={{ marginTop: 16, fontFamily: rubik.semibold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.ink2 }}>{t("check.bannedT")}</Text>
              <Text style={{ marginTop: 4, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: T.ink }}>
                {item.bannedIn.map((r) => t(`check.region.${r}`)).join(" · ")}
              </Text>
              {item.bannedIn.some((r) => regionCovers(r as BanRegion, country)) ? (
                <Text style={{ marginTop: 2, fontFamily: rubik.semibold, fontSize: 15, color: T.tAvoid }}>{t("check.bannedYours")}</Text>
              ) : null}
            </>
          ) : null}
          {item.source ? <Text style={{ marginTop: 16, fontFamily: rubik.regular, fontSize: 13, lineHeight: 19, color: T.ink2 }}>{item.source}</Text> : null}
          {/* The person's own experience of this ingredient. Not offered for avoid (bans and drugs aren't preferences) or no-data items. */}
          {onMark && item.key && item.state !== "avoid" && item.state !== "none" ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontFamily: rubik.semibold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.ink2 }}>{t("check.yourSkin")}</Text>
              <View style={{ marginTop: 8, flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {(
                  [
                    ["fine", t("check.fineForMe")],
                    ["react", t("check.iReact")],
                  ] as const
                ).map(([v, label]) => {
                  const on = item.mine === v
                  return (
                    <Pressable
                      key={v}
                      onPress={() => onMark(item, on ? null : v)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: on ? T.ink : T.line, backgroundColor: on ? T.ink : "transparent", justifyContent: "center" }}
                    >
                      <Text style={{ fontFamily: rubik.regular, fontSize: 15, color: on ? T.bg : T.ink }}>{label}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <Text style={{ marginTop: 8, fontFamily: rubik.regular, fontSize: 13, lineHeight: 18, color: T.ink2 }}>{t("check.markHint")}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={onClose}
            style={{ marginTop: 24, minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: T.line, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontFamily: rubik.medium, fontSize: 16, color: T.ink }}>{t("check.close")}</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  )
}

/** Small caps section heading used across the check screens. */
export function SectionLabel({ children }: { children: string }) {
  const { T } = useTheme()
  return <Text style={{ fontFamily: rubik.semibold, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: T.ink }}>{children}</Text>
}

/** Full-width primary button (pill on Android, rounded rectangle on iOS). */
export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { T } = useTheme()
  return (
    <SoftPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{
        minHeight: 56,
        borderRadius: Platform.OS === "android" ? 28 : 16,
        backgroundColor: T.btn,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={{ fontFamily: rubik.semibold, fontSize: 17, color: T.btnInk }}>{label}</Text>
    </SoftPressable>
  )
}

export function OutlineButton({ label, onPress, flex }: { label: string; onPress: () => void; flex?: boolean }) {
  const { T } = useTheme()
  return (
    <SoftPressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flex: flex ? 1 : undefined,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: T.line,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ fontFamily: rubik.medium, fontSize: 15, color: T.ink }}>{label}</Text>
    </SoftPressable>
  )
}

/** Paper behind the status bar, so scrolled content doesn't run under the clock. */
export function StatusScrim({ color }: { color?: string }) {
  const { T } = useTheme()
  const insets = useSafeAreaInsets()
  return <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top, backgroundColor: color ?? T.bg }} />
}
