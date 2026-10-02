// V3 theme: paper and ink by day, warm dark by night. The routine's Morning/Night switch flips the
// whole app (see app-chrome-context), so every restyled screen reads its colours from here.

import { useReducedMotion } from "react-native-reanimated"
import { Easing } from "react-native-reanimated"
import { motion, palettes, type Palette } from "@skinlens/shared"
import { useAppChrome } from "@/lib/app-chrome-context"

export function useTheme(): { T: Palette; night: boolean } {
  const { night } = useAppChrome()
  return { T: night ? palettes.night : palettes.day, night }
}

/** True when the phone's "reduce motion" setting is on: use a 160 ms fade or an instant change. */
export function useReduceMotion(): boolean {
  return useReducedMotion()
}

export const ease = {
  settle: Easing.bezier(...motion.easing.settle),
  standard: Easing.bezier(...motion.easing.standard),
}
