// Shapes of the NestJS backend's responses, after the { data, meta, error } envelope is unwrapped.
// Both apps' API clients return these, so a backend change is updated here once.

export type FoundIngredient = {
  /** As printed on the label ("Avobenzone", "Agua"). */
  name: string
  /** The standard (INCI) entry it matched, e.g. "Butyl Methoxydibenzoylmethane". */
  scientificName?: string
  /** Where the rating comes from, in plain words. */
  source?: string
  function?: string
  zone?: string
  safetyRating?: string
  shortDescription?: string
  isParaben?: boolean
  isFragrance?: boolean
  isIrritant?: boolean
  /** Regulators that ban it outright in cosmetics ("EU", "ASEAN", "CA", "US"), whatever the reader's country. */
  bannedIn?: string[]
  found: boolean
}

/** POST /ingredients/analyze */
export type AnalyzeIngredientsResponse = {
  input: string
  parsed: string[]
  foundIngredients: FoundIngredient[]
  unknownIngredients: string[]
  summary: string
  tags: string[]
  actives: string[]
  /** foundIngredients.length / parsed.length. Below COVERAGE_THRESHOLD there is no verdict. */
  coverage: number
}

export type ProductIngredientRow = {
  inciName: string
  displayName?: string | null
  zone?: string | null
  safetyRating?: string | null
  shortDescription?: string | null
  isParaben?: boolean
  isFragrance?: boolean
}

export type ProductPrice = { retailer: string; amount: number; currency: string; best?: boolean }

/** GET /products/:id (and items of /products/search) */
export type ProductDetail = {
  id: string
  name: string
  brand: string
  imageUrl?: string
  category?: string
  volume?: string
  currentPrice?: number
  /** ISO 4217 code for currentPrice; absent on older rows, which are INR. */
  currency?: string
  overallScore?: number | null
  /** Search relevance 0–100 when the API ranked results */
  matchScore?: number
  matchedIngredients?: string[]
  /** First INCI names from catalog (search/list) */
  ingredientPreview?: string[]
  actives?: string[]
  fragranceFree?: boolean
  sulfateFree?: boolean
  parabenFree?: boolean
  ingredientRows?: ProductIngredientRow[]
  prices?: ProductPrice[]
}

/** GET /comparisons/:productId */
export type ProductComparison = {
  id: string
  name: string
  brand: string
  category?: string
  similarityScore: number
  savingsPercent?: number
  sharedActives?: string[]
  reason?: string
  matchType?: string
  /** True when the candidate has fewer flagged ingredients than the product it replaces. */
  safer?: boolean
}

export type StepFrequency = "daily" | "alternate" | "twice_weekly"
export type RoutineKind = "morning" | "night"

export type RoutineStepDto = {
  id: string
  productId: string | null
  name: string
  brand: string | null
  position: number
  frequency: StepFrequency
  waitAfterMins: number | null
  done: boolean
  enrich: boolean
  /** Not due today (rest day of an alternating step). Older servers omit it. */
  rest?: boolean
}

export type RoutineConflict = {
  ingredientAName: string
  ingredientBName: string
  severity: "low" | "medium" | "high"
  reason: string
  timingNote: string | null
  stepIds: string[]
}

export type RoutineResponse = {
  routineId: string
  type: RoutineKind
  steps: RoutineStepDto[]
  allDone: boolean
  conflicts: RoutineConflict[]
}

export type StreakSummary = { currentStreak: number; longestStreak: number; totalDaysCompleted: number }

export type StreakDayStatus = "both" | "one" | "paused" | "future"
export type StreakHistoryDay = { date: string; status: StreakDayStatus }

export type NotificationPreferences = {
  morningTime: string | null
  nightTime: string | null
  channel: "push" | "whatsapp"
  reminderTone: "coach" | "plain" | "off"
  muted: boolean
}

export type RecentScanEntry = {
  id: string
  productId: string | null
  rawIngredientText: string | null
  name: string
  brand: string | null
  score: number | null
  scannedAt: string
}

export type MeResponse = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  onboardingDone: boolean
  /** ISO 3166-1 alpha-2 */
  country: string | null
  skinType: { code: string; label: string } | null
  concerns: { code: string; label: string }[]
}

export type ContributionResult = {
  productId: string
  contributionId: string
  matched: number
  aiEnriched: number
  coverage: number
  autoPublishAt: string
}
