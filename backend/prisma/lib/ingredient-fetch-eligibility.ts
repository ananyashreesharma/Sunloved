/**
 * Leave-on / rinse-off cosmetics have INCI lists. Beauty devices, tools, and similar
 * SKUs should not be run through retail INCI scrapers — PDP text is not a real formula.
 */

/** Leaf slugs under skincare-tools (and any future tool-only leaves). */
const SKIP_INGREDIENT_FETCH_CATEGORY_SLUGS = new Set([
  'face-roller',
  'gua-sha',
  'cleansing-brush',
  'led-device',
]);

/**
 * If non-null, skip ingredient backfill for this product. Reason is logged by the CLI.
 */
export function nonCosmeticSkipReason(
  productName: string,
  categorySlug: string | null | undefined,
): string | null {
  if (categorySlug && SKIP_INGREDIENT_FETCH_CATEGORY_SLUGS.has(categorySlug)) {
    return 'category is a tool/device';
  }

  const n = productName.toLowerCase();

  if (/\bnuface\b/.test(n)) return 'beauty device (name)';
  if (/\bmicrocurrent\b/.test(n)) return 'beauty device (name)';
  if (/\btoning device\b/.test(n)) return 'beauty device (name)';
  if (/\bfacial\s+toning\b/.test(n)) return 'beauty device (name)';
  if (/\bled\s+mask\b/.test(n)) return 'beauty device (name)';
  if (/\btrinity\b/.test(n) && /\b(device|toning|facial)\b/.test(n)) {
    return 'beauty device (name)';
  }

  if (/\bdevice\b/.test(n)) {
    if (
      /\b(facial|skin|toning|beauty|cosmetic|microcurrent|led|cleansing brush|face brush)\b/.test(
        n,
      )
    ) {
      return 'likely device, not cosmetic (name)';
    }
  }

  return null;
}
