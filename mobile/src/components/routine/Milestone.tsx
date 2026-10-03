// Milestone celebration: a full-screen night sky when the streak reaches 7, 30 or 100. A week is
// seven moons waxing, a month is a whole lunar cycle, a hundred nights is a hundred small moons.
// Shown once per milestone (see milestonesSeen); also opened from Streak history.

import { Modal, Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import Animated, { FadeIn, FadeInUp, ZoomIn } from "react-native-reanimated"
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg"
import { celestial, palettes } from "@skinlens/shared"
import { rubik } from "@/constants/fonts"
import { localDigits } from "@/lib/i18n"
import { useReduceMotion } from "@/lib/theme"

const N = palettes.night

/** One small moon; `lit` 0 = new moon, 1 = full. */
function SmallMoon({ size, lit, delay, id }: { size: number; lit: number; delay: number; id: string }) {
  const reduce = useReduceMotion()
  // The shadow is a same-size disc slid sideways: fully over the moon at 0, fully off at 1.
  const offset = lit * size * 1.1
  return (
    <Animated.View entering={reduce ? FadeIn.duration(160) : ZoomIn.duration(260).delay(delay)} style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="38%" cy="32%" r="70%">
            <Stop offset="0" stopColor={celestial.moonLight[0]} />
            <Stop offset="0.55" stopColor={celestial.moonLight[1]} />
            <Stop offset="1" stopColor={celestial.moonLight[2]} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
      <View style={{ position: "absolute", top: -1, bottom: -1, left: offset - 1, width: size + 2, borderRadius: size / 2 + 1, backgroundColor: N.moonShadow }} />
    </Animated.View>
  )
}

export function MilestoneOverlay({ milestone, onClose }: { milestone: number | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const reduce = useReduceMotion()
  const n = milestone ?? 0
  const textDelay = n === 100 ? 1500 : 1000

  let sky: React.ReactNode = null
  if (n === 7) {
    sky = Array.from({ length: 7 }, (_, i) => <SmallMoon key={i} id={`m7-${i}`} size={34} lit={(i + 1) / 7} delay={400 + i * 110} />)
  } else if (n === 30) {
    // A lunar cycle: waxing to full at the middle, then waning.
    sky = Array.from({ length: 30 }, (_, i) => {
      const c = i / 29
      return <SmallMoon key={i} id={`m30-${i}`} size={22} lit={c <= 0.5 ? c * 2 : (1 - c) * 2} delay={300 + i * 35} />
    })
  } else if (n === 100) {
    sky = Array.from({ length: 100 }, (_, i) => (
      <Animated.View
        key={i}
        entering={reduce ? FadeIn.duration(160) : ZoomIn.duration(200).delay(300 + i * 12)}
        style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: N.ink }}
      />
    ))
  }

  return (
    <Modal visible={!!milestone} animationType="fade" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: N.bg, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 28, paddingHorizontal: 28 }}>
        {/* Soft glow behind the moons. */}
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "70%" }}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="msGlow" cx="50%" cy="35%" r="70%">
                <Stop offset="0" stopColor={N.surface} stopOpacity="1" />
                <Stop offset="1" stopColor={N.bg} stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#msGlow)" />
          </Svg>
        </View>

        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{ direction: "ltr", flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", alignSelf: "center", maxWidth: n === 100 ? 14 * 10 + 10 * 9 : 320 }}
        >
          {sky}
        </View>

        <View style={{ flex: 1 }} />
        <Animated.Text
          entering={reduce ? FadeIn.duration(160) : FadeInUp.duration(500).delay(150)}
          style={{ fontFamily: rubik.light, fontSize: 128, lineHeight: 124, letterSpacing: -7, color: N.ink }}
        >
          {localDigits(String(n), i18n.language)}
        </Animated.Text>
        <Animated.Text
          entering={reduce ? FadeIn.duration(160) : FadeIn.duration(400).delay(textDelay)}
          accessibilityRole="header"
          style={{ marginTop: 12, fontFamily: rubik.semibold, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: N.ink }}
        >
          {n ? t(`history.ms${n}Title`) : ""}
        </Animated.Text>
        <Animated.Text
          entering={reduce ? FadeIn.duration(160) : FadeIn.duration(400).delay(textDelay)}
          style={{ marginTop: 10, fontFamily: rubik.regular, fontSize: 17, lineHeight: 25, color: N.ink2 }}
        >
          {n ? t(`history.ms${n}Sub`) : ""}
        </Animated.Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={{ marginTop: 28, minHeight: 56, borderRadius: 16, backgroundColor: N.btn, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: rubik.semibold, fontSize: 17, color: N.btnInk }}>{t("history.goodNight")}</Text>
        </Pressable>
      </View>
    </Modal>
  )
}
