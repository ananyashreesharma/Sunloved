// Where the user lives. Formulas, regulations, catalogue and prices differ by country, so this is
// asked first in onboarding. Codes are ISO 3166-1 alpha-2, stored as-is by the backend (User.locale).

export type Country = { code: string; name: string; currency: string }

/** Launch market first, then alphabetical. Extend freely — nothing else hardcodes this list. */
export const COUNTRIES: Country[] = [
  { code: "IN", name: "India", currency: "INR" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "BD", name: "Bangladesh", currency: "BDT" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "EG", name: "Egypt", currency: "EGP" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "ID", name: "Indonesia", currency: "IDR" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "KE", name: "Kenya", currency: "KES" },
  { code: "MY", name: "Malaysia", currency: "MYR" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "NP", name: "Nepal", currency: "NPR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "PK", name: "Pakistan", currency: "PKR" },
  { code: "PH", name: "Philippines", currency: "PHP" },
  { code: "QA", name: "Qatar", currency: "QAR" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "KR", name: "South Korea", currency: "KRW" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "LK", name: "Sri Lanka", currency: "LKR" },
  { code: "TH", name: "Thailand", currency: "THB" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
]

export const DEFAULT_COUNTRY = "IN"

export function countryByCode(code: string | null | undefined): Country | undefined {
  if (!code) return undefined
  const upper = code.toUpperCase()
  return COUNTRIES.find((c) => c.code === upper)
}

/**
 * Best guess from a locale tag like "en-GB" or "ar-SA" (navigator.language on web, the device
 * locale on mobile). Only a pre-selection: the user always confirms it.
 */
export function guessCountry(localeTag: string | null | undefined): string {
  const region = localeTag?.split(/[-_]/)[1]?.toUpperCase()
  return countryByCode(region)?.code ?? DEFAULT_COUNTRY
}
