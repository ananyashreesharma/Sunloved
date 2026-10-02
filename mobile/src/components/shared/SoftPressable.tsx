// A drop-in replacement for RN's Pressable that adds the one thing missing from every Pressable in
// this app so far: felt press feedback. None of them had a pressed-state style, so every tap — the
// guest CTA, Continue buttons, chips, tab toggles — went straight from idle to onPress with nothing
// in between, which reads as abrupt/unresponsive even though the app is working correctly. This
// wraps children in a spring-animated scale-down on press-in, spring-back on release — same
// Animated.spring pattern RoutineHome's StepCheckbox already uses elsewhere in this codebase.
//
// Scale only, deliberately not opacity: a lot of call sites already put a static `opacity` in their
// own style for disabled-state dimming (e.g. Login's send-code button, AddStep's submit button) —
// animating opacity here too would land in the same style array and silently fight/override that
// intentional value instead of combining with it.
//
// Built on Animated.createAnimatedComponent(Pressable) — a single animatable component, not
// Pressable wrapping a separate Animated.View — specifically so the caller's style (flex, width,
// padding, background) lands on the SAME element that gets sized by its parent's layout. An earlier
// version put style on an inner wrapper and left the outer Pressable unstyled, which silently broke
// every `flex: 1` tab/segmented-control row using it (each Pressable collapsed to content width
// instead of sharing the row) — caught via a real screenshot, not assumed away.
import { useRef } from "react"
import { Animated, Pressable, type PressableProps } from "react-native"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function SoftPressable({ children, style, disabled, onPressIn, onPressOut, scaleTo = 0.96, ...rest }: PressableProps & { scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current

  function pressIn(e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) {
    if (!disabled) {
      Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, friction: 9, tension: 300 }).start()
    }
    onPressIn?.(e)
  }

  function pressOut(e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 300 }).start()
    onPressOut?.(e)
  }

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[style as object, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  )
}
