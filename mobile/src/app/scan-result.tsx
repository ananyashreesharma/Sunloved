import { ScanResultScreen } from "@/components/scan/ScanResultScreen"

// Ported from frontend/components/ouma/OumaScanResultClient.tsx. Root stack level (not a tab) for
// native swipe-back, same reasoning as add-step.tsx/products.tsx.
export default function ScanResultRoute() {
  return <ScanResultScreen />
}
