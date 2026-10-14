/**
 * Seeds body / hair / bath India catalog from `prisma/data/india-body-hair-catalog/catalog.csv`.
 * IDs: `in-bh-{id}-…` (no collision with skincare `in-{idx}-…`).
 *
 * Run via `prisma/seed.ts` or: npx ts-node prisma/seed-india-body-hair-catalog.ts
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  bodyHairDescriptionJson,
  loadBodyHairCatalogFromCsv,
  productIdForBodyHairRow,
  resolveBodyHairLeafSlug,
  type BodyHairCatalogRow,
} from './lib/body-hair-catalog';

const SOURCE = 'india-body-hair-catalog-seed';

export async function seedIndiaBodyHairCatalog(
  prisma: PrismaClient,
  opts?: { skipIfEmpty?: boolean },
): Promise<void> {
  const csvPath = join(__dirname, 'data', 'india-body-hair-catalog', 'catalog.csv');
  if (!existsSync(csvPath)) {
    if (opts?.skipIfEmpty) {
      console.log('⏭️  India body/hair catalog: no catalog.csv — skip');
      return;
    }
    throw new Error(`Missing ${csvPath}`);
  }

  let rows: BodyHairCatalogRow[];
  try {
    rows = loadBodyHairCatalogFromCsv(csvPath);
  } catch (e) {
    if (opts?.skipIfEmpty) {
      console.log('⏭️  India body/hair catalog: unreadable CSV — skip');
      return;
    }
    throw e;
  }

  if (rows.length === 0) {
    if (opts?.skipIfEmpty) {
      console.log('⏭️  India body/hair catalog: empty CSV — skip');
      return;
    }
    throw new Error('Body/hair catalog CSV has no rows');
  }

  console.log(`🇮🇳 Seeding India body/hair/bath catalog (${rows.length} rows)...`);

  const categoryBySlug = new Map<string, string>();
  const allCats = await prisma.productCategory.findMany({ select: { id: true, slug: true } });
  for (const c of allCats) categoryBySlug.set(c.slug, c.id);

  const nykaa = await prisma.retailer.upsert({
    where: { slug: 'nykaa' },
    update: {},
    create: { name: 'Nykaa', slug: 'nykaa', url: 'https://www.nykaa.com' },
  });
  await prisma.retailer.upsert({
    where: { slug: 'amazon-in' },
    update: {},
    create: { name: 'Amazon.in', slug: 'amazon-in', url: 'https://www.amazon.in' },
  });
  await prisma.retailer.upsert({
    where: { slug: 'flipkart' },
    update: {},
    create: { name: 'Flipkart', slug: 'flipkart', url: 'https://www.flipkart.com' },
  });

  const uniqueBrands = [...new Set(rows.map((r) => r.brand))];
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

  async function seedOne(row: BodyHairCatalogRow): Promise<void> {
    const brandId = brandIdByName.get(row.brand);
    if (!brandId) throw new Error(`Missing brand: ${row.brand}`);

    const leafSlug = resolveBodyHairLeafSlug(row.category, row.subcategory, row.product_type);
    const categoryId = leafSlug ? categoryBySlug.get(leafSlug) ?? null : null;
    if (!leafSlug) {
      console.warn(`⚠️  Unknown type — row ${row.id} ${row.product_name} (${row.category}/${row.subcategory}/${row.product_type})`);
    } else if (!categoryId) {
      console.warn(`⚠️  No category slug "${leafSlug}" — row ${row.id} ${row.product_name}`);
    }

    const id = productIdForBodyHairRow(row);
    const desc = bodyHairDescriptionJson(row);
    const legacyDept =
      row.category === 'bath-body'
        ? 'Bath & Body'
        : row.category.charAt(0).toUpperCase() + row.category.slice(1);

    await prisma.product.upsert({
      where: { id },
      create: {
        id,
        brandId,
        name: row.product_name,
        categoryId,
        categoryLegacy: legacyDept,
        subCategoryLegacy: `${row.subcategory} / ${row.product_type}`,
        markets: ['IN'],
        price: new Prisma.Decimal(row.price_inr.toFixed(2)),
        currency: 'INR',
        description: desc,
        source: SOURCE,
        sourceProductId: String(row.id),
      },
      update: {
        name: row.product_name,
        categoryId,
        categoryLegacy: legacyDept,
        subCategoryLegacy: `${row.subcategory} / ${row.product_type}`,
        markets: ['IN'],
        price: new Prisma.Decimal(row.price_inr.toFixed(2)),
        currency: 'INR',
        description: desc,
        source: SOURCE,
        sourceProductId: String(row.id),
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
        amount: new Prisma.Decimal(row.price_inr.toFixed(2)),
        currency: 'INR',
      },
      update: {
        amount: new Prisma.Decimal(row.price_inr.toFixed(2)),
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

  console.log(`✅ India body/hair/bath catalog: ${rows.length} products; Nykaa INR list prices`);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedIndiaBodyHairCatalog(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
