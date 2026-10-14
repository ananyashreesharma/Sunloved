import { StreakHistoryScreen } from "@/components/routine/StreakHistoryScreen"

// Ported from frontend/components/ouma/app/OumaStreakHistoryClient.tsx. Root stack level (not a
// tab) for native swipe-back, same reasoning as add-step.tsx/products.tsx.
export default function HistoryRoute() {
  return <StreakHistoryScreen />
}
