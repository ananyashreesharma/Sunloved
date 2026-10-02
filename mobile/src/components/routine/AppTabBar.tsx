// Port of the mobile bottom nav in frontend/components/ouma/OumaAppShell.tsx (the `<nav>` at the
// bottom of that file) — floating pill with 3 destinations and a raised Scan FAB in the middle.
// expo-router's Tabs takes this as its `tabBar` prop in place of the default React Navigation bar.

import { View, Text, Pressable } from "react-native"
import type { BottomTabBarProps } from "expo-router/js-tabs"
import { fonts } from "@/constants/fonts"
import { useAppChrome } from "@/lib/app-chrome-context"
import { RoutineNavIcon, MeNavIcon, ScanNavIcon } from "./icons"

const ICONS: Record<string, (color: string) => React.ReactNode> = {
  routine: (color) => <RoutineNavIcon color={color} />,
  profile: (color) => <MeNavIcon color={color} />,
}

export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { night } = useAppChrome()
  const pillBg = night ? "#10160F" : "#17211A"
  const ringColor = night ? "#0E1411" : "#F3F5EF"
  const inactive = "rgba(243,245,239,0.5)"

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(16, insets.bottom), paddingTop: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          borderRadius: 999,
          padding: 8,
          backgroundColor: pillBg,
          shadowColor: "#17211A",
          shadowOpacity: 0.28,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label = (options.title ?? route.name) as string
          const focused = state.index === index

          function onPress() {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
          }

          if (route.name === "scan") {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={{ flex: 1, alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 54,
                    height: 54,
                    marginTop: -34,
                    borderRadius: 27,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#1E4D3A",
                    borderWidth: 4,
                    borderColor: ringColor,
                    shadowColor: "#1E4D3A",
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }}
                >
                  <ScanNavIcon />
                </View>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 0.2, color: inactive }}>{label}</Text>
              </Pressable>
            )
          }

          const color = focused ? "#17211A" : inactive
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 4,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: focused ? "#F3F5EF" : "transparent",
              }}
            >
              {ICONS[route.name]?.(color)}
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 0.2, color }}>{label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
