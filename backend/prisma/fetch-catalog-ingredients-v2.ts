/**
 * Ingredient backfill v2 — better source chain for the India catalog.
 *
 * Source order (first hit that passes all gates wins):
 *   1) Open Beauty Facts JSON API   — free, no scraping, strong India + global coverage
 *   2) INCIDecoder, name-only query — Indian brands often listed by product name alone
 *   3) INCIDecoder, brand+name      — standard query, still useful for international SKUs
 *   4) Myntra PDP                   — retailer source (optional, gated)
 *
 * Gates (applied after every source hit):
 *   • Title gate  — for retail PDPs only: PDP title must match catalog brand+name
 *   • Count gate  — minimum ingredient count by product type
 *   • Dedup gate  — Jaccard check against lists already stored this run (avoids copy-paste PDPs)
 *
 * Garbage guard (applied per-ingredient before insert):
 *   • isValidInciName() — rejects Amazon JSON fragments, marketing sentences, HTML entities,
 *     emoji bullets, price values, URLs, and other scraper artifacts
 *
 * Normalization (applied before insert to prevent duplicates):
 *   • normalizeInciForStorage() — strips leading *, (And), inline parens, concentration
 *     annotations, trailing *, backslashes; normalises spaces around commas/hyphens
 *     so "1, 2-Hexanediol" and "1,2- Hexanediol*" both map to "1,2-Hexanediol"
 *
 * Usage (from backend/):
 *   npx ts-node prisma/fetch-catalog-ingredients-v2.ts --only-missing --limit=50
 *   npx ts-node prisma/fetch-catalog-ingredients-v2.ts --only-missing --limit=50 --skip=1000
 *   npx ts-node prisma/fetch-catalog-ingredients-v2.ts --dry-run --limit=5 --verbose
 *   npx ts-node prisma/fetch-catalog-ingredients-v2.ts --delay-ms=2500
 *   npx ts-node prisma/fetch-catalog-ingredients-v2.ts --skip-count-gate
 *   npx ts-node prisma/fetch-catalog-ingredients-v2.ts --skip-dedup-gate
 *
 * Env: DATABASE_URL (required). FETCH_DELAY_MS overrides default delay between products.
 */

import 'dotenv/config';
import axios from 'axios';
import { Prisma, PrismaClient } from '@prisma/client';
import { ingredientCountAcceptable, minIngredientsForProduct } from './lib/ingredient-count-gate';
import { isDuplicateIngredientList } from './lib/ingredient-dedup-gate';
import {
  parseInciCommaList,
  resolveINCIDecoderProductPath,
  parseINCIDecoderProductHtml,
} from './lib/external-ingredient-sources';
import { retailerTitleAcceptsIngredients } from './lib/product-title-match';
import {
  scrapeMyntraForIngredients,
} from './lib/retail-pdp-ingredients';

// ─── Types ───────────────────────────────────────────────────────────────────

type Source = 'openbeautyfacts' | 'incidecoder-name' | 'incidecoder-full' | 'myntra';

type FetchResult = { names: string[]; source: Source };

type GateOpts = {
  skipTitleGate: boolean;
  skipCountGate: boolean;
  skipDedupGate: boolean;
  existingLists: string[][];
  titleGateMinRatio: number;
};

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BOT_UA =
  'SunlovedCatalogBot/2.0 (+https://github.com) axios; ingredient research for local DB';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── INCI name validation ─────────────────────────────────────────────────────
//
// Mirrors the check in enrich-ingredients.ts — if the name is garbage we skip
// inserting it rather than polluting the ingredients table.

function isValidInciName(inciName: string): boolean {
  const n = inciName.trim();
  if (n.length === 0 || n.length > 120) return false;

  // HTML entities from bad scrapes (e.g. "&amp; impurities that lead to blackheads")
  if (/&[a-z]+;|&#\d+;/.test(n)) return false;

  // Keycap emoji (1️⃣) and other emoji bullets
  if (/[0-9#*]\uFE0F?\u20E3/.test(n)) return false;
  // eslint-disable-next-line no-control-regex
  if (/\p{Extended_Pictographic}/u.test(n)) return false;

  // JSON syntax characters
  if (/["\{\}\[\]]/.test(n)) return false;

  // Amazon ad/JS payload keywords
  if (
    /advertiserId|axiom\.|selectionSignals|pastActivity|STORE_ONLY|currencyCode|priceAmount/i.test(n)
  )
    return false;

  // Bullet-point marketing text
  if (/^[-–]\s+[A-Z]/.test(n)) return false;

  // URLs
  if (/https?:\/\/|www\./.test(n)) return false;

  // Escaped-quote scraper artifact
  if (/\\+"/.test(n)) return false;

  // Sentence-like: 4+ common English filler words → marketing text
  const englishWords =
    n.match(
      /\b(the|and|with|for|from|that|this|our|your|its|has|are|not|but|can|been|have|more|also|skin|face|body|wash|care|uses|gives|made|best|good|rich|deep|clean|bright|glow|moisture)\b/gi,
    ) ?? [];
  if (englishWords.length >= 4) return false;

  // Lowercase multi-word phrases are almost never valid INCI names
  if (/^[a-z]/.test(n) && n.includes(' ')) return false;

  // All-caps marketing blobs (allow short acronyms like BHA, AHA)
  const letters = (n.match(/[A-Za-z]/g) ?? []).length;
  const upper = (n.match(/[A-Z]/g) ?? []).length;
  const words = n.split(/\s+/).filter(Boolean).length;
  if (letters >= 12 && upper / Math.max(letters, 1) > 0.85 && words >= 4) return false;

  return true;
}

// ─── INCI name normalisation (dedup) ─────────────────────────────────────────
//
// Strip annotation noise from raw scraped names so that variant spellings of
// the same ingredient share a single DB row.
//
//   *Cocos Nucifera (Coconut) Oil  →  Cocos Nucifera Oil
//   1, 2-Hexanediol                →  1,2-Hexanediol
//   1,2- Hexanediol*               →  1,2-Hexanediol
//   1,2-Hexanediol (2.2%)          →  1,2-Hexanediol

function normalizeInciForStorage(raw: string): string {
  return raw
    .replace(/^\*+/, '')                  // leading *
    .replace(/^\(And\)\s*/i, '')          // (And) prefix
    .replace(/^\([^)]{1,30}\)\s*/, '')    // short leading parens group
    .replace(/\s*\([^)]{1,30}\)/g, '')    // inline common name, e.g. (Coconut)
    .replace(/\(\d+\.?\d*%?\)\s*$/, '')   // concentration annotation (2.2%)
    .replace(/\*+$/, '')                  // trailing *
    .replace(/\\+$/, '')                  // trailing backslash artifact
    .replace(/,\s+/g, ',')               // "1, 2" → "1,2"
    .replace(/\s+-\s+/g, '-')            // "A - B" → "A-B"
    .replace(/-\s+/g, '-')              // "1,2- Hex" → "1,2-Hex"
    .trim();
}

// ─── Gate checks ─────────────────────────────────────────────────────────────

function applyGates(
  names: string[],
  source: Source,
  brand: string,
  productName: string,
  pdpTitle: string | null | undefined,
  opts: GateOpts,
  trace: string[],
): FetchResult | null {
  const isRetailerPdp = source === 'myntra';

  if (isRetailerPdp && !opts.skipTitleGate) {
    if (!retailerTitleAcceptsIngredients(pdpTitle, brand, productName, opts.titleGateMinRatio)) {
      trace.push(
        `[${source}] title gate rejected: "${(pdpTitle ?? '').slice(0, 120)}" (try --skip-title-gate)`,
      );
      return null;
    }
  }

  if (!opts.skipCountGate && !ingredientCountAcceptable(names, productName)) {
    const need = minIngredientsForProduct(productName);
    trace.push(
      `[${source}] count gate: ${names.length} < ${need} required for this product type`,
    );
    return null;
  }

  if (
    !opts.skipDedupGate &&
    opts.existingLists.length > 0 &&
    isDuplicateIngredientList(names, opts.existingLists)
  ) {
    trace.push(`[${source}] dedup gate: list too similar to another product in this run`);
    return null;
  }

  return { names, source };
}

// ─── Source 1: Open Beauty Facts JSON API ────────────────────────────────────

const OBF_SEARCH = 'https://world.openbeautyfacts.org/cgi/search.pl';
const OBF_FIELDS =
  'product_name,brands,ingredients_text_en,ingredients_text,ingredients_text_with_allergens';

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreObfHit(
  hit: { product_name?: string; brands?: string },
  brand: string,
  name: string,
): number {
  const nb = normalizeKey(brand);
  const nn = normalizeKey(name);
  const hn = normalizeKey(hit.product_name ?? '');
  const hb = normalizeKey(typeof hit.brands === 'string' ? hit.brands : '');

  let score = 0;
  if (nb.length >= 3 && (hb.includes(nb) || hn.includes(nb))) score += 30;

  const nameTokens = nn.split(/\s+/).filter((t) => t.length > 2);
  for (const t of nameTokens) {
    if (hn.includes(t)) score += 6;
  }
  return score;
}

async function fetchOpenBeautyFacts(brand: string, name: string): Promise<FetchResult | null> {
  const query = `${brand} ${name}`.trim();
  let res: { data: unknown };
  try {
    res = await axios.get(OBF_SEARCH, {
      params: {
        search_terms: query,
        search_simple: 1,
        action: 'process',
        json: 1,
        fields: OBF_FIELDS,
        page_size: 10,
      },
      headers: { 'User-Agent': BOT_UA },
      timeout: 20000,
    });
  } catch {
    return null;
  }

  const body = res.data as { products?: Array<Record<string, string>> } | null;
  const products = Array.isArray(body?.products) ? body!.products : [];
  if (products.length === 0) return null;

  let bestHit: Record<string, string> | null = null;
  let bestScore = -1;
  for (const hit of products) {
    const sc = scoreObfHit(hit, brand, name);
    if (sc > bestScore) {
      bestScore = sc;
      bestHit = hit;
    }
  }

  if (!bestHit || bestScore < 10) return null;

  const raw =
    bestHit.ingredients_text_en ||
    bestHit.ingredients_text ||
    bestHit.ingredients_text_with_allergens ||
    '';

  if (!raw.trim()) return null;

  const names = parseInciCommaList(raw);
  if (names.length < 3) return null;
  return { names, source: 'openbeautyfacts' };
}

// ─── Source 2 & 3: INCIDecoder ───────────────────────────────────────────────

const INCIDECODER_BASE = 'https://incidecoder.com';
const INCI_HEADERS = {
  'User-Agent': BROWSER_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchINCIDecoder(
  brand: string,
  name: string,
  nameOnly: boolean,
): Promise<{ names: string[]; source: Source } | null> {
  const source: Source = nameOnly ? 'incidecoder-name' : 'incidecoder-full';
  try {
    const path = await resolveINCIDecoderProductPath(nameOnly ? '' : brand, name, {
      strict: false,
    });
    if (!path) return null;

    const url = path.startsWith('http') ? path : `${INCIDECODER_BASE}${path}`;
    const { data: html } = await axios.get<string>(url, {
      headers: INCI_HEADERS,
      timeout: 25000,
      responseType: 'text',
    });

    const names = parseINCIDecoderProductHtml(html);
    if (names.length === 0) return null;
    return { names, source };
  } catch {
    return null;
  }
}

// ─── Source 4: Myntra ────────────────────────────────────────────────────────

async function fetchMyntra(
  brand: string,
  name: string,
): Promise<{ names: string[]; pdpTitle: string | null; source: Source } | null> {
  const result = await scrapeMyntraForIngredients(brand, name);
  if (!result || result.names.length === 0) return null;
  return { names: result.names, pdpTitle: result.pdpTitle, source: 'myntra' };
}

// ─── Main source chain ────────────────────────────────────────────────────────

async function fetchIngredients(
  brand: string,
  name: string,
  stepDelayMs: number,
  gateOpts: GateOpts,
  verbose: boolean,
): Promise<FetchResult | null> {
  const trace: string[] = [];

  const obf = await fetchOpenBeautyFacts(brand, name);
  if (obf) {
    const r = applyGates(obf.names, obf.source, brand, name, null, gateOpts, trace);
    if (r) return r;
  } else {
    trace.push('openbeautyfacts: no matching product found');
  }

  await sleep(stepDelayMs);

  const inciName = await fetchINCIDecoder(brand, name, true);
  if (inciName) {
    const r = applyGates(inciName.names, inciName.source, brand, name, null, gateOpts, trace);
    if (r) return r;
  } else {
    trace.push('incidecoder (name-only): no search hit or empty ingredient section');
  }

  await sleep(stepDelayMs);

  const inciFull = await fetchINCIDecoder(brand, name, false);
  if (inciFull) {
    const r = applyGates(inciFull.names, inciFull.source, brand, name, null, gateOpts, trace);
    if (r) return r;
  } else {
    trace.push('incidecoder (brand+name): no search hit or empty ingredient section');
  }

  await sleep(stepDelayMs);

  // 4. Myntra — good coverage for Indian skincare & beauty brands
  const myntra = await fetchMyntra(brand, name);
  if (myntra) {
    const r = applyGates(myntra.names, myntra.source, brand, name, myntra.pdpTitle, gateOpts, trace);
    if (r) return r;
  } else {
    trace.push('myntra: no product found or ingredient section missing');
  }
  trace.push('amazon-in: disabled (never used)');

  if (verbose) {
    for (const line of trace) console.warn(`  → ${line}`);
  }
  return null;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

function guessIngredientFunction(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('glycerin') || n.includes('hyaluronic')) return 'Humectant';
  if (n.includes('oil') || n.includes('butter') || n.includes('squalane')) return 'Emollient';
  if (
    n.includes('acid') ||
    n.includes('salicylic') ||
    n.includes('glycolic') ||
    n.includes('lactic')
  )
    return 'Exfoliant';
  if (n.includes('niacinamide') || n.includes('retinol') || n.includes('vitamin c'))
    return 'Active';
  if (n.includes('water') || n.includes('aqua')) return 'Solvent';
  if (n.includes('fragrance') || n.includes('parfum')) return 'Fragrance';
  if (n.includes('phenoxy') || n.includes('paraben') || n.includes('benzoate'))
    return 'Preservative';
  return null;
}

/**
 * Find or create an ingredient record for the given raw INCI name.
 *
 * Steps:
 *   1. Validate — skip garbage names (JSON fragments, marketing text, etc.)
 *   2. Normalize — clean up annotation noise to unify spelling variants
 *   3. Lookup — exact match on normalized name, then case-insensitive
 *   4. Create — insert if not found, handle P2002 race condition
 *
 * Returns null when the name is invalid (caller should skip the position).
 */
async function findOrCreateIngredient(
  prisma: PrismaClient,
  rawName: string,
): Promise<{ id: string; inciName: string } | null> {
  // 1. Validate against garbage
  if (!isValidInciName(rawName)) return null;

  // 2. Normalize to prevent spelling-variant duplicates
  const normalized = normalizeInciForStorage(rawName);
  if (normalized.length < 2) return null;

  // 3a. Exact match on normalized name
  const exact = await prisma.ingredient.findUnique({ where: { inciName: normalized } });
  if (exact) return exact;

  // 3b. Case-insensitive match
  const ci = await prisma.ingredient.findFirst({
    where: { inciName: { equals: normalized, mode: 'insensitive' } },
  });
  if (ci) return ci;

  // 4. Create
  try {
    return await prisma.ingredient.create({
      data: {
        inciName: normalized,
        displayName: normalized,
        function: guessIngredientFunction(normalized),
        source: 'ai_generated',
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // Race condition — created between our check and create
      const byExact = await prisma.ingredient.findUnique({ where: { inciName: normalized } });
      if (byExact) return byExact;
      const again = await prisma.ingredient.findFirst({
        where: { inciName: { equals: normalized, mode: 'insensitive' } },
      });
      if (again) return again;
    }
    throw e;
  }
}

async function applyIngredients(
  prisma: PrismaClient,
  productId: string,
  result: FetchResult,
  dryRun: boolean,
  verbose: boolean,
): Promise<{ inserted: number; skippedGarbage: number }> {
  let skippedGarbage = 0;

  if (dryRun) {
    const seen = new Set<string>();
    for (const rawName of result.names) {
      const trimmed = rawName.trim();
      if (trimmed.length < 2) continue;
      if (!isValidInciName(trimmed)) {
        skippedGarbage++;
        if (verbose) console.warn(`    skip garbage: ${trimmed.slice(0, 80)}`);
        continue;
      }
      seen.add(normalizeInciForStorage(trimmed).toLowerCase());
    }
    return { inserted: seen.size, skippedGarbage };
  }

  // Clear existing links for this product so we can re-seed cleanly
  await prisma.productIngredient.deleteMany({ where: { productId } });

  const rows: Array<{
    productId: string;
    ingredientId: string;
    position: number;
    rawText: string;
    isStar: boolean;
  }> = [];

  const seenIds = new Set<string>();
  let position = 0;

  for (const rawName of result.names) {
    const trimmed = rawName.trim();
    if (trimmed.length < 2) continue;

    const ing = await findOrCreateIngredient(prisma, trimmed);

    if (!ing) {
      skippedGarbage++;
      if (verbose) console.warn(`    skip garbage: ${trimmed.slice(0, 80)}`);
      continue;
    }

    if (seenIds.has(ing.id)) continue; // duplicate after normalization

    seenIds.add(ing.id);
    rows.push({
      productId,
      ingredientId: ing.id,
      position,
      rawText: trimmed,   // keep original text for display/debug
      isStar: false,
    });
    position += 1;
  }

  if (rows.length > 0) {
    await prisma.productIngredient.createMany({ data: rows });
  }

  await prisma.product.update({
    where: { id: productId },
    data: { lastScrapedAt: new Date() },
  });

  return { inserted: rows.length, skippedGarbage };
}

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v !== undefined ? v : true;
    }
  }
  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const onlyMissing = args['only-missing'] === true;
  const dryRun = args['dry-run'] === true;
  const verbose = args['verbose'] === true;
  const skipTitleGate = args['skip-title-gate'] === true;
  const skipCountGate = args['skip-count-gate'] === true;
  const skipDedupGate = args['skip-dedup-gate'] === true;
  const limit = args['limit'] ? parseInt(String(args['limit']), 10) : undefined;
  const skipN = args['skip'] ? parseInt(String(args['skip']), 10) : 0;
  const delayMs = args['delay-ms']
    ? parseInt(String(args['delay-ms']), 10)
    : parseInt(process.env.FETCH_DELAY_MS || '2000', 10);
  const stepDelayMs = Math.max(400, Math.floor(delayMs / 4));

  const prisma = new PrismaClient();

  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (onlyMissing) where.ingredients = { none: {} };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      brand: { select: { name: true } },
    },
    orderBy: { id: 'asc' },
    skip: Number.isFinite(skipN) ? skipN : 0,
    take: Number.isFinite(limit!) ? limit : undefined,
  });

  console.log(
    `\n[v2] OBF → INCIDecoder(name) → INCIDecoder(full) → Myntra` +
      `\nProducts : ${products.length}` +
      `\nOptions  : delay=${delayMs}ms dryRun=${dryRun} onlyMissing=${onlyMissing} verbose=${verbose}` +
      `\nGarbage guard + normalization ENABLED — duplicates and junk INCI names will be skipped.\n`,
  );

  const existingLists: string[][] = [];
  let ok = 0;
  let fail = 0;
  let totalGarbageSkipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const brand = p.brand.name;
    const label = `[${i + 1}/${products.length}] ${brand} — ${p.name.slice(0, 50)}`;
    process.stdout.write(`${label} … `);

    const gateOpts: GateOpts = {
      skipTitleGate,
      skipCountGate,
      skipDedupGate,
      existingLists,
      titleGateMinRatio: 0.3,
    };

    const result = await fetchIngredients(brand, p.name, stepDelayMs, gateOpts, verbose);

    if (!result || result.names.length === 0) {
      console.log('no match');
      fail += 1;
    } else {
      const { inserted, skippedGarbage } = await applyIngredients(
        prisma,
        p.id,
        result,
        dryRun,
        verbose,
      );
      const garbageNote = skippedGarbage > 0 ? ` (${skippedGarbage} garbage skipped)` : '';
      console.log(`ok — ${inserted} ingredients (${result.source})${garbageNote}`);
      ok += 1;
      totalGarbageSkipped += skippedGarbage;
      if (!dryRun) existingLists.push([...result.names]);
    }

    if (i < products.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  console.log(`
─────────────────────────────────────
Products updated : ${ok}
Products missed  : ${fail}
Garbage skipped  : ${totalGarbageSkipped} ingredient names across all products
─────────────────────────────────────
${dryRun ? 'DRY RUN — no data was written.' : 'Run enrich-ingredients.ts --only-empty next to fill in INCIDecoder metadata.'}
`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
