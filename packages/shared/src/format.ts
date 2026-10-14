/**
 * A price in the shopper's currency, e.g. formatPrice(599) → "₹599", formatPrice(12.5, "GBP") → "£12.50".
 * Catalogue prices without a currency are INR (the launch market). Returns null for a missing price
 * so callers show nothing rather than a made-up number.
 */
export function formatPrice(amount: number | null | undefined, currency = "INR", locale?: string): string | null {
  if (amount == null || !Number.isFinite(Number(amount))) return null
  const value = Number(amount)
  const whole = Number.isInteger(value) || currency === "INR" || currency === "JPY"
  try {
    return new Intl.NumberFormat(locale ?? (currency === "INR" ? "en-IN" : undefined), {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(value)
  } catch {
    return `${currency} ${whole ? Math.round(value) : value.toFixed(2)}`
  }
}
