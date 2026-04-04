import { getProduct } from "@/lib/api"
import { SwapDetailClient } from "@/components/swap/SwapDetailClient"

export default async function SwapProductPage({ params }: { params: { id: string } }) {
  let initialProduct: unknown | null = null
  try {
        const result = await getProduct(params.id)
    if (result && typeof result === "object") {
      const raw = result as Record<string, unknown>
      initialProduct = {
        ...raw,
        ingredients: raw.actives || raw.ingredients || [],
      }
    } else {
      initialProduct = result
    }
  } catch {
    initialProduct = null
  }

  return <SwapDetailClient id={params.id} initialProduct={initialProduct} />
}
