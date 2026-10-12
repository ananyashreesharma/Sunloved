import type { MetadataRoute } from "next"
import { ingredientIndex, productIndex } from "@/lib/public-data"
import { SITE } from "@/lib/shared-check"

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ingredients, products] = await Promise.all([ingredientIndex(), productIndex()])
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/how-we-rate`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/ingredients`, changeFrequency: "weekly", priority: 0.7 },
    ...(ingredients ?? []).map((i) => ({ url: `${SITE}/ingredients/${i.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...(products ?? []).map((p) => ({ url: `${SITE}/p/${encodeURIComponent(p.id)}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
  ]
}
