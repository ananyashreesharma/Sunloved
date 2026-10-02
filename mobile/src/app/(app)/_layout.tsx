import { Tabs } from "expo-router/js-tabs"
import { useTranslation } from "react-i18next"
import { AppTabBar } from "@/components/routine/AppTabBar"

// V3 bottom navigation: Routine, Check, Me (see AppTabBar).
export default function AppTabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="routine" options={{ title: t("common.tabRoutine") }} />
      <Tabs.Screen name="scan" options={{ title: t("common.tabCheck") }} />
      <Tabs.Screen name="profile" options={{ title: t("common.tabMe") }} />
    </Tabs>
  )
}
