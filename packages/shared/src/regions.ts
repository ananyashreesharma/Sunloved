// Where an ingredient is banned in cosmetics, across the regulators SkinLens checks every rating
// against (backend/prisma/crosscheck-regulators.ts). Shown everywhere, whatever the person's own
// country: the strictest rule anywhere is worth knowing.

export const BAN_REGIONS = ["EU", "ASEAN", "CA", "US"] as const
export type BanRegion = (typeof BAN_REGIONS)[number]

const EU_MEMBERS = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]
const ASEAN_MEMBERS = ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "VN"]

/** Whether a regulator's rules apply in this country. */
export function regionCovers(region: BanRegion, country: string | null | undefined): boolean {
  if (!country) return false
  if (region === "EU") return EU_MEMBERS.includes(country)
  if (region === "ASEAN") return ASEAN_MEMBERS.includes(country)
  return region === country
}

/** The regions in an ingredient's regionNotes that ban it outright, in a fixed order. */
export function bannedRegions(regionNotes: unknown): BanRegion[] {
  if (!regionNotes || typeof regionNotes !== "object") return []
  const notes = regionNotes as Record<string, unknown>
  return BAN_REGIONS.filter((r) => notes[r] === "prohibited")
}
