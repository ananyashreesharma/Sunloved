// The V3 signature: a highlighter mark that sweeps behind text, line by line. Used for completed
// routine steps, the "Tonight" headline when the routine is done, verdict keywords and flagged
// ingredients. Measures each rendered line (onTextLayout) so wrapped text gets one mark per line,
// like a real highlighter, and sweeps from the reading start (right in Arabic).

import { useEffect, useState, type ReactNode } from "react"
import { I18nManager, Text, View, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type TextStyle } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated"
import { motion } from "@skinlens/shared"
import { ease, useReduceMotion } from "@/lib/theme"

type Line = { x: number; y: number; width: number; height: number }

export function Highlight({
  children,
  on,
  color,
  style,
  /** Share of the line height the mark covers (design: 55% steps, 38% hero, 58% notes). */
  thickness = 0.55,
  /** Vertical position of the mark within the line, 0 = top, 1 = bottom (design: 85%). */
  position = 0.85,
  duration = motion.ms.tickHighlight,
  delay = 0,
  numberOfLines,
  fit,
}: {
  children: ReactNode
  on: boolean
  color: string
  style?: StyleProp<TextStyle>
  thickness?: number
  position?: number
  duration?: number
  delay?: number
  numberOfLines?: number
  /** Shrink to fit one line instead of wrapping (big display words next to artwork). */
  fit?: boolean
}) {
  const reduce = useReduceMotion()
  const [lines, setLines] = useState<Line[]>([])
  const progress = useSharedValue(on ? 1 : 0)

  useEffect(() => {
    const target = on ? 1 : 0
    progress.value = reduce ? target : withDelay(delay, withTiming(target, { duration, easing: ease.standard }))
  }, [on, reduce, delay, duration, progress])

  const sweep = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }))

  function onTextLayout(e: NativeSyntheticEvent<TextLayoutEventData>) {
    const next = e.nativeEvent.lines.map((l) => ({ x: l.x, y: l.y, width: l.width, height: l.height }))
    // Only re-render when the geometry actually changes (onTextLayout fires on every layout pass).
    if (next.length !== lines.length || next.some((l, i) => l.width !== lines[i].width || l.y !== lines[i].y)) setLines(next)
  }

  return (
    <View>
      {lines.map((l, i) => {
        const h = l.height * thickness
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: l.x,
                top: l.y + (l.height - h) * position,
                width: l.width,
                height: h,
                backgroundColor: color,
                borderRadius: 2,
                transformOrigin: I18nManager.isRTL ? "right" : "left",
              },
              sweep,
            ]}
          />
        )
      })}
      <Text
        style={style}
        onTextLayout={onTextLayout}
        numberOfLines={fit ? 1 : numberOfLines}
        adjustsFontSizeToFit={fit}
        minimumFontScale={fit ? 0.6 : undefined}
      >
        {children}
      </Text>
    </View>
  )
}
