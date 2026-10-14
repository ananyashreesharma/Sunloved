/**
 * OPTIONAL — only for a catalog whose `type` values are makeup (Foundation, Mascara, …).
 * This is NOT the same as “the next 1000 skincare rows”: those belong in `data/india-catalog/`
 * with the same `type` strings as part-01..04 (Face Wash, Toner, …); `seed-india-catalog` loads every part-*.ndjson there.
 *
 * Data: `prisma/data/india-makeup-catalog/part-*.ndjson`
 * Stub generator: `npm run prisma:generate:makeup-catalog`
 */
import { join } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { loadIndiaCatalogRowsFromDir, productIdForRow, type IndiaCatalogRow } from './lib/india-catalog-loader';

/** Map spreadsheet "Type" → leaf slug under `makeup` in seed-categories.ts */
const MAKEUP_PRODUCT_TYPE_TO_SLUG: Record<string, string> = {
  Foundation: 'foundation',
  Concealer: 'concealer',
  Primer: 'primer',
  Blush: 'blush',
  Bronzer: 'bronzer',
  'Setting Powder': 'setting-powder',
  'Setting Spray': 'setting-spray',
  'BB / CC Cream': 'bb-cc-cream',
  Mascara: 'mascara',
  Eyeliner: 'eyeliner',
  Eyeshadow: 'eyeshadow',
  Eyebrow: 'eyebrow',
  Lipstick: 'lipstick',
  'Lip Gloss': 'lip-gloss',
  'Lip Liner': 'lip-liner',
  'Lip Tint': 'lip-tint',
};

export async function seedIndiaMakeupCatalog(
  prisma: PrismaClient,
  opts?: { skipIfEmpty?: boolean },
): Promise<void> {
  const dataDir = join(__dirname, 'data', 'india-makeup-catalog');
  let rows: IndiaCatalogRow[];
  try {
    rows = loadIndiaCatalogRowsFromDir(dataDir);
  } catch {
    if (opts?.skipIfEmpty) {
      console.log('⏭️  India makeup catalog: no prisma/data/india-makeup-catalog — skip');
      return;
    }
    throw new Error('Missing or unreadable prisma/data/india-makeup-catalog');
  }
  if (rows.length === 0) {
    if (opts?.skipIfEmpty) {
      console.log('⏭️  India makeup catalog: empty — skip');
      return;
    }
    throw new Error(
      'India makeup catalog is empty. Run: npm run prisma:generate:makeup-catalog',
    );
  }

  console.log(`💄 Seeding India makeup catalog (${rows.length} rows)...`);

  const categoryBySlug = new Map<string, string>();
  const allCats = await prisma.productCategory.findMany({ select: { id: true, slug: true } });
  for (const c of allCats) categoryBySlug.set(c.slug, c.id);

  const nykaa = await prisma.retailer.upsert({
    where: { slug: 'nykaa' },
    update: {},
    create: { name: 'Nykaa', slug: 'nykaa', url: 'https://www.nykaa.com' },
  });

  const uniqueBrands = [...new Set(rows.map((r) => r.brandName))];
  console.log(`   … upserting ${uniqueBrands.length} brands`);
  for (const name of uniqueBrands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const brands = await prisma.brand.findMany({
    where: { name: { in: uniqueBrands } },
    select: { id: true, name: true },
  });
  const brandIdByName = new Map(brands.map((b) => [b.name, b.id]));

  const CONCURRENCY = 12;
  async function seedOne(row: IndiaCatalogRow): Promise<void> {
    const brandId = brandIdByName.get(row.brandName);
    if (!brandId) throw new Error(`Missing brand: ${row.brandName}`);

    const slug = MAKEUP_PRODUCT_TYPE_TO_SLUG[row.productType];
    const categoryId = slug ? categoryBySlug.get(slug) ?? null : null;
    if (!slug) {
      console.warn(`⚠️  Unknown makeup type "${row.productType}" — row ${row.idx} ${row.name}`);
    } else if (!categoryId) {
      console.warn(`⚠️  No category slug "${slug}" — row ${row.idx} ${row.name}`);
    }

    const id = productIdForRow(row);
    const score =
      row.rating != null ? new Prisma.Decimal(row.rating.toFixed(2)) : undefined;

    await prisma.product.upsert({
      where: { id },
      create: {
        id,
        brandId,
        name: row.name,
        categoryId,
        categoryLegacy: row.department || 'Makeup',
        subCategoryLegacy: row.productType,
        markets: ['IN'],
        price: new Prisma.Decimal(row.priceInr.toFixed(2)),
        currency: 'INR',
        overallScore: score,
        source: 'india-makeup-catalog-seed',
        sourceProductId: String(row.idx),
      },
      update: {
        name: row.name,
        categoryId,
        categoryLegacy: row.department || 'Makeup',
        subCategoryLegacy: row.productType,
        markets: ['IN'],
        price: new Prisma.Decimal(row.priceInr.toFixed(2)),
        currency: 'INR',
        overallScore: score ?? undefined,
        source: 'india-makeup-catalog-seed',
        sourceProductId: String(row.idx),
      },
    });

    await prisma.productPrice.upsert({
      where: {
        productId_retailerId_market: {
          productId: id,
          retailerId: nykaa.id,
          market: 'IN',
        },
      },
      create: {
        productId: id,
        retailerId: nykaa.id,
        market: 'IN',
        amount: new Prisma.Decimal(row.priceInr.toFixed(2)),
        currency: 'INR',
      },
      update: {
        amount: new Prisma.Decimal(row.priceInr.toFixed(2)),
        currency: 'INR',
      },
    });
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((row) => seedOne(row)));
    if ((i + CONCURRENCY) % 200 === 0 || i + CONCURRENCY >= rows.length) {
      console.log(`   … ${Math.min(i + CONCURRENCY, rows.length)} / ${rows.length}`);
    }
  }

  console.log(`✅ India makeup catalog: ${rows.length} products, Nykaa INR prices`);
}

async function cli() {
  const prisma = new PrismaClient();
  try {
    await seedIndiaMakeupCatalog(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cli().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
