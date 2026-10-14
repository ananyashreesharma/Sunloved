/**
 * Catalog existence check: confirm a product SKU exists in the real world.
 *
 * Source order: INCIDecoder → Amazon.in → Flipkart
 *
 * Philosophy: we only need EXISTENCE confirmation — finding the product on any source
 * with a title that matches the catalog brand+name is enough. We do NOT require
 * ingredients to be present; that's the job of the ingredient fetcher.
 *
 * "ambiguous" means a network/bot-wall problem occurred — do NOT soft-delete.
 * "not_found" means all three sources gave a clean miss — safe to soft-delete.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { resolveINCIDecoderProductPath } from './external-ingredient-sources';
import { nonCosmeticSkipReason } from './ingredient-fetch-eligibility';
import { searchQueryForCatalogProduct } from './catalog-search-query';

export type ExistenceSource = 'incidecoder' | 'amazon-in' | 'flipkart';

export type CatalogExistenceResult =
  | { outcome: 'verified'; source: ExistenceSource }
  | { outcome: 'not_found'; checked: ExistenceSource[] }
  | { outcome: 'ambiguous'; reason: string }
  | { outcome: 'skipped'; reason: string };

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Token overlap ratio: what fraction of catalog tokens appear in the candidate text.
 * e.g. "Pixi Glow Tonic" → tokens ["pixi","glow","tonic"] → check how many appear in title.
 */
function titleMatchRatio(catalogBrand: string, catalogName: string, candidateTitle: string): number {
  const catalogTokens = normalizeKey(`${catalogBrand} ${catalogName}`)
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (catalogTokens.length === 0) return 0;
  const ct = normalizeKey(candidateTitle);
  const matched = catalogTokens.filter((t) => ct.includes(t)).length;
  return matched / catalogTokens.length;
}

// ─── Source 1: INCIDecoder ────────────────────────────────────────────────────
// Existence only: finding a product page with a matching title is enough.

async function checkINCIDecoder(
  brand: string,
  name: string,
): Promise<'verified' | 'miss' | 'network_error'> {
  try {
    const path = await resolveINCIDecoderProductPath(brand, name, { strict: false });
    if (!path) return 'miss';
    // Got a path → product exists on INCIDecoder
    return 'verified';
  } catch {
    return 'network_error';
  }
}

// ─── Source 2: Amazon.in ─────────────────────────────────────────────────────

function htmlLooksBlocked(html: string): boolean {
  const l = html.toLowerCase();
  return (
    l.includes('robot check') ||
    l.includes('enter the characters you see') ||
    l.includes('type the characters you see') ||
    (l.length < 5000 && l.includes('captcha'))
  );
}

async function checkAmazonIn(
  brand: string,
  name: string,
): Promise<'verified' | 'miss' | 'network_error' | 'blocked'> {
  const query = searchQueryForCatalogProduct(brand, name);
  let html: string;
  let status: number;
  try {
    const res = await axios.get<string>(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      timeout: 25_000,
      responseType: 'text',
      validateStatus: () => true,
    });
    status = res.status;
    html = res.data as string;
  } catch {
    return 'network_error';
  }

  if (status !== 200) return status === 503 ? 'blocked' : 'miss';
  if (htmlLooksBlocked(html)) return 'blocked';

  const $ = cheerio.load(html);

  // Collect product result titles from the search results page
  const titles: string[] = [];
  $('h2').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t.length > 5) titles.push(t);
  });
  $('span[data-component-type="s-product-image"]').each((_, el) => {
    const t = $(el).closest('div').find('h2, [class*="title"]').first().text().trim();
    if (t.length > 5 && !titles.includes(t)) titles.push(t);
  });

  // Accept if any result title has >25% token overlap with catalog name
  for (const t of titles) {
    if (titleMatchRatio(brand, name, t) >= 0.25) return 'verified';
  }

  // Fallback: check if any /dp/ link exists at all (brand must appear in query)
  const hasDpLink = $('a').filter((_, el) => {
    const h = $(el).attr('href') || '';
    return h.includes('/dp/');
  }).length > 0;

  if (hasDpLink && titles.length === 0) return 'verified'; // search returned results but no extractable titles
  return 'miss';
}

// ─── Source 3: Flipkart ───────────────────────────────────────────────────────

async function checkFlipkart(
  brand: string,
  name: string,
): Promise<'verified' | 'miss' | 'network_error' | 'blocked'> {
  const query = searchQueryForCatalogProduct(brand, name);
  let html: string;
  let status: number;
  try {
    const res = await axios.get<string>(
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&marketplace=FLIPKART`,
      {
        headers: {
          'User-Agent': BROWSER_UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
        timeout: 25_000,
        responseType: 'text',
        validateStatus: () => true,
      },
    );
    status = res.status;
    html = res.data as string;
  } catch {
    return 'network_error';
  }

  if (status !== 200) return status === 503 ? 'blocked' : 'miss';
  if (htmlLooksBlocked(html)) return 'blocked';

  const $ = cheerio.load(html);

  const titles: string[] = [];
  $('a[title]').each((_, el) => {
    const t = ($(el).attr('title') || '').replace(/\s+/g, ' ').trim();
    if (t.length > 5) titles.push(t);
  });
  $('div[class*="KzDlHZ"], div[class*="_4rR01T"], a[class*="IRpwTa"], div[class*="col-7-12"] a').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t.length > 5 && !titles.includes(t)) titles.push(t);
  });

  for (const t of titles) {
    if (titleMatchRatio(brand, name, t) >= 0.25) return 'verified';
  }

  // Flipkart always returns /p/ links on results pages — any result = product category exists
  const hasProductLink = $('a').filter((_, el) => {
    const h = $(el).attr('href') || '';
    return h.includes('/p/') && h.includes('pid=');
  }).length > 0;

  if (hasProductLink && titles.length < 3) return 'verified'; // results exist but title parsing failed
  return 'miss';
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Check if a catalog product exists on INCIDecoder → Amazon.in → Flipkart.
 * Returns 'ambiguous' on network/bot errors (do NOT delete these).
 * Returns 'not_found' only when all sources gave a clean miss.
 */
export async function verifyProductExistsOutsideCatalog(
  brand: string,
  name: string,
  categorySlug: string | null | undefined,
  delayMsBetweenSources: number,
): Promise<CatalogExistenceResult> {
  const skip = nonCosmeticSkipReason(name, categorySlug);
  if (skip) return { outcome: 'skipped', reason: skip };

  const checked: ExistenceSource[] = [];
  let hadNetworkError = false;

  // 1. INCIDecoder
  const inci = await checkINCIDecoder(brand, name);
  checked.push('incidecoder');
  if (inci === 'verified') return { outcome: 'verified', source: 'incidecoder' };
  if (inci === 'network_error') hadNetworkError = true;

  await sleep(delayMsBetweenSources);

  // 2. Amazon.in
  const amz = await checkAmazonIn(brand, name);
  checked.push('amazon-in');
  if (amz === 'verified') return { outcome: 'verified', source: 'amazon-in' };
  if (amz === 'network_error' || amz === 'blocked') hadNetworkError = true;

  await sleep(delayMsBetweenSources);

  // 3. Flipkart
  const fk = await checkFlipkart(brand, name);
  checked.push('flipkart');
  if (fk === 'verified') return { outcome: 'verified', source: 'flipkart' };
  if (fk === 'network_error' || fk === 'blocked') hadNetworkError = true;

  // If all sources had network issues, don't delete — we couldn't actually check
  if (hadNetworkError) {
    return { outcome: 'ambiguous', reason: 'network_or_bot_wall_on_one_or_more_sources' };
  }

  return { outcome: 'not_found', checked };
}
