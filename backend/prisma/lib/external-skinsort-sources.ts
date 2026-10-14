/**
 * Skinsort product search + ingredient list (best-effort).
 *
 * Skinsort often serves Cloudflare challenges to non-browser clients; in that case this returns `null`
 * and the ingredient chain falls through to Nykaa. For reliable Skinsort access you’d need
 * a browser automation path and must comply with their ToS.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ExternalFetchResult } from './external-ingredient-sources';
import { searchQueryForCatalogProduct } from './catalog-search-query';

const SKINSORT_BASE = 'https://skinsort.com';

const HTTP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function isCloudflareChallenge(html: string): boolean {
  return (
    html.length < 8000 &&
    (/just a moment/i.test(html) ||
      /__cf_chl/i.test(html) ||
      /challenge-platform/i.test(html) ||
      /cf-browser-verification/i.test(html))
  );
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseSearchProductHrefs(html: string): string[] {
  const $ = cheerio.load(html);
  const out: string[] = [];
  const seen = new Set<string>();
  $('a').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('/products/') && !href.includes('/create');
  }).each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || seen.has(href)) return;
    seen.add(href);
    out.push(href);
  });
  return out;
}

function scoreHref(href: string, brand: string, name: string): number {
  const slug = href.replace(/^\/products\//, '');
  const ns = normalizeKey(slug.replace(/-/g, ' '));
  const nb = normalizeKey(brand);
  const nn = normalizeKey(name);
  let score = 0;
  if (nb.length > 2 && ns.includes(nb)) score += 35;
  for (const t of nn.split(/\s+/).filter((x) => x.length > 2)) {
    if (ns.includes(t)) score += 6;
  }
  if (/\bspf\s*\d+/.test(nn) && /\bspf\s*\d+/.test(ns)) score += 25;
  return score;
}

export async function resolveSkinsortProductPath(brand: string, name: string): Promise<string | null> {
  const query = searchQueryForCatalogProduct(brand, name);
  const { data: html } = await axios.get<string>(`${SKINSORT_BASE}/search`, {
    params: { q: query },
    headers: HTTP_HEADERS,
    timeout: 22000,
    responseType: 'text',
  });

  if (isCloudflareChallenge(html)) return null;

  const hrefs = parseSearchProductHrefs(html);
  if (hrefs.length === 0) return null;

  let best: string | null = null;
  let bestScore = -1;
  for (const h of hrefs) {
    const sc = scoreHref(h, brand, name);
    if (sc > bestScore) {
      bestScore = sc;
      best = h;
    }
  }

  if (bestScore < 32 || !best) return null;
  return best;
}

export function parseSkinsortProductHtml(html: string): string[] {
  if (isCloudflareChallenge(html)) return [];

  const $ = cheerio.load(html);
  const names: string[] = [];
  const seen = new Set<string>();

  $('a').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('/ingredients/');
  }).each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t.length < 2) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    names.push(t);
  });

  if (names.length >= 5) return names;

  const next = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (next) {
    try {
      const walk = (obj: unknown): void => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          for (const x of obj) walk(x);
          return;
        }
        const o = obj as Record<string, unknown>;
        for (const [k, v] of Object.entries(o)) {
          if (/ingredient/i.test(k) && typeof v === 'string' && v.includes(',') && v.length > 40) {
            for (const part of v.split(',')) {
              const p = part.replace(/\([^)]*\)/g, '').trim();
              if (p.length > 2) {
                const key = p.toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  names.push(p);
                }
              }
            }
          } else walk(v);
        }
      };
      walk(JSON.parse(next[1]) as unknown);
    } catch {
      /* ignore */
    }
  }

  return names;
}

export async function fetchIngredientsSkinsort(
  brand: string,
  name: string,
): Promise<ExternalFetchResult | null> {
  const path = await resolveSkinsortProductPath(brand, name);
  if (!path) return null;

  const url = path.startsWith('http') ? path : `${SKINSORT_BASE}${path}`;
  const { data: html } = await axios.get<string>(url, {
    headers: HTTP_HEADERS,
    timeout: 25000,
    responseType: 'text',
  });

  if (isCloudflareChallenge(html)) return null;

  const names = parseSkinsortProductHtml(html);
  if (names.length < 5) return null;
  return { names };
}
