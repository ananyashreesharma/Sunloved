export function inferCategory(
  name: string,
  description: string,
  ingredients: string[],
  currentCategory: string
): string {
  const nameLower = name.toLowerCase()
  const descLower = (description || "").toLowerCase()
  const ingredientsStr = (ingredients || []).join(" ").toLowerCase()

  if (
    nameLower.includes("cleanser") ||
    nameLower.includes("cleansing") ||
    nameLower.includes("wash")
  ) {
    return "Cleanser"
  }
  if (nameLower.includes("sunscreen") || nameLower.includes("spf")) {
    return "Sunscreen"
  }
  if (nameLower.includes("serum")) return "Serum"
  if (
    nameLower.includes("moisturizer") ||
    nameLower.includes("moisturising") ||
    nameLower.includes("cream")
  ) {
    return "Moisturizer"
  }
  if (nameLower.includes("toner")) return "Toner"
  if (nameLower.includes("exfoliator") || nameLower.includes("exfoliating")) return "Exfoliator"
  if (nameLower.includes("mask")) return "Mask"
  if (nameLower.includes("oil")) return "Oil"

  if (
    ingredientsStr.includes("titanium dioxide") ||
    ingredientsStr.includes("zinc oxide") ||
    ingredientsStr.includes("avobenzone") ||
    ingredientsStr.includes("octinoxate") ||
    ingredientsStr.includes("octocrylene") ||
    ingredientsStr.includes("homosalate")
  ) {
    return "Sunscreen"
  }

  if (
    descLower.includes("sunscreen") ||
    descLower.includes("spf") ||
    descLower.includes("uv protection")
  ) {
    return "Sunscreen"
  }
  if (descLower.includes("cleanser") || descLower.includes("cleansing")) {
    return "Cleanser"
  }

  return currentCategory || "Product"
}

export function normalizeSwapProduct(raw: any) {
  if (!raw) return null
  const p = { ...raw }
  p.ingredients = p.actives || p.ingredients || []
  const inferred = inferCategory(
    p.name || "",
    p.description || "",
    p.ingredients,
    p.category || ""
  )
  if (inferred !== p.category) {
    p.category = inferred
    p.categoryCorrected = true
  }
  p.parabenFree = p.parabenFree ?? p.parabenfree
  p.parabenfree = p.parabenFree ?? false
  return p
}
