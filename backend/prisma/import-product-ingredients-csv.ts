/**
 * Merge curated product+INCI rows from CSV into Postgres without overwriting
 * existing catalog data.
 *
 * Rules:
 *   • Match product by brand name + product name (case-insensitive). Never update
 *     an existing product row.
 *   • If the product already has any product_ingredients rows, skip that CSV row
 *     entirely (no new links, no edits).
 *   • If the product is missing, create brand (find-first only, no brand updates)
 *     and product with category from CSV.
 *   • Ingredients: find by normalized INCI or create with source=manual.
 *     Never update an existing ingredient row.
 *   • Links: createMany with skipDuplicates; dedupe by ingredient id within CSV list.
 *
 * Usage (from backend/):
 *   npx ts-node prisma/import-product-ingredients-csv.ts
 *   npx ts-node prisma/import-product-ingredients-csv.ts --file=/path/to/file.csv
 *   npx ts-node prisma/import-product-ingredients-csv.ts --dry-run
 *   npx ts-node prisma/import-product-ingredients-csv.ts --source=my-batch --file=./prisma/data/foo.csv
 *
 * Env: DATABASE_URL (see backend/.env)
 */
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { basename, join } from 'path';
import { parse } from 'csv-parse/sync';
import { Prisma, PrismaClient, IngredientSource } from '@prisma/client';
import { parseInciCommaList } from './lib/external-ingredient-sources';

/** Longest-first so multi-word brands beat a single-token prefix. */
const KNOWN_BRAND_PREFIXES = [
  'Forest Essentials',
  'Clean & Clear',
  "Head & Shoulders",
  'The Derma Co',
  "L'Oréal Paris",
  "L'Oreal Paris",
  'Dot & Key',
  'Neutrogena',
  'Minimalist',
  'Mamaearth',
  'Cetaphil',
  'Clinique',
  'Himalaya',
  'Aqualogica',
  'Garnier',
  'Biotique',
  'CeraVe',
  'Indulekha',
  'Pantene',
  'Dove',
  'Simple',
  'Plum',
  'Nykaa',
  'Joy',
];

function normalizeInciForStorage(raw: string): string {
  return raw
    .replace(/^\*+/, '')
    .replace(/^\(And\)\s*/i, '')
    .replace(/^\([^)]{1,30}\)\s*/, '')
    .replace(/\s*\([^)]{1,30}\)/g, '')
    .replace(/\(\d+\.?\d*%?\)\s*$/, '')
    .replace(/\*+$/, '')
    .replace(/\\+$/, '')
    .replace(/,\s+/g, ',')
    .replace(/\s+-\s+/g, '-')
    .replace(/-\s+/g, '-')
    .trim();
}

function isValidInciName(inciName: string): boolean {
  const n = inciName.trim();
  if (n.length === 0 || n.length > 120) return false;
  if (/&[a-z]+;|&#\d+;/.test(n)) return false;
  if (/[0-9#*]\uFE0F?\u20E3/.test(n)) return false;
  // eslint-disable-next-line no-control-regex
  if (/\p{Extended_Pictographic}/u.test(n)) return false;
  if (/["\{\}\[\]]/.test(n)) return false;
  if (
    /advertiserId|axiom\.|selectionSignals|pastActivity|STORE_ONLY|currencyCode|priceAmount/i.test(n)
  )
    return false;
  if (/^[-–]\s+[A-Z]/.test(n)) return false;
  if (/https?:\/\/|www\./.test(n)) return false;
  if (/\\+"/.test(n)) return false;
  const englishWords =
    n.match(
      /\b(the|and|with|for|from|that|this|our|your|its|has|are|not|but|can|been|have|more|also|skin|face|body|wash|care|uses|gives|made|best|good|rich|deep|clean|bright|glow|moisture)\b/gi,
    ) ?? [];
  if (englishWords.length >= 4) return false;
  if (/^[a-z]/.test(n) && n.includes(' ')) return false;
  const letters = (n.match(/[A-Za-z]/g) ?? []).length;
  const upper = (n.match(/[A-Z]/g) ?? []).length;
  const words = n.split(/\s+/).filter(Boolean).length;
  if (letters >= 12 && upper / Math.max(letters, 1) > 0.85 && words >= 4) return false;
  return true;
}

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
  if (n.includes('niacinamide') || n.includes('retinol') || n.includes('vitamin c')) return 'Active';
  if (n.includes('water') || n.includes('aqua')) return 'Solvent';
  if (n.includes('fragrance') || n.includes('parfum')) return 'Fragrance';
  if (n.includes('phenoxy') || n.includes('paraben') || n.includes('benzoate')) return 'Preservative';
  return null;
}

function splitBrandFromFullLine(full: string): { brand: string; productName: string } {
  const t = full.trim();
  for (const prefix of KNOWN_BRAND_PREFIXES) {
    if (t.toLowerCase().startsWith(prefix.toLowerCase())) {
      return { brand: prefix, productName: t };
    }
  }
  const first = t.split(/\s+/)[0] ?? t;
  return { brand: first, productName: t };
}

function repairRowColumns(row: Record<string, string>): Record<string, string> {
  const category = (row['Category'] ?? '').trim();
  let brand = (row['Brand'] ?? '').trim();
  let productName = (row['Product Name'] ?? '').trim();
  let ingredients = (row['Ingredients (INCI Format)'] ?? '').trim();

  // Missing comma before quoted INCI: INCI string ended up under "Product Name".
  if (
    productName &&
    /^(Water|Aqua)\b/i.test(productName) &&
    productName.includes(',') &&
    (!ingredients || ingredients.length < 12)
  ) {
    ingredients = productName;
    const split = splitBrandFromFullLine(brand);
    brand = split.brand;
    productName = split.productName;
  }

  return {
    ...row,
    Category: category,
    Brand: brand,
    'Product Name': productName,
    'Ingredients (INCI Format)': ingredients,
  };
}

function resolveLeafSlug(csvCategory: string): string | null {
  const c = csvCategory.trim().toLowerCase();
  if (c.includes('skincare')) {
    if (c.includes('toner')) return 'toner';
    if (c.includes('cleanser') || c.includes('cleansers')) return 'face-wash';
  }
  if (c.includes('conditioner')) return 'conditioner';
  if (c.includes('shampoo') || c.includes('head & shoulders')) return 'shampoo';
  return null;
}

function legacyDepartmentFromCategory(category: string): string {
  const k = category.trim().toLowerCase();
  if (k.startsWith('skincare')) return 'Skincare';
  if (k.startsWith('haircare')) return 'Haircare';
  if (k.startsWith('bodycare')) return 'Bodycare';
  const head = category.split('-')[0]?.trim();
  return head || 'General';
}

function sourceTagFromPath(filePath: string): string {
  const base = basename(filePath, '.csv');
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `csv-import-${slug || 'unknown'}`;
}

function shouldSkipCategoryRow(category: string): boolean {
  if (!category) return true;
  if (/^research status|^important note|^products completed|^completion rate|^source priority|^additional batches/i.test(category))
    return true;
  return false;
}

async function findOrCreateIngredient(
  prisma: PrismaClient,
  rawName: string,
  dryRun: boolean,
): Promise<{ id: string; dedupeKey: string } | null> {
  if (!isValidInciName(rawName)) return null;
  const normalized = normalizeInciForStorage(rawName);
  if (normalized.length < 2) return null;
  const dedupeKey = normalized.toLowerCase();

  if (dryRun) return { id: '', dedupeKey };

  const exact = await prisma.ingredient.findUnique({ where: { inciName: normalized } });
  if (exact) return { ...exact, dedupeKey };

  const ci = await prisma.ingredient.findFirst({
    where: { inciName: { equals: normalized, mode: 'insensitive' } },
  });
  if (ci) return { ...ci, dedupeKey };

  try {
    const row = await prisma.ingredient.create({
      data: {
        inciName: normalized,
        displayName: normalized,
        function: guessIngredientFunction(normalized),
        source: IngredientSource.manual,
      },
    });
    return { ...row, dedupeKey };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const byExact = await prisma.ingredient.findUnique({ where: { inciName: normalized } });
      if (byExact) return { ...byExact, dedupeKey };
      const again = await prisma.ingredient.findFirst({
        where: { inciName: { equals: normalized, mode: 'insensitive' } },
      });
      if (again) return { ...again, dedupeKey };
    }
    throw e;
  }
}

async function findOrCreateBrandId(
  prisma: PrismaClient,
  brandName: string,
  dryRun: boolean,
): Promise<string | null> {
  const existing = await prisma.brand.findFirst({
    where: { name: { equals: brandName.trim(), mode: 'insensitive' } },
  });
  if (existing) return existing.id;
  if (dryRun) return null;

  const created = await prisma.brand.create({
    data: { name: brandName.trim() },
  });
  return created.id;
}

async function findProduct(
  prisma: PrismaClient,
  brandId: string,
  productName: string,
): Promise<{ id: string } | null> {
  return prisma.product.findFirst({
    where: {
      brandId,
      name: { equals: productName.trim(), mode: 'insensitive' },
      deletedAt: null,
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
}

function parseArgs(): { file: string; dryRun: boolean; sourceTag: string } {
  const argv = process.argv.slice(2);
  let file = join(__dirname, 'data', 'product-ingredients-database-part-1.csv');
  let dryRun = false;
  let sourceOverride: string | null = null;
  for (const a of argv) {
    if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--file=')) file = a.slice('--file='.length);
    else if (a.startsWith('--source=')) sourceOverride = a.slice('--source='.length).trim();
  }
  const sourceTag = sourceOverride || sourceTagFromPath(file);
  return { file, dryRun, sourceTag };
}

async function main() {
  const { file, dryRun, sourceTag } = parseArgs();
  if (!existsSync(file)) {
    console.error(`Missing CSV: ${file}`);
    process.exit(1);
  }

  const raw = readFileSync(file, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const prisma = new PrismaClient();
  const categoryBySlug = new Map<string, string>();
  for (const c of await prisma.productCategory.findMany({ select: { id: true, slug: true } })) {
    categoryBySlug.set(c.slug, c.id);
  }

  let skippedFooter = 0;
  let skippedHasIngredients = 0;
  let skippedNoValidInci = 0;
  let productsCreated = 0;
  let dryRunWouldCreateProducts = 0;
  let linksCreated = 0;
  let rowsProcessed = 0;

  try {
    for (const rawRow of rows) {
      const row = repairRowColumns(rawRow);
      const category = row['Category']?.trim() ?? '';
      const brandName = row['Brand']?.trim() ?? '';
      const productName = row['Product Name']?.trim() ?? '';
      const ingredientsRaw = row['Ingredients (INCI Format)']?.trim() ?? '';

      if (shouldSkipCategoryRow(category)) {
        skippedFooter++;
        continue;
      }
      if (!brandName || !productName || !ingredientsRaw) {
        skippedFooter++;
        continue;
      }

      rowsProcessed++;
      const leafSlug = resolveLeafSlug(category);
      const categoryId = leafSlug ? categoryBySlug.get(leafSlug) ?? null : null;
      if (!categoryId && leafSlug) {
        console.warn(`⚠️  No product_categories row for slug "${leafSlug}" — product will have null categoryId`);
      }

      const brandId = await findOrCreateBrandId(prisma, brandName, dryRun);
      if (!brandId) {
        dryRunWouldCreateProducts++;
        console.log(`[dry-run] would create brand + product: ${brandName} — ${productName}`);
      }

      let product =
        brandId != null ? await findProduct(prisma, brandId, productName) : null;

      if (!product && !dryRun && brandId != null) {
        await prisma.product.create({
          data: {
            brandId,
            name: productName.trim(),
            categoryId,
            categoryLegacy: legacyDepartmentFromCategory(category),
            subCategoryLegacy: category,
            markets: ['IN'],
            source: sourceTag,
          },
        });
        productsCreated++;
        product = await findProduct(prisma, brandId, productName);
      }
      if (!product && dryRun && brandId != null) {
        console.log(`[dry-run] would create product: ${brandName} — ${productName}`);
        dryRunWouldCreateProducts++;
      }
      if (!product) {
        const parsed = parseInciCommaList(ingredientsRaw);
        let wouldLinks = 0;
        const seen = new Set<string>();
        for (const rawName of parsed) {
          const trimmed = rawName.trim();
          if (trimmed.length < 2) continue;
          if (!isValidInciName(trimmed)) continue;
          const normalized = normalizeInciForStorage(trimmed);
          if (normalized.length < 2) continue;
          const key = normalized.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          wouldLinks++;
        }
        linksCreated += wouldLinks;
        continue;
      }

      const existingCount = await prisma.productIngredient.count({ where: { productId: product.id } });
      if (existingCount > 0) {
        skippedHasIngredients++;
        continue;
      }

      const parsed = parseInciCommaList(ingredientsRaw);
      const linkRows: Array<{
        productId: string;
        ingredientId: string;
        position: number;
        rawText: string;
        isStar: boolean;
      }> = [];
      const seenIngredientKeys = new Set<string>();
      let position = 0;

      for (const rawName of parsed) {
        const trimmed = rawName.trim();
        if (trimmed.length < 2) continue;
        const ing = await findOrCreateIngredient(prisma, trimmed, dryRun);
        if (!ing) {
          skippedNoValidInci++;
          continue;
        }
        if (seenIngredientKeys.has(ing.dedupeKey)) continue;
        seenIngredientKeys.add(ing.dedupeKey);
        linkRows.push({
          productId: product.id,
          ingredientId: ing.id,
          position,
          rawText: trimmed,
          isStar: false,
        });
        position += 1;
      }

      if (linkRows.length === 0) {
        console.warn(`⚠️  No valid INCI tokens for ${brandName} — ${productName}`);
        continue;
      }

      if (!dryRun) {
        const r = await prisma.productIngredient.createMany({
          data: linkRows,
          skipDuplicates: true,
        });
        linksCreated += r.count;
      } else {
        linksCreated += linkRows.length;
      }
    }

    console.log(`--- import-product-ingredients-csv (source=${sourceTag}) ---`);
    console.log(`Rows processed (product lines): ${rowsProcessed}`);
    console.log(
      `Products created: ${productsCreated}${dryRun ? `; dry-run would also create ~${dryRunWouldCreateProducts} (new brand/product)` : ''}`,
    );
    console.log(`Ingredient links inserted: ${linksCreated}${dryRun ? ' (dry-run estimate)' : ''}`);
    console.log(`Skipped (footer / empty): ${skippedFooter}`);
    console.log(`Skipped (product already had ingredients): ${skippedHasIngredients}`);
    console.log(`Skipped INCI tokens (invalid / filtered): ${skippedNoValidInci}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
