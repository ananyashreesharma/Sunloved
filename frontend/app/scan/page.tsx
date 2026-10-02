import { OumaScanClient } from "@/components/ouma/OumaScanClient"

export default function PublicScanPage() {
  return (
    <OumaScanClient
      topBarVariant="public"
      resultBasePath="/scan/result"
      catalogHref="/discover"
      showRecentScans={false}
      loginHref="/login"
    />
  )
}

