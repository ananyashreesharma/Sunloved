import { OumaSwapDetailClient } from "@/components/ouma/app/OumaSwapDetailClient"

export default function OumaSwapDetailPage({ params }: { params: { productId: string } }) {
  return <OumaSwapDetailClient productId={params.productId} />
}
