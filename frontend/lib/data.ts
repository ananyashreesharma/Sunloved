export interface Product {
  id: string
  name: string
  brand: string
  volume: string
  originalProduct: string
  description: string
  pricePerUnit: string
  savings: string
  savingsPercent: number
  crueltyFree: boolean
  vegan: boolean
  fragranceFree: boolean
  alcoholFree?: boolean
  fungalAcneSafe?: boolean
  parabenfree?: boolean
  sulfateFree?: boolean
  siliconesFree?: boolean
  sourcesCheckedDaysAgo: number
  category: "closest-match" | "best-value" | "sensitive-safe"
  categoryLabel: string
  categoryBadgeColor: string
  imageUrl?: string
  ingredients?: string[]
  prices?: {
    amazon?: { price: string; url: string }
    sephora?: { price: string; url: string }
    ulta?: { price: string; url: string }
  }
}

export const dummyProducts: Product[] = [
  {
    id: "1",
    name: "Timeless • 20% Vit C + E Ferulic Acid • 30ml",
    brand: "Timeless",
    volume: "30ml",
    originalProduct: "SkinCeuticals C E Ferulic",
    description:
      "Key antioxidant trio (L-Ascorbic, Tocopherol, Ferulic Acid) in a similar lightweight serum texture.",
    pricePerUnit: "$0.55/ml",
    savings: "Save 90%",
    savingsPercent: 90,
    crueltyFree: true,
    vegan: true,
    fragranceFree: true,
    alcoholFree: true,
    fungalAcneSafe: true,
    parabenfree: true,
    sulfateFree: true,
    siliconesFree: false,
    sourcesCheckedDaysAgo: 12,
    category: "closest-match",
    categoryLabel: "CLOSEST MATCH",
    categoryBadgeColor: "bg-teal-50 text-teal-700",
    prices: {
      amazon: { price: "$16.50", url: "https://amazon.com" },
      sephora: { price: "$18.99", url: "https://sephora.com" },
      ulta: { price: "$17.99", url: "https://ulta.com" },
    },
  },
  {
    id: "2",
    name: "La Roche-Posay • Anthelios Melt-in Milk • 90ml",
    brand: "La Roche-Posay",
    volume: "90ml",
    originalProduct: "Supergoop! Unseen Sunscreen",
    description:
      "Broad-spectrum chemical filters in a cosmetically elegant, fragrance-free formula suitable for daily use.",
    pricePerUnit: "$0.24/ml",
    savings: "Save 68%",
    savingsPercent: 68,
    crueltyFree: false,
    vegan: false,
    fragranceFree: true,
    alcoholFree: false,
    fungalAcneSafe: true,
    parabenfree: false,
    sulfateFree: true,
    siliconesFree: true,
    sourcesCheckedDaysAgo: 45,
    category: "best-value",
    categoryLabel: "BEST VALUE",
    categoryBadgeColor: "bg-orange-50 text-orange-700",
  },
  {
    id: "3",
    name: "Krave Beauty • Great Barrier Relief • 45ml",
    brand: "Krave Beauty",
    volume: "45ml",
    originalProduct: "Dr. Jart+ Ceramidin Cream",
    description:
      "Focuses on barrier repair with tamanu oil, ceramides, and niacinamide. Free of fragrance and essential oils.",
    pricePerUnit: "$0.62/ml",
    savings: "Save 35%",
    savingsPercent: 35,
    crueltyFree: true,
    vegan: true,
    fragranceFree: true,
    alcoholFree: true,
    fungalAcneSafe: true,
    parabenfree: true,
    sulfateFree: true,
    siliconesFree: true,
    sourcesCheckedDaysAgo: 5,
    category: "sensitive-safe",
    categoryLabel: "SENSITIVE-SAFE",
    categoryBadgeColor: "bg-blue-50 text-blue-700",
  },
]

export interface HowWeDecideItem {
  id: string
  title: string
  description: string
  icon: "beaker" | "leaf" | "calculator"
}

export const howWeDecideItems: HowWeDecideItem[] = [
  {
    id: "1",
    title: "Ingredient Similarity",
    description:
      "We analyze ingredient lists for active ingredients, formulation type, and potential irritants to find the closest functional matches.",
    icon: "beaker",
  },
  {
    id: "2",
    title: "Verified Ethics",
    description:
      "Cruelty-free and vegan statuses are checked against trusted sources like Leaping Bunny and PETA. We show you our sources and when we last checked.",
    icon: "leaf",
  },
  {
    id: "3",
    title: "Objective Value",
    description:
      "It's simple math. We calculate and compare the price per milliliter or gram, so you can see the real cost and savings.",
    icon: "calculator",
  },
]

export interface Badge {
  id: string
  title: string
  description: string
  icon: "paw" | "leaf" | "bottle" | "wine" | "leaf-outline" | "shield" | "sparkles" | "clock" | "question"
}

export const badges: Badge[] = [
  {
    id: "1",
    title: "Cruelty-Free",
    description: "Product & ingredients not tested on animals.",
    icon: "paw",
  },
  {
    id: "2",
    title: "Vegan",
    description: "Contains no animal-derived ingredients.",
    icon: "leaf",
  },
  {
    id: "3",
    title: "Fragrance-Free",
    description: "No added synthetic or natural fragrance.",
    icon: "bottle",
  },
  {
    id: "4",
    title: "Alcohol Free",
    description: "Contains no alcohols that can dry skin.",
    icon: "wine",
  },
  {
    id: "5",
    title: "Fungal Acne Safe",
    description: "Safe for malassezia/fungal acne-prone skin.",
    icon: "shield",
  },
  {
    id: "10",
    title: "Unknown",
    description: "Data is unverified or unavailable.",
    icon: "question",
  },
]

