import { ProductsScreen } from "@/components/products/ProductsScreen"

// Ported from frontend/components/ouma/app/OumaProductsClient.tsx. Lives at the root stack level
// (not inside (app)'s Tabs) so it's a real pushed screen with native swipe-back — it's reached from
// Routine, not a tab destination itself, so hiding the tab bar while here matches standard iOS
// push-navigation feel (Settings, Mail, etc. all hide their tab bar on a pushed sub-screen too).
export default function ProductsRoute() {
  return <ProductsScreen />
}
