// Bottom navigation, V3 design: Routine (crescent moon), Check (lens), Me. iOS gets a hairline bar;
// Android a Material 3 bar with a pill behind the active icon. Follows the day/night palette.

import { Platform, Pressable, Text, View } from "react-native"
import type { BottomTabBarProps } from "expo-router/js-tabs"
import { rubik } from "@/constants/fonts"
import { useTheme } from "@/lib/theme"

function TabIcon({ name, color }: { name: string; color: string }) {
  if (name === "scan") {
    return (
      <View style={{ width: 20, height: 20 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: color }} />
        <View style={{ position: "absolute", left: 12, top: 12, width: 7, height: 2, borderRadius: 1, backgroundColor: color, transform: [{ rotate: "45deg" }] }} />
      </View>
    )
  }
  return <View style={{ width: 16, height: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: color }} />
}

export function AppTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { T } = useTheme()
  const android = Platform.OS === "android"
  const barBg = android ? T.surface : T.bg

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: android ? 8 : 10,
        paddingTop: android ? 12 : 6,
        paddingBottom: Math.max(android ? 16 : 10, insets.bottom),
        backgroundColor: barBg,
        borderTopWidth: android ? 0 : 1,
        borderTopColor: T.line,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const label = typeof options.title === "string" ? options.title : route.name
        const focused = state.index === index
        const color = focused ? T.ink : android ? T.ink2 : T.ink3

        function onPress() {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
        }

        // The crescent's cut-out must match the bar behind it.
        const icon = route.name === "routine" ? <CrescentIcon color={color} cut={android && focused ? T.navActive : barBg} barBg={barBg} /> : <TabIcon name={route.name} color={color} />

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={{ flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: android ? 4 : 5 }}
          >
            {android ? (
              <View style={{ width: 64, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: focused ? T.navActive : "transparent" }}>
                {icon}
              </View>
            ) : (
              icon
            )}
            <Text style={{ fontFamily: focused ? rubik.semibold : rubik.regular, fontSize: 12, color: focused ? T.ink : T.ink3 }}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function CrescentIcon({ color, cut, barBg }: { color: string; cut: string; barBg: string }) {
  // On Android the active pill is translucent over the bar, so the cut-out shows bar + pill tint:
  // draw the bar colour first, then the pill tint on top.
  return (
    <View style={{ width: 20, height: 20, transform: [{ rotate: "-20deg" }] }}>
      <View style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: color }} />
      <View style={{ position: "absolute", top: -2, left: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: barBg }} />
      {cut !== barBg && <View style={{ position: "absolute", top: -2, left: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: cut }} />}
    </View>
  )
}
