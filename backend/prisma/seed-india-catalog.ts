/**
 * Seeds India-market catalog rows: brands, products, taxonomy `categoryId`, INR Nykaa list prices.
 * Loads every `prisma/data/india-catalog/part-*.ndjson` (merge sort by idx). Add part-05.ndjson, … for more SKUs.
 * Line shape: { idx, name, type, brand, dept, price, rating } — `type` must match PRODUCT_TYPE_TO_SLUG (skincare).
 * Legacy: `*.tsv` in the same folder.
 */
import { join } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { loadIndiaCatalogRowsFromDir, productIdForRow, type IndiaCatalogRow } from './lib/india-catalog-loader';

export type { IndiaCatalogRow } from './lib/india-catalog-loader';

/** Map spreadsheet "Type" → leaf category slug (see seed-categories.ts) */
const PRODUCT_TYPE_TO_SLUG: Record<string, string> = {
  'Face Wash': 'face-wash',
  'Micellar Water': 'micellar-water',
  'Cleansing Balm': 'cleansing-balm',
  'Cleansing Oil': 'cleansing-oil',
  'Face Scrub': 'face-scrub',
  'Cleansing Mousse': 'cleansing-mousse',
  Toner: 'toner',
  Essence: 'essence',
  'Facial Mist': 'facial-mist',
  'Toning Pads': 'toning-pad',
  'Face Serum': 'face-serum',
  'Vitamin C': 'vitamin-c',
  Niacinamide: 'niacinamide',
  'Gel / Cream / Lotion': 'cream-moisturiser',
  'Retinol Treatment': 'retinol-treatment',
  'AHA/BHA/PHA': 'aha-bha-pha',
  Ampoule: 'face-ampoule',
  'Face Oil': 'face-oil',
  'Eye Serum': 'eye-serum',
  'Night Cream': 'night-cream',
  'Eye Cream': 'eye-cream',
  'Lip Balm': 'lip-balm',
  'Hydrating Mist': 'face-mist-hydrating',
  'Sunscreen/SPF': 'spf-sunscreen',
  'Tinted SPF': 'tinted-spf',
  'SPF Lip Balm': 'spf-lip',
  'After Sun': 'after-sun',
  Sheet: 'sheet-mask',
  Overnight: 'overnight-mask',
  Clay: 'clay-mask',
  'Peel-Off': 'peel-off-mask',
  Gel: 'gel-mask',
  'Eye Patches': 'eye-patch',
  Chemical: 'chemical-exfoliator',
  Physical: 'physical-exfoliator',
  Enzyme: 'enzyme-exfoliator',
  'Lip Mask': 'lip-mask',
  'Lip Scrub': 'lip-scrub',
  'Lip Serum': 'lip-serum',
  'Face Roller': 'face-roller',
  'Gua Sha': 'gua-sha',
  'Cleansing Brush': 'cleansing-brush',
  'LED Device': 'led-device',
};

export function loadIndiaCatalogRows(dataDir = join(__dirname, 'data', 'india-catalog')): IndiaCatalogRow[] {
  return loadIndiaCatalogRowsFromDir(dataDir);
}

export async function seedIndiaCatalog(
  prisma: PrismaClient,
  opts?: { skipIfEmpty?: boolean },
): Promise<void> {
  const dataDir = join(__dirname, 'data', 'india-catalog');
  let rows: IndiaCatalogRow[];
  try {
    rows = loadIndiaCatalogRowsFromDir(dataDir);
  } catch {
    if (opts?.skipIfEmpty) {
      console.log('⏭️  India catalog: no prisma/data/india-catalog data — skip');
      return;
    }
    throw new Error('Missing or unreadable prisma/data/india-catalog');
  }
  if (rows.length === 0) {
    if (opts?.skipIfEmpty) {
      console.log('⏭️  India catalog: empty — skip');
      return;
    }
    throw new Error('India catalog files are empty (add part-*.ndjson under prisma/data/india-catalog)');
  }

  console.log(`🇮🇳 Seeding India skincare catalog (${rows.length} rows)...`);

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

    const slug = PRODUCT_TYPE_TO_SLUG[row.productType];
    const categoryId = slug ? categoryBySlug.get(slug) ?? null : null;
    if (!slug) {
      console.warn(`⚠️  Unknown product type "${row.productType}" — row ${row.idx} ${row.name}`);
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
        categoryLegacy: row.department || 'Skincare',
        subCategoryLegacy: row.productType,
        markets: ['IN'],
        price: new Prisma.Decimal(row.priceInr.toFixed(2)),
        currency: 'INR',
        overallScore: score,
        source: 'india-catalog-seed',
        sourceProductId: String(row.idx),
      },
      update: {
        name: row.name,
        categoryId,
        categoryLegacy: row.department || 'Skincare',
        subCategoryLegacy: row.productType,
        markets: ['IN'],
        price: new Prisma.Decimal(row.priceInr.toFixed(2)),
        currency: 'INR',
        overallScore: score ?? undefined,
        source: 'india-catalog-seed',
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

  console.log(`✅ India skincare catalog: ${rows.length} products, brands upserted, Nykaa INR prices`);
}
