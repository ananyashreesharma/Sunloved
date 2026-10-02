/**
 * Best-effort HTML search for first product hit on Nykaa / Amazon.in / Flipkart.
 * Listing markup changes often; callers should tolerate nulls. Throttle requests; respect site ToS / robots.txt.
 */
import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export type RetailListingHit = {
  retailer: 'nykaa' | 'amazon-in' | 'flipkart';
  url: string;
  title?: string;
  priceInr?: number;
};

function parseInr(text: string): number | undefined {
  const compact = text.replace(/,/g, '').replace(/\s+/g, ' ');
  const m = compact.match(/₹\s*(\d+(?:\.\d+)?)|INR\s*(\d+(?:\.\d+)?)|\bRs\.?\s*(\d+(?:\.\d+)?)/i);
  if (!m) return undefined;
  const raw = m[1] ?? m[2] ?? m[3];
  const n = parseFloat(raw);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export async function searchNykaaFirstHit(query: string): Promise<RetailListingHit | null> {
  const url = `https://www.nykaa.com/search/result?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-IN,en;q=0.9' },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  let a = $('a[href*="/p/"]').filter((_, el) => {
    const h = $(el).attr('href') || '';
    return !h.includes('/search/') && !h.includes('/brands/');
  }).first();
  if (!a.length) a = $('a[href*="nykaa.com"][href*="/p/"]').first();
  const href = a.attr('href');
  if (!href) return null;
  const full = href.startsWith('http') ? href : `https://www.nykaa.com${href.startsWith('/') ? '' : '/'}${href}`;
  const clean = full.split('?')[0];
  const title = a.attr('title')?.trim() || a.text().trim().slice(0, 200);
  const scope = a.closest('[class*="product"]').length ? a.closest('[class*="product"]') : a.parent();
  const priceInr = parseInr(scope.text());
  return { retailer: 'nykaa', url: clean, title: title || undefined, priceInr };
}

export async function searchAmazonInFirstHit(query: string): Promise<RetailListingHit | null> {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-IN,en;q=0.9' },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  const a = $('a[href*="/dp/"]').first();
  const href = a.attr('href');
  if (!href) return null;
  const full = href.startsWith('http') ? href : `https://www.amazon.in${href.startsWith('/') ? href : `/${href}`}`;
  const asinMatch = full.match(/\/dp\/([A-Z0-9]{10})/i);
  const clean = asinMatch ? `https://www.amazon.in/dp/${asinMatch[1].toUpperCase()}` : full.split('?')[0];
  const off = a.find('.a-offscreen').first().text();
  const priceInr = parseInr(off) ?? parseInr(a.closest('[data-component-type="s-search-result"]').text());
  return { retailer: 'amazon-in', url: clean, priceInr };
}

export async function searchFlipkartFirstHit(query: string): Promise<RetailListingHit | null> {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-IN,en;q=0.9' },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  const a = $('a[href*="/p/"]').filter((_, el) => {
    const h = $(el).attr('href') || '';
    return h.includes('/p/') && !h.includes('/search');
  }).first();
  const href = a.attr('href');
  if (!href) return null;
  const full = href.startsWith('http') ? href : `https://www.flipkart.com${href.startsWith('/') ? href : `/${href}`}`;
  const clean = full.split('?')[0];
  const priceInr = parseInr(a.parent().text() + ' ' + a.closest('div').text());
  return { retailer: 'flipkart', url: clean, priceInr };
}

export async function searchRetailersInOrder(
  query: string,
  order: Array<'nykaa' | 'amazon-in' | 'flipkart'>,
): Promise<RetailListingHit[]> {
  const hits: RetailListingHit[] = [];
  for (const r of order) {
    try {
      let h: RetailListingHit | null = null;
      if (r === 'nykaa') h = await searchNykaaFirstHit(query);
      else if (r === 'amazon-in') h = await searchAmazonInFirstHit(query);
      else if (r === 'flipkart') h = await searchFlipkartFirstHit(query);
      if (h) hits.push(h);
    } catch {
      /* network / parse */
    }
  }
  return hits;
}
