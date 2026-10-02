/**
 * Gate 1 — Reject retailer PDPs that don’t match catalog SKU (wrong ASIN / variant).
 */

import { stripLeadingBrandFromProductName } from './catalog-search-query';

export function titleMatchRatio(pdpTitle: string, brand: string, name: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9%]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const catalogTokens = new Set(normalize(`${brand} ${name}`));
  const pdpTokens = normalize(pdpTitle);
  if (catalogTokens.size === 0) return 0;
  const overlap = pdpTokens.filter((t) => catalogTokens.has(t)).length;
  return overlap / Math.max(catalogTokens.size, 1);
}

/**
 * Nykaa / Amazon sometimes expose only the brand in the listing or card title while the PDP is correct.
 * Accept when every PDP token appears in the catalog line and the full brand phrase is in the PDP.
 */
export function retailerTitleIsBrandOnlySubset(
  pdpTitle: string,
  brand: string,
  name: string,
): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9%]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const pdpTokens = normalize(pdpTitle);
  const brandTokens = normalize(brand);
  const catalogTokens = new Set(normalize(`${brand} ${name}`));
  if (pdpTokens.length === 0 || brandTokens.length === 0) return false;
  if (pdpTokens.length > 6) return false;
  if (!brandTokens.every((t) => pdpTokens.includes(t))) return false;
  return pdpTokens.every((t) => catalogTokens.has(t));
}

export function effectiveRetailerTitleRatio(pdpTitle: string, brand: string, name: string): number {
  const stripped = stripLeadingBrandFromProductName(brand, name);
  const rFull = titleMatchRatio(pdpTitle, brand, name);
  const rName = titleMatchRatio(pdpTitle, '', stripped.length ? stripped : name);
  return Math.max(rFull, rName, retailerTitleIsBrandOnlySubset(pdpTitle, brand, name) ? 0.42 : 0);
}

export function percentMarkersConsistent(catalogName: string, pdpTitle: string): boolean {
  const pct = (s: string) => [...s.matchAll(/(\d+(?:\.\d+)?%)/g)].map((m) => m[1]);
  const catalogPcts = pct(catalogName);
  if (catalogPcts.length === 0) return true;
  const t = pdpTitle.toLowerCase();
  return catalogPcts.every((p) => t.includes(p.toLowerCase()));
}

/** If catalog names one SPF number, PDP title must show the same (first match). */
export function spfConsistent(catalogName: string, pdpTitle: string): boolean {
  const spf = (s: string) => s.match(/spf\s*(\d{1,3})/i)?.[1];
  const catalogSpf = spf(catalogName);
  if (!catalogSpf) return true;
  const p = spf(pdpTitle);
  return !!p && p === catalogSpf;
}

export function retailerTitleAcceptsIngredients(
  pdpTitle: string | null | undefined,
  brand: string,
  name: string,
  minRatio = 0.4,
): boolean {
  if (!pdpTitle?.trim()) return false;
  if (effectiveRetailerTitleRatio(pdpTitle, brand, name) < minRatio) return false;
  if (!percentMarkersConsistent(name, pdpTitle)) return false;
  if (!spfConsistent(name, pdpTitle)) return false;
  return true;
}
