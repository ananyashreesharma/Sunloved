/**
 * INCIDecoder HTML fetch + cheerio for catalog ingredient backfill.
 * Throttle requests and confirm your use matches their terms and robots.txt.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  incidecoderSearchQueryCandidates,
  searchQueryForCatalogProduct,
} from './catalog-search-query';
import {
  bestOrderedMatchAgainstCatalog,
  INCIDECODER_ORDERED_CHAR_SCORE_WEIGHT,
  passesOrderedCatalogAgainstIncidecoderHit,
} from './product-name-similarity';

export type ExternalFetchResult = {
  names: string[];
};

const ID_BASE = 'https://incidecoder.com';

/** Browser-like UA — INCIDecoder product HTML can differ from minimal/bot clients. */
const HTTP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type IncidecoderSearchRow = { href: string; title: string };

function parseSearchProductRows(html: string): IncidecoderSearchRow[] {
  const $ = cheerio.load(html);
  const out: IncidecoderSearchRow[] = [];
  const seen = new Set<string>();
  $('a').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('/products/') && !href.includes('/create');
  }).each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || seen.has(href)) return;
    seen.add(href);
    const title = $(el).text().replace(/\s+/g, ' ').trim();
    out.push({ href, title });
  });
  return out;
}

function labelToIncidecoderSlug(label: string): string {
  return normalizeKey(label.replace(/\([^)]*\)/g, ' '))
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function incidecoderSlugCandidates(brand: string, name: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    for (const variant of [raw, raw.replace(/'/g, ''), raw.replace(/'/g, '').replace(/\./g, ' ')]) {
      const s = labelToIncidecoderSlug(variant);
      if (s.length >= 6 && !seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  };
  add(searchQueryForCatalogProduct(brand, name));
  add(searchQueryForCatalogProduct(brand, name).replace(/\([^)]*\)/g, ' '));
  add(`${brand} ${name}`.trim().replace(/\([^)]*\)/g, ' '));
  return out;
}

function dedupePreserveOrder(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const k = n.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

export function parseINCIDecoderProductHtml(html: string): string[] {
  const $ = cheerio.load(html);

  const section = $('.showmore-section.ingredlist-short-like-section').first();
  const links = section.find('a.ingred-link');
  const names: string[] = [];
  if (links.length > 0) {
    links.each((_, el) => {
      const t = $(el).text().replace(/\s+/g, ' ').trim();
      if (t.length > 1) names.push(t);
    });
    if (names.length > 0) return dedupePreserveOrder(names);
  }

  const meta = $('meta[name="description"]').attr('content') || '';
  const m = meta.match(/ingredients explained:\s*(.+)$/i);
  if (m?.[1]) {
    return parseInciCommaList(m[1]);
  }

  return [];
}

/** GET /products/{slug} and parse — reused so we never fetch the same PDP twice. */
async function loadIncidecoderDirectHit(
  brand: string,
  name: string,
): Promise<{ path: string; names: string[] } | null> {
  for (const slug of incidecoderSlugCandidates(brand, name)) {
    const path = `/products/${slug}`;
    try {
      const { data: html, status } = await axios.get<string>(`${ID_BASE}${path}`, {
        headers: HTTP_HEADERS,
        timeout: 20000,
        responseType: 'text',
        validateStatus: (s) => s === 200 || s === 404,
      });
      if (status !== 200) continue;
      const names = parseINCIDecoderProductHtml(html);
      if (names.length >= 3) return { path, names };
    } catch {
      /* try next slug */
    }
  }
  return null;
}

/** Parentheticals often differ between catalog and INCIDecoder; strip for ordered-char match only. */
function catalogLabelForOrderedMatch(brand: string, name: string): string {
  return searchQueryForCatalogProduct(brand, name)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreIncidecoderSearchHit(
  href: string,
  linkTitle: string,
  brand: string,
  name: string,
): { score: number; ns: string; ordMatch: number } {
  const h = href.replace(/^\/products\//, '');
  const ns = normalizeKey(h.replace(/-/g, ' '));
  const nb = normalizeKey(brand);
  const nn = normalizeKey(searchQueryForCatalogProduct(brand, name));
  const slugHint = nn.replace(/\s+/g, '-');
  const catalogOrd = catalogLabelForOrderedMatch(brand, name);
  let score = 0;
  if (nb && ns.includes(nb)) score += 30;
  let overlap = 0;
  for (const t of nn.split(/\s+/).filter((x) => x.length > 2)) {
    if (ns.includes(t)) overlap += 1;
  }
  score += Math.min(overlap * 5, 50);
  if (slugHint.length > 8 && h.includes(slugHint.slice(0, 12))) score += 15;
  if (/\bspf\s*\d+/.test(nn) && /\bspf\s*\d+/.test(ns)) score += 20;
  const ordMatch = bestOrderedMatchAgainstCatalog(catalogOrd, href, linkTitle);
  score += ordMatch * INCIDECODER_ORDERED_CHAR_SCORE_WEIGHT;
  return { score, ns, ordMatch };
}

async function resolveIncidecoderPathFromSearch(
  brand: string,
  name: string,
  strict: boolean,
): Promise<string | null> {
  const nb = normalizeKey(brand);

  let bestRow: IncidecoderSearchRow | null = null;
  let bestScore = -1;
  let firstRows: IncidecoderSearchRow[] = [];
  for (const query of incidecoderSearchQueryCandidates(brand, name)) {
    let html: string;
    try {
      const res = await axios.get<string>(`${ID_BASE}/search`, {
        params: { query },
        headers: HTTP_HEADERS,
        timeout: 20000,
        responseType: 'text',
      });
      html = res.data;
    } catch {
      continue;
    }

    const rows = parseSearchProductRows(html);
    if (rows.length === 0) continue;
    if (firstRows.length === 0) firstRows = rows;

    for (const row of rows) {
      const { score, ns, ordMatch } = scoreIncidecoderSearchHit(row.href, row.title, brand, name);
      let adjusted = score;
      if (nb.length >= 3) {
        const brandWords = nb.split(/\s+/).filter((w) => w.length > 1);
        const matched = brandWords.filter((w) => ns.includes(w)).length;
        if (matched >= Math.min(2, brandWords.length)) adjusted += 12;
        else if (matched === 1 && brandWords.length <= 2) adjusted += 12;
      }
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestRow = row;
      }
    }

    if (bestScore >= 40) break;
  }

  if (firstRows.length === 0) return null;
  if (!bestRow) bestRow = firstRows[0];

  const bestHref = bestRow.href;
  const catOrd = catalogLabelForOrderedMatch(brand, name);
  const passesOrd = passesOrderedCatalogAgainstIncidecoderHit(catOrd, bestRow.href, bestRow.title);

  if (strict) {
    const slug = bestHref.replace(/^\/products\//, '');
    const ns = normalizeKey(slug.replace(/-/g, ' '));
    const brandWords = nb.split(/\s+/).filter((w) => w.length > 1);
    const brandInSlug =
      brandWords.length > 0 && brandWords.every((w) => ns.includes(w));

    if (bestScore < 32 && passesOrd) {
      return bestHref;
    }

    if (bestScore < 32) return null;

    if (nb.length >= 4 && !brandInSlug && bestScore < 52 && !passesOrd) {
      return null;
    }
    return bestHref;
  }

  if (bestScore < 28 && firstRows.length > 0) {
    if (passesOrd) return bestHref;
    return firstRows[0].href;
  }
  return bestHref;
}

export async function resolveINCIDecoderProductPath(
  brand: string,
  name: string,
  options?: { strict?: boolean },
): Promise<string | null> {
  const strict = options?.strict ?? false;
  const hit = await loadIncidecoderDirectHit(brand, name);
  if (hit) return hit.path;
  return resolveIncidecoderPathFromSearch(brand, name, strict);
}

/** Split on commas; strip (…), %, leading * (organic markers). Cap length for safety. */
export function parseInciCommaList(raw: string, maxItems = 400): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) =>
      s
        .replace(/\([^)]*\)/g, '')
        .replace(/\d+[\d.]*\s*%/g, '')
        .replace(/^\*\s*/, '')
        .trim(),
    )
    .filter((s) => s.length > 1)
    .slice(0, maxItems);
}

export type IncidecoderMissReason = 'no_search_hit' | 'empty_ingredient_section' | 'network_error';

export type IncidecoderDetailedResult =
  | { ok: true; names: string[] }
  | { ok: false; reason: IncidecoderMissReason };

export async function fetchIngredientsINCIDecoderDetailed(
  brand: string,
  name: string,
  options?: { strict?: boolean },
): Promise<IncidecoderDetailedResult> {
  const strict = options?.strict ?? false;
  try {
    const direct = await loadIncidecoderDirectHit(brand, name);
    if (direct) return { ok: true, names: direct.names };

    const path = await resolveIncidecoderPathFromSearch(brand, name, strict);
    if (!path) return { ok: false, reason: 'no_search_hit' };

    const url = path.startsWith('http') ? path : `${ID_BASE}${path}`;
    const { data: html } = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: 25000,
      responseType: 'text',
    });

    const names = parseINCIDecoderProductHtml(html);
    if (names.length === 0) return { ok: false, reason: 'empty_ingredient_section' };
    return { ok: true, names };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}

export async function fetchIngredientsINCIDecoder(
  brand: string,
  name: string,
  options?: { strict?: boolean },
): Promise<ExternalFetchResult | null> {
  const r = await fetchIngredientsINCIDecoderDetailed(brand, name, options);
  if (r.ok) return { names: r.names };
  return null;
}
