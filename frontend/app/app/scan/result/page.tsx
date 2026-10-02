import { OumaScanResultClient } from "@/components/ouma/OumaScanResultClient"

export default function OumaScanResultPage({
  searchParams,
}: {
  searchParams: { productId?: string; inci?: string }
}) {
  return (
    <OumaScanResultClient productId={searchParams.productId ?? null} inci={searchParams.inci ?? null} />
  )
}
