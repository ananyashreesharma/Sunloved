// Tonight's moon and the morning sunrise: the routine's progress, drawn. The moon's shadow slides
// off one share per active step (rest nights don't count); the sun rises from behind the horizon.
// Always paired with "2 of 4 done" text (passed in as the accessibility label) so the shape is never
// the only signal.

import { useEffect } from "react"
import { View } from "react-native"
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { celestial, motion } from "@skinlens/shared"
import { ease, useReduceMotion, useTheme } from "@/lib/theme"

const SIZE = 128

/** progress 0–1 (done / active steps). */
export function Moon({ progress, label }: { progress: number; label: string }) {
  const { T } = useTheme()
  const reduce = useReduceMotion()
  const complete = progress >= 1
  const shift = useSharedValue(progress * (SIZE + 8))
  const glow = useSharedValue(complete ? 1 : 0)

  useEffect(() => {
    const to = progress * (SIZE + 8)
    shift.value = reduce ? to : withTiming(to, { duration: motion.ms.moon, easing: ease.settle })
    glow.value = reduce ? (complete ? 1 : 0) : withDelay(300, withTiming(complete ? 1 : 0, { duration: motion.ms.moonGlow }))
  }, [progress, complete, reduce, shift, glow])

  const shadowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }))
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }))

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: SIZE, height: SIZE }}>
      {/* Bloom behind the full moon */}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -48, top: -48, width: SIZE + 96, height: SIZE + 96 }, glowStyle]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
              <Stop offset="55%" stopColor="#FFE8C4" stopOpacity={0.28} />
              <Stop offset="100%" stopColor="#FFE8C4" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#bloom)" />
        </Svg>
      </Animated.View>

      <View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: "hidden" }}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="moon" cx="38%" cy="32%" r="75%">
              <Stop offset="0%" stopColor={celestial.moonLight[0]} />
              <Stop offset="55%" stopColor={celestial.moonLight[1]} />
              <Stop offset="100%" stopColor={celestial.moonLight[2]} />
            </RadialGradient>
          </Defs>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#moon)" />
        </Svg>
        <Animated.View
          style={[
            { position: "absolute", left: -2, top: -2, width: SIZE + 4, height: SIZE + 4, borderRadius: (SIZE + 4) / 2, backgroundColor: T.moonShadow },
            shadowStyle,
          ]}
        />
      </View>
      {/* Faint rim so the new moon (0 done) still reads as a moon, not an empty hole. */}
      <View pointerEvents="none" style={{ position: "absolute", inset: 0, borderRadius: SIZE / 2, borderWidth: 1, borderColor: T.line }} />

      {complete && <Stars />}
    </View>
  )
}

function Star({ style, delay, size }: { style: object; delay: number; size: number }) {
  const reduce = useReduceMotion()
  const o = useSharedValue(reduce ? 1 : 0.15)
  useEffect(() => {
    if (reduce) return
    o.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: motion.ms.twinkle / 2 }), withTiming(0.15, { duration: motion.ms.twinkle / 2 })), -1),
    )
  }, [reduce, delay, o])
  const s = useAnimatedStyle(() => ({ opacity: o.value }))
  return <Animated.View style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: celestial.star }, style, s]} />
}

function Stars() {
  return (
    <>
      <Star style={{ top: -6, left: -14 }} delay={400} size={4} />
      <Star style={{ top: 24, right: -16 }} delay={1200} size={3} />
      <Star style={{ bottom: -4, left: 6 }} delay={2000} size={3} />
    </>
  )
}

/** Morning: the sun rises one share per step from behind the horizon. */
export function Sunrise({ progress, label }: { progress: number; label: string }) {
  const { T } = useTheme()
  const reduce = useReduceMotion()
  const y = useSharedValue((1 - progress) * 62)
  useEffect(() => {
    const to = (1 - progress) * 62
    y.value = reduce ? to : withTiming(to, { duration: motion.ms.moon, easing: ease.settle })
  }, [progress, reduce, y])
  const sun = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: "hidden", borderWidth: 1, borderColor: T.line }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={celestial.dawnSky[0]} />
            <Stop offset="70%" stopColor={celestial.dawnSky[1]} />
            <Stop offset="100%" stopColor={celestial.dawnSky[2]} />
          </LinearGradient>
        </Defs>
        <Rect width={SIZE} height={SIZE} fill="url(#sky)" />
      </Svg>
      <Animated.View style={[{ position: "absolute", left: 32, top: 32, width: 64, height: 64 }, sun]}>
        <Svg width={64} height={64}>
          <Defs>
            <RadialGradient id="sun" cx="40%" cy="35%" r="70%">
              <Stop offset="0%" stopColor={celestial.sunLight[0]} />
              <Stop offset="60%" stopColor={celestial.sunLight[1]} />
              <Stop offset="100%" stopColor={celestial.sunLight[2]} />
            </RadialGradient>
          </Defs>
          <Circle cx={32} cy={32} r={32} fill="url(#sun)" />
        </Svg>
      </Animated.View>
      {/* Horizon */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 30, backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.line }} />
    </View>
  )
}
