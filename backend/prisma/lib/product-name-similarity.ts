/**
 * Identity check: catalog name letters/digits must appear in the same order inside the INCIDecoder
 * slug or title (subsequence). Example: 10-letter catalog label → at least 9 of those letters in order → 90%.
 */

/** Minimum fraction of catalog alnum chars that must match in order (e.g. 10 chars → ≥9). */
export const INCIDECODER_ORDERED_CHAR_MIN_FRACTION = 0.9;

/** Extra scoring weight in lenient mode (0–1 ratio maps to bonus points). */
export const INCIDECODER_ORDERED_CHAR_SCORE_WEIGHT = 58;

function onlyAlnum(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function orderedAlphanumericSubsequenceMatch(
  canonical: string,
  candidate: string,
): { matched: number; total: number; ratio: number } {
  const a = onlyAlnum(canonical);
  const b = onlyAlnum(candidate);
  const total = a.length;
  if (total === 0) return { matched: 0, total: 0, ratio: 0 };
  let i = 0;
  for (let j = 0; j < b.length && i < a.length; j++) {
    if (a[i] === b[j]) i++;
  }
  const matched = i;
  return { matched, total, ratio: matched / total };
}

/**
 * Fraction of `canonical`’s alphanumeric characters that can be matched in order as a subsequence of `candidate`.
 */
export function orderedAlphanumericSubsequenceRatio(canonical: string, candidate: string): number {
  return orderedAlphanumericSubsequenceMatch(canonical, candidate).ratio;
}

/**
 * True if enough of `canonical` appears in order inside `candidate`:
 * - total alnum &lt; 4: require full match (all characters).
 * - else: require `matched / total >= minFraction` (default 0.9 → 9 of 10 letters).
 */
export function passesOrderedCharFraction(
  canonical: string,
  candidate: string,
  minFraction = INCIDECODER_ORDERED_CHAR_MIN_FRACTION,
): boolean {
  const { matched, total, ratio } = orderedAlphanumericSubsequenceMatch(canonical, candidate);
  if (total === 0) return false;
  if (total < 4) return matched === total;
  return ratio >= minFraction - 1e-12;
}

export function bestOrderedMatchAgainstCatalog(
  catalogLabel: string,
  slugFromHref: string,
  linkTitle: string,
): number {
  const slugPart = slugFromHref.replace(/^\/products\//, '').replace(/-/g, ' ');
  const fromSlug = orderedAlphanumericSubsequenceRatio(catalogLabel, slugPart);
  const t = linkTitle.trim();
  const fromTitle = t.length >= 2 ? orderedAlphanumericSubsequenceRatio(catalogLabel, t) : 0;
  return Math.max(fromSlug, fromTitle);
}

/** Passes if slug or link title satisfies the ordered-char coverage rule vs catalog. */
export function passesOrderedCatalogAgainstIncidecoderHit(
  catalogLabel: string,
  href: string,
  linkTitle: string,
  minFraction = INCIDECODER_ORDERED_CHAR_MIN_FRACTION,
): boolean {
  const slugPart = href.replace(/^\/products\//, '').replace(/-/g, ' ');
  if (passesOrderedCharFraction(catalogLabel, slugPart, minFraction)) return true;
  const t = linkTitle.trim();
  if (t.length >= 2 && passesOrderedCharFraction(catalogLabel, t, minFraction)) return true;
  return false;
}
