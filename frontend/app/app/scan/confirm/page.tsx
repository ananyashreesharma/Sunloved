import { OumaScanConfirmClient } from "@/components/ouma/OumaScanConfirmClient"

export default function OumaScanConfirmPage({ searchParams }: { searchParams: { inci?: string } }) {
  return (
    <OumaScanConfirmClient
      inci={searchParams.inci ?? ""}
      backHref="/app/scan"
      resultBasePath="/app/scan/result"
    />
  )
}
