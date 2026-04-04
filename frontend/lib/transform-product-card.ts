import type { Product } from "@/lib/data"

export function transformApiProductToCard(apiProduct: any): Product {
  const price = apiProduct.currentPrice || apiProduct.pricePerUnit || 0
  const volume = apiProduct.volume || ""
  const ingredients = apiProduct.actives || apiProduct.ingredients || []
  const productName = apiProduct.name || ""
  const brandName = apiProduct.brand || ""

  let description = apiProduct.description || ""

  if (description) {
    if (ingredients.length > 0) {
      description = description.replace(/Full INCI:.*$/i, "").trim()
      description = description.replace(/Ingredients?:.*$/i, "").trim()
      description = description.replace(/[.,;]\s*$/, "").trim()
    }

    if (productName) {
      const nameRegex = new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      description = description.replace(nameRegex, "").trim()
    }

    if (brandName) {
      const brandRegex = new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      description = description.replace(brandRegex, "").trim()
    }

    if (productName && brandName) {
      const combinedPattern1 = new RegExp(
        `${brandName}\\s+${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "gi"
      )
      const combinedPattern2 = new RegExp(
        `${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+by\\s+${brandName}`,
        "gi"
      )
      description = description.replace(combinedPattern1, "").trim()
      description = description.replace(combinedPattern2, "").trim()
    }

    description = description.replace(/\s+/g, " ").trim()
    description = description.replace(/^[.,;:\-\s]+|[.,;:\-\s]+$/g, "").trim()

    if (!description || description.length < 10) {
      description = `A ${apiProduct.category || "skincare"} product by ${brandName}`
    }
  } else {
    description = `A ${apiProduct.category || "skincare"} product by ${brandName}`
  }

  const numPrice = typeof price === "number" ? price : parseFloat(String(price))

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    brand: apiProduct.brand,
    volume,
    originalProduct: apiProduct.originalProduct || apiProduct.name,
    description,
    pricePerUnit: numPrice ? `$${numPrice.toFixed(2)}` : "N/A",
    savings: "Check prices",
    savingsPercent: 0,
    crueltyFree: apiProduct.crueltyFree || false,
    vegan: apiProduct.vegan || false,
    fragranceFree: apiProduct.fragranceFree || false,
    alcoholFree: apiProduct.alcoholFree || false,
    fungalAcneSafe: apiProduct.fungalAcneSafe || false,
    parabenfree: apiProduct.parabenFree || false,
    sulfateFree: apiProduct.sulfateFree || false,
    siliconesFree: apiProduct.siliconesFree || false,
    sourcesCheckedDaysAgo: apiProduct.sourcesCheckedDaysAgo || 30,
    category: "closest-match",
    categoryLabel: (apiProduct.category || "Product").toUpperCase(),
    categoryBadgeColor: "bg-teal-50 text-teal-700",
    imageUrl: apiProduct.imageUrl,
    ingredients,
    prices: apiProduct.prices,
  }
}
