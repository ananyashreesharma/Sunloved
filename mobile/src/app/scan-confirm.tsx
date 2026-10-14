import { ScanConfirmScreen } from "@/components/scan/ScanConfirmScreen"

// Ported from frontend/components/ouma/OumaScanConfirmClient.tsx. Root stack level (not a tab) for
// native swipe-back, same reasoning as add-step.tsx/products.tsx.
export default function ScanConfirmRoute() {
  return <ScanConfirmScreen />
}
