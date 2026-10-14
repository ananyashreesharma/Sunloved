/**
 * Backfill product_ingredients via INCIDecoder only (lenient URL pick by default — use --strict-incidecoder for fewer false positives).
 *
 * Many "no match" lines are normal: INCIDecoder may not list every regional SKU. Use --verbose for trace lines.
 *
 * Usage (from backend/):
 *   npx ts-node prisma/fetch-catalog-ingredients.ts --only-missing --limit=50
 *   npx ts-node prisma/fetch-catalog-ingredients.ts --dry-run --limit=5
 *   npx ts-node prisma/fetch-catalog-ingredients.ts --delay-ms=2000
 *   npx ts-node prisma/fetch-catalog-ingredients.ts --verbose
 *   npx ts-node prisma/fetch-catalog-ingredients.ts --strict-incidecoder
 *   npx ts-node prisma/fetch-catalog-ingredients.ts --skip-ingredient-count-gate
 *   npx ts-node prisma/fetch-catalog-ingredients.ts --skip-ingredient-dedup-gate
 *
 * Env: DATABASE_URL (required). Optional: FETCH_DELAY_MS overrides default delay between requests.
 *
 * Compliance: throttle requests; confirm your use matches each site’s terms and robots.txt.
 */

import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import type { ExternalFetchResult } from './lib/external-ingredient-sources';
import {
  fetchIngredientsWithFallback,
  type IngredientChainSource,
} from './lib/fetch-ingredients-chain';
import { nonCosmeticSkipReason } from './lib/ingredient-fetch-eligibility';

function guessIngredientFunction(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('glycerin') || n.includes('hyaluronic') || n.includes('humectant'))
    return 'Humectant';
  if (n.includes('oil') || n.includes('butter') || n.includes('squalane')) return 'Emollient';
  if (
    n.includes('acid') ||
    n.includes('salicylic') ||
    n.includes('glycolic') ||
    n.includes('lactic') ||
    n.includes('pha') ||
    n.includes('aha') ||
    n.includes('bha')
  )
    return 'Exfoliant';
  if (n.includes('niacinamide') || n.includes('retinol') || n.includes('vitamin c'))
    return 'Active';
  if (n.includes('water') || n.includes('aqua')) return 'Solvent';
  if (n.includes('fragrance') || n.includes('parfum') || n.includes('linalool'))
    return 'Fragrance';
  if (n.includes('phenoxy') || n.includes('paraben') || n.includes('benzoate')) return 'Preservative';
  return null;
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a === '--only-missing') out['only-missing'] = true;
    else if (a === '--dry-run') out['dry-run'] = true;
    else if (a === '--strict-incidecoder') out['strict-incidecoder'] = true;
    else if (a === '--verbose') out['verbose'] = true;
    else if (a === '--lenient-incidecoder') out['lenient-incidecoder'] = true;
    else if (a === '--skip-ingredient-count-gate') out['skip-ingredient-count-gate'] = true;
    else if (a === '--skip-ingredient-dedup-gate') out['skip-ingredient-dedup-gate'] = true;
    else if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v ?? 'true';
    }
  }
  return out;
}

/** Resolve ingredient by INCI (case-insensitive); create if missing. Handles P2002 if row appears between find and create. */
async function findOrCreateIngredient(
  prisma: PrismaClient,
  trimmed: string,
  sourceTag: string,
): Promise<{ id: string }> {
  const exact = await prisma.ingredient.findUnique({ where: { inciName: trimmed } });
  if (exact) return exact;

  const existing = await prisma.ingredient.findFirst({
    where: { inciName: { equals: trimmed, mode: 'insensitive' } },
  });
  if (existing) return existing;

  try {
    return await prisma.ingredient.create({
      data: {
        inciName: trimmed,
        displayName: trimmed,
        function: guessIngredientFunction(trimmed),
        // Keep enum-compatible value; sourceTag is used for logging/analytics, not persisted here.
        source: 'ai_generated',
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // Row exists with this exact `inciName` (unique hit) but case-insensitive find can miss under some collations.
      const byExact = await prisma.ingredient.findUnique({
        where: { inciName: trimmed },
      });
      if (byExact) return byExact;
      const again = await prisma.ingredient.findFirst({
        where: { inciName: { equals: trimmed, mode: 'insensitive' } },
      });
      if (again) return again;
    }
    throw e;
  }
}

async function applyIngredients(
  prisma: PrismaClient,
  productId: string,
  result: ExternalFetchResult,
  dryRun: boolean,
  sourceTag: IngredientChainSource,
): Promise<number> {
  if (dryRun) {
    const seen = new Set<string>();
    for (const rawName of result.names) {
      const trimmed = rawName.trim();
      if (trimmed.length < 2) continue;
      seen.add(trimmed.toLowerCase());
    }
    return seen.size;
  }

  // Avoid long interactive $transaction callbacks — they often hit P2028 with pooled DBs (e.g. Supabase).
  await prisma.productIngredient.deleteMany({ where: { productId } });

  const linkRows: Array<{
    productId: string;
    ingredientId: string;
    position: number;
    rawText: string;
    isStar: boolean;
  }> = [];

  const seenIngredientIds = new Set<string>();
  let position = 0;
  try {
    for (const rawName of result.names) {
      const trimmed = rawName.trim();
      if (trimmed.length < 2) continue;

      const ing = await findOrCreateIngredient(prisma, trimmed, sourceTag);
      if (seenIngredientIds.has(ing.id)) continue;
      seenIngredientIds.add(ing.id);

      linkRows.push({
        productId,
        ingredientId: ing.id,
        position,
        rawText: trimmed,
        isStar: false,
      });
      position += 1;
    }

    if (linkRows.length > 0) {
      await prisma.productIngredient.createMany({ data: linkRows });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { lastScrapedAt: new Date() },
    });
  } catch (e) {
    // Links were cleared; if we bail here, product stays without ingredients until next --only-missing run.
    throw e;
  }

  return linkRows.length;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const onlyMissing = args['only-missing'] === true;
  const dryRun = args['dry-run'] === true;
  const strictIncidecoder = args['strict-incidecoder'] === true;
  const lenientIncidecoder = !strictIncidecoder;
  const verbose = args['verbose'] === true;
  const skipIngredientCountGate = args['skip-ingredient-count-gate'] === true;
  const skipIngredientDedupGate = args['skip-ingredient-dedup-gate'] === true;
  const limit = args['limit'] ? parseInt(String(args['limit']), 10) : undefined;
  const skip = args['skip'] ? parseInt(String(args['skip']), 10) : 0;
  const delayMs = args['delay-ms']
    ? parseInt(String(args['delay-ms']), 10)
    : parseInt(process.env.FETCH_DELAY_MS || '1800', 10);

  const prisma = new PrismaClient();

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
  };

  if (onlyMissing) {
    where.ingredients = { none: {} };
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      brand: { select: { name: true } },
      category: { select: { slug: true } },
    },
    orderBy: { id: 'asc' },
    skip: Number.isFinite(skip) ? skip : 0,
    take: Number.isFinite(limit!) ? limit : undefined,
  });

  console.log(
    `Ingredient backfill (INCIDecoder only) for ${products.length} product(s); ` +
      `strictINCI=${strictIncidecoder}; countGate=${!skipIngredientCountGate}; dedupGate=${!skipIngredientDedupGate}; ` +
      `delay=${delayMs}ms; dryRun=${dryRun}; verbose=${verbose}`,
  );

  const seenIngredientLists: string[][] = [];

  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const brand = p.brand.name;
    const label = `[${i + 1}/${products.length}] ${brand} — ${p.name}`;
    process.stdout.write(`${label} … `);

    const skipReason = nonCosmeticSkipReason(p.name, p.category?.slug ?? null);
    if (skipReason) {
      console.log(`skipped (${skipReason})`);
      skipped += 1;
      if (i < products.length - 1 && delayMs > 0) await sleep(delayMs);
      continue;
    }

    let chain: { names: string[]; source: IngredientChainSource } | null = null;
    const trace = verbose ? [] as string[] : undefined;
    try {
      chain = await fetchIngredientsWithFallback(brand, p.name, {
        lenientIncidecoder,
        existingIngredientLists: seenIngredientLists,
        skipIngredientCountGate,
        skipIngredientDedupGate,
        trace,
      });
    } catch (e) {
      chain = null;
      if (verbose) console.warn('  → chain threw:', e);
    }

    if (!chain || chain.names.length === 0) {
      console.log('no match');
      if (verbose && trace && trace.length > 0) {
        for (const line of trace) console.warn(`  → ${line}`);
      }
      fail += 1;
    } else {
      const n = await applyIngredients(prisma, p.id, { names: chain.names }, dryRun, chain.source);
      console.log(`ok (${n} ingredients, ${chain.source})`);
      ok += 1;
      if (!dryRun) seenIngredientLists.push([...chain.names]);
    }

    if (i < products.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  console.log(`\nDone. Updated: ${ok}, missed: ${fail}, skipped (non-cosmetic): ${skipped}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
