import { OumaScanConfirmClient } from "@/components/ouma/OumaScanConfirmClient"

export default function PublicScanConfirmPage({ searchParams }: { searchParams: { inci?: string } }) {
  return (
    <OumaScanConfirmClient
      inci={searchParams.inci ?? ""}
      backHref="/scan"
      resultBasePath="/scan/result"
    />
  )
}
