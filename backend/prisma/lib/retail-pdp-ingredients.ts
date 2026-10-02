/**
 * Best-effort INCI / ingredient text extraction from Nykaa, Amazon.in, and Myntra product pages.
 * Markup and embedded JSON change often; combine __NEXT_DATA__ / JSON walk + DOM heuristics.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseInciCommaList } from './external-ingredient-sources';

const PDP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
};

export async function fetchPdpHtml(url: string, timeoutMs = 28000): Promise<string | null> {
  try {
    const { data } = await axios.get<string>(url, {
      headers: PDP_HEADERS,
      timeout: timeoutMs,
      responseType: 'text',
      maxRedirects: 6,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    return typeof data === 'string' ? data : null;
  } catch {
    return null;
  }
}

function looksLikeInciBlob(s: string): boolean {
  const t = s.trim();
  if (t.length < 25) return false;

  // Reject obvious non-INCI content first
  // Amazon ad/pricing JSON fragments
  if (/advertiser|axiom\.|clickUrl|addToCartUrl|priceAmount|currencyCode|displayString|unitPrice|selectionSignals|pastActivity|physicalId|productType|productCategory|dealId|dealType|certCount|isFreshSupported|isOmnibus/i.test(t))
    return false;
  // JSON key-value patterns (escaped or not)
  if (/^["\\]*[a-zA-Z]+["\\]*\s*:\s*["\\{[]/.test(t)) return false;
  if (/\\+"[a-zA-Z]+\\+"/.test(t)) return false;
  // URLs
  if (/https?:\/\//.test(t)) return false;
  // Amazon image IDs
  if (/media-amazon\.com|m\.media-amazon/.test(t)) return false;
  // Marketing bullet patterns
  if (/^[-–•]\s+[A-Z]/.test(t)) return false;
  // Price display strings
  if (/₹\d/.test(t) && !/aqua|water|glycerin/i.test(t)) return false;

  // Must have INCI-like content: multiple commas + known cosmetic ingredient keywords
  const commas = (t.match(/,/g) || []).length;
  if (commas < 2) return false;

  return /\b(aqua|water|glycerin|glycerine|sodium|potassium|acid|oil|alcohol|dimethicone|fragrance|parfum|extract|butylene|propylene|phenoxy|carbomer|cetyl|stearyl|tocopherol|niacinamide|retinol|silica|zinc|titanium)\b/i.test(t);
}

function deepFindIngredientsString(obj: unknown, depth = 0): string | null {
  if (depth > 35 || obj === null || obj === undefined) return null;

  if (typeof obj === 'string') {
    return looksLikeInciBlob(obj) ? obj : null;
  }

  if (Array.isArray(obj)) {
    if (obj.length > 2 && obj.every((x) => typeof x === 'string')) {
      const joined = (obj as string[]).join(', ');
      return looksLikeInciBlob(joined) ? joined : null;
    }
    for (const x of obj) {
      const r = deepFindIngredientsString(x, depth + 1);
      if (r) return r;
    }
    return null;
  }

  if (typeof obj !== 'object') return null;

  const o = obj as Record<string, unknown>;
  const keyHints = [
    'ingredients',
    'ingredient',
    'ingredientList',
    'ingredientsList',
    'ingredients_list',
    'ingredientsText',
    'specialIngredients',
    'specialingredients',
    'inci',
    'inciList',
    'fullIngredients',
    'composition',
  ];

  for (const key of Object.keys(o)) {
    const lk = key.replace(/_/g, '').toLowerCase();
    const matchesKey = keyHints.some((h) => lk === h || lk.includes('ingredient'));
    const v = o[key];
    if (!matchesKey) continue;
    if (typeof v === 'string' && looksLikeInciBlob(v)) return v;
    if (Array.isArray(v) && v.every((x) => typeof x === 'string') && v.length > 2) {
      const joined = (v as string[]).join(', ');
      if (looksLikeInciBlob(joined)) return joined;
    }
  }

  for (const v of Object.values(o)) {
    const r = deepFindIngredientsString(v, depth + 1);
    if (r) return r;
  }
  return null;
}

function extractRawFromNextData(html: string): string | null {
  const m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    const json = JSON.parse(m[1]) as unknown;
    return deepFindIngredientsString(json);
  } catch {
    return null;
  }
}

function parseNextDataIngredients(html: string): string[] {
  const raw = extractRawFromNextData(html);
  if (!raw) return [];
  return parseInciCommaList(raw);
}

/** Amazon sometimes inlines JSON with ingredientLine or similar (often truncated — prefer longest parse). */
function collectLooseJsonIngredientStrings(html: string): string[] {
  const candidates: string[] = [];
  const patterns = [
    /"specialIngredients"\s*:\s*"((?:[^"\\]|\\.)*)"/gi,
    /"ingredients"\s*:\s*"((?:[^"\\]|\\.)*)"/gi,
    /"ingredientList"\s*:\s*"((?:[^"\\]|\\.)*)"/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      try {
        const decoded = JSON.parse(`"${m[1].replace(/\\"/g, '"')}"`) as string;
        if (typeof decoded === 'string' && looksLikeInciBlob(decoded)) candidates.push(decoded);
      } catch {
        const raw = m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');
        if (looksLikeInciBlob(raw)) candidates.push(raw);
      }
    }
  }
  return candidates;
}

/** Pick the comma-split list with the most items (avoids short JSON beating full “Special Ingredients” HTML). */
function bestInciListFromRawCandidates(candidates: (string | null | undefined)[]): string[] {
  let best: string[] = [];
  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    const t = raw.replace(/\u00a0/g, ' ').trim();
    if (t.length < 20) continue;
    const list = parseInciCommaList(t);
    if (list.length > best.length) best = list;
  }
  return best;
}

export function parseNykaaPdpIngredients(html: string): string[] {
  let list = parseNextDataIngredients(html);
  if (list.length >= 3) return list;

  list = bestInciListFromRawCandidates(collectLooseJsonIngredientStrings(html));
  if (list.length >= 3) return list;

  const $ = cheerio.load(html);
  const nic = $('[class*="ingredient"], [id*="ingredient"], [data-testid*="ingredient"]')
    .first()
    .text();
  if (nic && looksLikeInciBlob(nic)) {
    list = parseInciCommaList(nic);
    if (list.length >= 3) return list;
  }

  const flat = html.replace(/\s+/g, ' ');
  const rm = flat.match(
    /ingredients?\s*[:\s]+([^<]{40,4000}?)(?=(?:how to use|directions|about the brand|country of origin|best before|manufactured|<\/div>\s*<div|<h[1-4]))/i,
  );
  if (rm?.[1]) {
    const text = cheerio.load(`<div>${rm[1]}</div>`)('div').text();
    list = parseInciCommaList(text);
    if (list.length >= 3) return list;
  }

  return [];
}

/**
 * Amazon.in often shows the full INCI line under “Special Ingredients” in the product details table,
 * while embedded JSON may only carry a short fragment — we must merge candidates and take the longest list.
 */
export function parseAmazonInPdpIngredients(html: string): string[] {
  const candidates: (string | null | undefined)[] = [];

  candidates.push(extractRawFromNextData(html));
  candidates.push(...collectLooseJsonIngredientStrings(html));

  const $ = cheerio.load(html);
  $('#productDetails_detailBullets_sections1 tr, #productDetails_techSpec_section_1 tr, table.a-key-value tr').each(
    (_, el) => {
      const cells = $(el).find('th, td');
      if (cells.length < 2) return;
      const label = $(cells[0]).text().trim();
      const value = $(cells[1]).text().trim();
      if (
        /special\s+ingredients/i.test(label) ||
        (/^ingredients?$/i.test(label) && value.length > 40)
      ) {
        candidates.push(value);
      }
    },
  );

  const nic = $('#nic-ingredients-content, #important-information .content, #feature-bullets ul').text();
  if (nic && /ingredient/i.test(nic) && looksLikeInciBlob(nic)) {
    candidates.push(nic.replace(/^[^:]*ingredients?\s*:?\s*/i, ''));
  }

  $('tr, li, p, span, div').each((_, el) => {
    const row = $(el).text().trim();
    if (
      (/^special\s+ingredients\s*:/i.test(row) || /^ingredients?\s*:/i.test(row)) &&
      row.length > 50
    ) {
      candidates.push(row.replace(/^[^:]*:\s*/i, ''));
    }
  });

  const dec = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const special = dec.match(
    /Special\s+Ingredients\s*[:\t]?\s*([\s\S]{80,15000}?)(?=\s*(?:<\/?tr>|<\/?table>|Technical\s+Details|Date\s+First|Manufacturer|Country\s+of\s+origin|Item\s+model|ASIN|Customer\s+reviews|Product\s+description|\r?\n\s*\r?\n\s*[A-Z][a-z]{2,20}\s*[:.\t]))/i,
  );
  if (special?.[1]) {
    const stripped = special[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    candidates.push(stripped);
  }

  const flat = dec.replace(/\s+/g, ' ');
  const rm = flat.match(
    /(?:Special\s+Ingredients|Ingredients)\s*[:\s]+([^<]{60,12000}?)(?=(?:Technical|Date\s+First|Manufacturer|Safety|Warning|Directions|ASIN|Customer\s|$))/i,
  );
  if (rm?.[1]) {
    candidates.push(cheerio.load(`<div>${rm[1]}</div>`)('div').text().trim());
  }

  const list = bestInciListFromRawCandidates(candidates);
  return list.length >= 3 ? list : [];
}

export function extractAmazonProductTitle(html: string): string | null {
  const $ = cheerio.load(html);
  const t =
    $('#productTitle').first().text().trim() ||
    $('#titleSection #productTitle').first().text().trim() ||
    $('h1.a-size-large').first().text().trim();
  return t || null;
}

export function extractNykaaProductTitle(html: string): string | null {
  const $ = cheerio.load(html);
  const t =
    $('h1').first().text().trim() ||
    $('[class*="product-title"]').first().text().trim() ||
    $('[data-test-id="product-title"]').first().text().trim();
  return t || null;
}

/** Fetch PDP once; chain applies title / count / dedup gates. */
export async function scrapeNykaaPdpForIngredients(
  productUrl: string,
): Promise<{ names: string[]; pdpTitle: string | null } | null> {
  const html = await fetchPdpHtml(productUrl);
  if (!html) return null;
  const pdpTitle = extractNykaaProductTitle(html);
  const names = parseNykaaPdpIngredients(html);
  if (names.length < 3) return null;
  return { names, pdpTitle };
}

export async function scrapeAmazonInPdpForIngredients(
  productUrl: string,
): Promise<{ names: string[]; pdpTitle: string | null } | null> {
  const html = await fetchPdpHtml(productUrl);
  if (!html) return null;
  const pdpTitle = extractAmazonProductTitle(html);
  const names = parseAmazonInPdpIngredients(html);
  if (names.length < 3) return null;
  return { names, pdpTitle };
}

// ─── Myntra ───────────────────────────────────────────────────────────────────

export function extractMyntraProductTitle(html: string): string | null {
  const $ = cheerio.load(html);
  return (
    $('h1.pdp-title').first().text().trim() ||
    $('h1.pdp-name').first().text().trim() ||
    $('h1').first().text().trim() ||
    null
  );
}

/**
 * Myntra product pages are Next.js SSR — ingredients usually appear in:
 *   1. __NEXT_DATA__ JSON (deep key walk)
 *   2. A "Product Details" / "Key Features" section in the rendered HTML
 *      (class names like pdp-product-description-content, pdp-productDescriptorContainer)
 *   3. A <script> with window.__MAPP_STATE__ or similar embedded JSON
 */
export function parseMyntraPdpIngredients(html: string): string[] {
  // 1. __NEXT_DATA__ walk (same helper used for Nykaa)
  let list = parseNextDataIngredients(html);
  if (list.length >= 3) return list;

  // 2. Loose JSON pattern — Myntra sometimes embeds ingredient string in a
  //    script tag with keys like "keyIngredients", "ingredients", "productDetails"
  list = bestInciListFromRawCandidates(collectLooseJsonIngredientStrings(html));
  if (list.length >= 3) return list;

  // 3. window.__MAPP_STATE__ / window.__INITIAL_STATE__ embedded JSON
  const stateMatch = html.match(/window\.__(?:MAPP|INITIAL)_STATE__\s*=\s*(\{[\s\S]{1,2000000}\})\s*;/);
  if (stateMatch?.[1]) {
    try {
      const raw = deepFindIngredientsString(JSON.parse(stateMatch[1]) as unknown);
      if (raw) {
        const parsed = parseInciCommaList(raw);
        if (parsed.length >= 3) return parsed;
      }
    } catch {
      // ignore parse errors
    }
  }

  const $ = cheerio.load(html);

  // 4. PDP description content — Myntra renders product details in a div with
  //    class pdp-product-description-content or pdp-productDescriptorContainer
  const descEl = $(
    '[class*="pdp-product-description"], [class*="pdp-productDescriptor"], [class*="product-description"]',
  ).first();
  if (descEl.length) {
    const text = descEl.text().replace(/\s+/g, ' ').trim();
    if (looksLikeInciBlob(text)) {
      const parsed = parseInciCommaList(text);
      if (parsed.length >= 3) return parsed;
    }
  }

  // 5. Any row/section whose label mentions "ingredients"
  $('tr, li, p, span, div').each((_, el) => {
    const row = $(el).text().trim();
    if (/^ingredients?\s*:/i.test(row) && row.length > 50) {
      const raw = row.replace(/^[^:]*:\s*/i, '');
      const parsed = parseInciCommaList(raw);
      if (parsed.length >= 3 && parsed.length > list.length) list = parsed;
    }
  });
  if (list.length >= 3) return list;

  // 6. Regex scan through flattened HTML
  const flat = html.replace(/\s+/g, ' ');
  const rm = flat.match(
    /ingredients?\s*[:\s]+([^<]{40,6000}?)(?=(?:how to use|directions|about the brand|country of origin|best before|return|<\/div>\s*<div|<h[1-4]))/i,
  );
  if (rm?.[1]) {
    const text = cheerio.load(`<div>${rm[1]}</div>`)('div').text();
    const parsed = parseInciCommaList(text);
    if (parsed.length >= 3) return parsed;
  }

  return [];
}

/** Search Myntra for a product, get the first PDP URL, scrape ingredients. */
export async function scrapeMyntraForIngredients(
  brand: string,
  productName: string,
): Promise<{ names: string[]; pdpTitle: string | null } | null> {
  const query = `${brand} ${productName}`.trim();
  let pdpUrl: string | null = null;

  try {
    // Myntra search page — product tiles embed catalog IDs in anchor hrefs
    const searchUrl = `https://www.myntra.com/${encodeURIComponent(query)}`;
    const { data: searchHtml } = await axios.get<string>(searchUrl, {
      headers: {
        ...PDP_HEADERS,
        'Accept-Language': 'en-IN,en;q=0.9',
        Referer: 'https://www.myntra.com/',
      },
      timeout: 22000,
      responseType: 'text',
    });

    const $s = cheerio.load(searchHtml);

    // Product links look like "/category/brand/product-name/12345678/buy"
    // Pick the first well-formed one that belongs to beauty/skin category
    const anchors = $s('a[href*="/buy"]');
    anchors.each((_, el) => {
      if (pdpUrl) return;
      const href = $s(el).attr('href') ?? '';
      if (/\/\d{6,10}\/buy/.test(href)) {
        pdpUrl = href.startsWith('http') ? href : `https://www.myntra.com${href}`;
      }
    });

    // Fallback: look in __NEXT_DATA__ or embedded JSON for a catalog ID
    if (!pdpUrl) {
      const m = searchHtml.match(/"catalogId"\s*:\s*(\d{6,10})/);
      if (m) pdpUrl = `https://www.myntra.com/${m[1]}/buy`;
    }
  } catch {
    return null;
  }

  if (!pdpUrl) return null;

  const html = await fetchPdpHtml(pdpUrl);
  if (!html) return null;

  const pdpTitle = extractMyntraProductTitle(html);
  const names = parseMyntraPdpIngredients(html);
  if (names.length < 3) return null;
  return { names, pdpTitle };
}
