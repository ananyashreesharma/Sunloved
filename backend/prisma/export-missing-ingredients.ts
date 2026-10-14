/**
 * Export products with zero ingredient links to CSV (for manual review / alternate sources).
 *
 * Usage (from backend/):
 *   npm run prisma:export-missing-ingredients
 *   npx ts-node prisma/export-missing-ingredients.ts --out=./prisma/data/missing-ingredients.csv
 */

import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { PrismaClient } from '@prisma/client';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseArgs(argv: string[]): { out: string } {
  let out = resolve(__dirname, 'data', 'missing-ingredients.csv');
  for (const a of argv) {
    if (a.startsWith('--out=')) {
      out = resolve(process.cwd(), a.slice('--out='.length));
    }
  }
  return { out };
}

async function main() {
  const { out } = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  const rows = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ingredients: { none: {} },
    },
    select: {
      id: true,
      name: true,
      sourceProductId: true,
      subCategoryLegacy: true,
      categoryLegacy: true,
      brand: { select: { name: true } },
      category: { select: { slug: true, name: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  const header = [
    'id',
    'brand',
    'name',
    'category_slug',
    'category_name',
    'sub_category_legacy',
    'department_legacy',
    'source_product_id',
  ].join(',');

  const lines = rows.map((r) =>
    [
      csvEscape(r.id),
      csvEscape(r.brand.name),
      csvEscape(r.name),
      csvEscape(r.category?.slug ?? ''),
      csvEscape(r.category?.name ?? ''),
      csvEscape(r.subCategoryLegacy ?? ''),
      csvEscape(r.categoryLegacy ?? ''),
      csvEscape(r.sourceProductId ?? ''),
    ].join(','),
  );

  const body = [header, ...lines].join('\n') + '\n';

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, body, 'utf8');

  console.log(`Wrote ${rows.length} row(s) to ${out}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
