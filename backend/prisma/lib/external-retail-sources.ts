/**
 * Best-effort HTML search for a product's listing on Nykaa / Amazon.in / Flipkart.
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

// Words that say what kind of product it is: a hit of a different kind is a different product
// ("Hair Mask" must not match a conditioner).
const KIND_WORDS = [
  'shampoo', 'conditioner', 'mask', 'serum', 'oil', 'cream', 'lotion', 'gel', 'wash', 'cleanser', 'scrub',
  'toner', 'mist', 'balm', 'butter', 'sunscreen', 'spray', 'soap', 'foam', 'essence', 'peel', 'deodorant',
];
const STOP = new Set(['the', 'and', 'for', 'with', 'of', 'a', 'an', 'in', 'to', 'by', 'ml', 'g', 'gm', 'pack', 'new']);

const words = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/'s\b/g, 's')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w));

/**
 * Whether a retailer's listing title is this product, not just the first thing search returned.
 * Needs the brand, the same kind of product, and at least 70% of the product's own name words.
 */
export function titleMatches(brand: string, name: string, title: string | undefined): boolean {
  if (!title) return false;
  const t = new Set(words(title));
  const has = (w: string) => t.has(w) || t.has(w.replace(/s$/, '')) || t.has(`${w}s`);
  const brandWords = words(brand);
  if (!brandWords.every(has)) return false;
  const own = words(name).filter((w) => !brandWords.includes(w));
  for (const k of KIND_WORDS) if (own.includes(k) && !has(k)) return false;
  if (own.length === 0) return true;
  return own.filter(has).length / own.length >= 0.7;
}

function parseInr(text: string): number | undefined {
  const compact = text.replace(/,/g, '').replace(/\s+/g, ' ');
  const m = compact.match(/₹\s*(\d+(?:\.\d+)?)|INR\s*(\d+(?:\.\d+)?)|\bRs\.?\s*(\d+(?:\.\d+)?)/i);
  if (!m) return undefined;
  const raw = m[1] ?? m[2] ?? m[3];
  const n = parseFloat(raw);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export async function searchNykaa(query: string, accept: (title?: string) => boolean): Promise<RetailListingHit | null> {
  const url = `https://www.nykaa.com/search/result?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-IN,en;q=0.9' },
  });
  if (!res.ok) return null;
  const $ = cheerio.load(await res.text());
  const links = $('a[href*="/p/"]')
    .filter((_, el) => {
      const h = $(el).attr('href') || '';
      return !h.includes('/search/') && !h.includes('/brands/');
    })
    .slice(0, 5)
    .toArray();
  for (const el of links) {
    const a = $(el);
    const title = a.attr('title')?.trim() || a.text().trim().slice(0, 200) || undefined;
    if (!accept(title)) continue;
    const href = a.attr('href')!;
    const full = href.startsWith('http') ? href : `https://www.nykaa.com${href.startsWith('/') ? '' : '/'}${href}`;
    const scope = a.closest('[class*="product"]').length ? a.closest('[class*="product"]') : a.parent();
    return { retailer: 'nykaa', url: full.split('?')[0], title, priceInr: parseInr(scope.text()) };
  }
  return null;
}

export async function searchAmazonIn(query: string, accept: (title?: string) => boolean): Promise<RetailListingHit | null> {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-IN,en;q=0.9' },
  });
  if (!res.ok) return null;
  const $ = cheerio.load(await res.text());
  for (const el of $('[data-component-type="s-search-result"]').slice(0, 5).toArray()) {
    const card = $(el);
    const title = card.find('h2').first().text().trim() || undefined;
    if (!accept(title)) continue;
    const asin = card.attr('data-asin');
    const href = card.find('a[href*="/dp/"]').first().attr('href');
    if (!asin && !href) continue;
    const clean = asin ? `https://www.amazon.in/dp/${asin.toUpperCase()}` : `https://www.amazon.in${href!.split('?')[0]}`;
    const priceInr = parseInr(card.find('.a-offscreen').first().text()) ?? parseInr(card.text());
    return { retailer: 'amazon-in', url: clean, title, priceInr };
  }
  return null;
}

export async function searchFlipkart(query: string, accept: (title?: string) => boolean): Promise<RetailListingHit | null> {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-IN,en;q=0.9' },
  });
  if (!res.ok) return null;
  const $ = cheerio.load(await res.text());
  const links = $('a[href*="/p/"]')
    .filter((_, el) => !($(el).attr('href') || '').includes('/search'))
    .slice(0, 5)
    .toArray();
  for (const el of links) {
    const a = $(el);
    const title = a.attr('title')?.trim() || a.text().trim().slice(0, 200) || undefined;
    if (!accept(title)) continue;
    const href = a.attr('href')!;
    const full = href.startsWith('http') ? href : `https://www.flipkart.com${href.startsWith('/') ? href : `/${href}`}`;
    return { retailer: 'flipkart', url: full.split('?')[0], title, priceInr: parseInr(a.parent().text() + ' ' + a.closest('div').text()) };
  }
  return null;
}

/**
 * The listing for this product at each retailer, in order. Only hits whose title passes
 * titleMatches() count: the first search result used to be taken as-is, which linked
 * "Dove Dryness & Shine Shampoo" to an L'Oreal shampoo page.
 */
export async function searchRetailersInOrder(
  product: { brand: string; name: string },
  order: Array<'nykaa' | 'amazon-in' | 'flipkart'>,
): Promise<RetailListingHit[]> {
  const query = `${product.brand} ${product.name}`.slice(0, 200);
  const accept = (title?: string) => titleMatches(product.brand, product.name, title);
  const hits: RetailListingHit[] = [];
  for (const r of order) {
    try {
      const h =
        r === 'nykaa' ? await searchNykaa(query, accept) : r === 'amazon-in' ? await searchAmazonIn(query, accept) : await searchFlipkart(query, accept);
      if (h) hits.push(h);
    } catch {
      /* network / parse */
    }
  }
  return hits;
}
