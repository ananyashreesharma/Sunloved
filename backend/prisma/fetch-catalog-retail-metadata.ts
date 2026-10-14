/**
 * Best-effort search-listing scrape: the matching Nykaa / Amazon.in / Flipkart listing per catalog
 * product (a hit only counts when its title is that product; see titleMatches).
 * Mirrors fetch-catalog-ingredients.ts CLI style (--limit, --skip, --dry-run, --delay-ms).
 *
 * Updates `Product.url` (prefers Nykaa), merges `retailListings` into `description` JSON,
 * upserts `ProductPrice` rows when a price is parsed from the search card.
 *
 * Default scope: `source = india-body-hair-catalog-seed`. Use --all-sources to include every product (heavy).
 *
 * Compliance: throttle; confirm use matches each site’s terms and robots.txt.
 */
import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { searchRetailersInOrder, type RetailListingHit } from './lib/external-retail-sources';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a === '--dry-run') out['dry-run'] = true;
    else if (a === '--all-sources') out['all-sources'] = true;
    else if (a === '--only-no-url') out['only-no-url'] = true;
    else if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
    }
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeDescriptionRetail(
  current: string | null,
  listings: Record<string, { url: string; priceInr?: number; fetchedAt: string }>,
): string {
  let o: Record<string, unknown> = {};
  try {
    if (current) o = JSON.parse(current) as Record<string, unknown>;
  } catch {
    o = { _unparsedDescription: current };
  }
  const prev = (o.retailListings as Record<string, unknown>) || {};
  o.retailListings = { ...prev, ...listings };
  return JSON.stringify(o);
}

const RETAILER_SLUG: Record<RetailListingHit['retailer'], string> = {
  nykaa: 'nykaa',
  'amazon-in': 'amazon-in',
  flipkart: 'flipkart',
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args['dry-run'] === true;
  const allSources = args['all-sources'] === true;
  const onlyNoUrl = args['only-no-url'] === true;
  const limit = args['limit'] ? parseInt(String(args['limit']), 10) : undefined;
  const skip = args['skip'] ? parseInt(String(args['skip']), 10) : 0;
  const delayMs = args['delay-ms']
    ? parseInt(String(args['delay-ms']), 10)
    : parseInt(process.env.FETCH_DELAY_MS || '2000', 10);

  const prisma = new PrismaClient();

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(allSources ? {} : { source: 'india-body-hair-catalog-seed' }),
    ...(onlyNoUrl ? { OR: [{ url: null }, { url: '' }] } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      url: true,
      brand: { select: { name: true } },
    },
    orderBy: { id: 'asc' },
    skip: Number.isFinite(skip) ? skip : 0,
    take: Number.isFinite(limit!) ? limit : undefined,
  });

  const retailers = await prisma.retailer.findMany({
    where: { slug: { in: ['nykaa', 'amazon-in', 'flipkart'] } },
    select: { id: true, slug: true },
  });
  const retailerIdBySlug = new Map(retailers.map((r) => [r.slug, r.id]));

  console.log(
    `Retail search metadata for ${products.length} product(s); delay=${delayMs}ms; dryRun=${dryRun}; onlyNoUrl=${onlyNoUrl}`,
  );

  let ok = 0;
  let miss = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const query = `${p.brand.name} ${p.name}`.slice(0, 200);
    process.stdout.write(`[${i + 1}/${products.length}] ${query.slice(0, 72)}… `);

    let hits: RetailListingHit[] = [];
    try {
      hits = await searchRetailersInOrder({ brand: p.brand.name, name: p.name }, ['nykaa', 'amazon-in', 'flipkart']);
    } catch {
      hits = [];
    }

    if (hits.length === 0) {
      console.log('no hits');
      miss += 1;
    } else {
      const fetchedAt = new Date().toISOString();
      const listings: Record<string, { url: string; priceInr?: number; fetchedAt: string }> = {};
      for (const h of hits) {
        listings[h.retailer] = {
          url: h.url,
          ...(h.priceInr != null ? { priceInr: h.priceInr } : {}),
          fetchedAt,
        };
      }

      const primaryUrl = hits.find((h) => h.retailer === 'nykaa')?.url ?? hits[0].url;

      if (!dryRun) {
        const newDesc = mergeDescriptionRetail(p.description, listings);
        await prisma.product.update({
          where: { id: p.id },
          data: {
            url: p.url || primaryUrl,
            description: newDesc,
            lastScrapedAt: new Date(),
          },
        });

        for (const h of hits) {
          const slug = RETAILER_SLUG[h.retailer];
          const rid = retailerIdBySlug.get(slug);
          if (!rid || h.priceInr == null) continue;
          await prisma.productPrice.upsert({
            where: {
              productId_retailerId_market: {
                productId: p.id,
                retailerId: rid,
                market: 'IN',
              },
            },
            create: {
              productId: p.id,
              retailerId: rid,
              market: 'IN',
              amount: new Prisma.Decimal(h.priceInr.toFixed(2)),
              currency: 'INR',
              url: h.url,
            },
            update: {
              amount: new Prisma.Decimal(h.priceInr.toFixed(2)),
              currency: 'INR',
              url: h.url,
            },
          });
        }
      }

      console.log(`ok (${hits.length} listings)`);
      ok += 1;
    }

    if (i < products.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  console.log(`\nDone. Updated: ${ok}, no hit: ${miss}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
