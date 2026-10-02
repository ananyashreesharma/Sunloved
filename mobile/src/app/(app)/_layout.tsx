import { Tabs } from "expo-router/js-tabs"
import { useTranslation } from "react-i18next"
import { AppTabBar } from "@/components/routine/AppTabBar"

// Custom floating pill tab bar with a raised Scan FAB, matching the mobile nav in
// frontend/components/ouma/OumaAppShell.tsx.
export default function AppTabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="routine" options={{ title: t("common.backRoutine") }} />
      <Tabs.Screen name="scan" options={{ title: t("common.backScan") }} />
      <Tabs.Screen name="profile" options={{ title: t("profile.title") }} />
    </Tabs>
  )
}
