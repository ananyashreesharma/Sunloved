/**
 * Catalog rows often store the brand again inside `product.name` ("Pixi Glow Tonic" + brand Pixi).
 * Search engines treat "Pixi Pixi Glow Tonic" as a bad query — strip the duplicate prefix.
 */

export function stripLeadingBrandFromProductName(brand: string, name: string): string {
  const b = brand.trim();
  const n = name.trim();
  if (!b) return n;

  const bWords = b.split(/\s+/).filter(Boolean);
  const nWords = n.split(/\s+/).filter(Boolean);
  if (nWords.length === 0) return n;

  let i = 0;
  for (; i < bWords.length && i < nWords.length; i++) {
    if (bWords[i].toLowerCase() !== nWords[i].toLowerCase()) break;
  }
  if (i === 0) return n;
  if (i === bWords.length) {
    const rest = nWords.slice(i).join(' ').trim();
    return rest || n;
  }
  return n;
}

/** Query string for INCIDecoder / Skinsort search (single brand mention). */
export function searchQueryForCatalogProduct(brand: string, name: string): string {
  const b = brand.trim();
  const stripped = stripLeadingBrandFromProductName(b, name.trim());
  if (!b) return name.trim();
  if (!stripped) return b;
  return `${b} ${stripped}`.trim();
}

/**
 * INCIDecoder search tries the primary query first; if that returns no links, these fallbacks
 * often still find the PDP (shorter query, name-only, etc.).
 */
export function incidecoderSearchQueryCandidates(brand: string, name: string): string[] {
  const seen = new Set<string>();
  const add = (q: string) => {
    const t = q.replace(/\s+/g, ' ').trim();
    if (t.length < 2) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  const out: string[] = [];
  const b = brand.trim();
  const n = name.trim();
  add(searchQueryForCatalogProduct(b, n));
  add(n.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim());
  const stripped = stripLeadingBrandFromProductName(b, n);
  if (stripped && stripped !== n) add(stripped.replace(/\([^)]*\)/g, ' ').trim());
  const primary = searchQueryForCatalogProduct(b, n).replace(/\([^)]*\)/g, ' ').trim();
  const words = primary.split(/\s+/).filter(Boolean);
  if (words.length > 10) add(words.slice(0, 9).join(' '));
  if (words.length > 6) add(words.slice(0, 6).join(' '));
  if (b) add(stripped || n);
  return out;
}
