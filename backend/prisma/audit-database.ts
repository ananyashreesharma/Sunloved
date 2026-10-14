/**
 * Read-only health check of the catalogue and ingredient data: how much of it is rated, sourced,
 * linked and up to date. Every query runs inside a READ ONLY transaction, so this cannot change
 * anything even by mistake. Prints counts and small samples only, never user details.
 *
 *   npx ts-node --transpile-only prisma/audit-database.ts
 */
import { PrismaClient } from '@prisma/client';

type Check = { label: string; sql: string; sample?: string };

const CHECKS: Check[] = [
  // Products
  { label: 'Products (live)', sql: `SELECT count(*) FROM products WHERE "deletedAt" IS NULL` },
  { label: 'Products by source', sql: `SELECT coalesce(source,'(none)') AS k, count(*) FROM products WHERE "deletedAt" IS NULL GROUP BY 1 ORDER BY 2 DESC` },
  { label: 'Products by country', sql: `SELECT coalesce(country,'(none)') AS k, count(*) FROM products WHERE "deletedAt" IS NULL GROUP BY 1 ORDER BY 2 DESC` },
  {
    label: 'Products with NO ingredient list (cannot be judged)',
    sql: `SELECT count(*) FROM products p WHERE "deletedAt" IS NULL AND NOT EXISTS (SELECT 1 FROM product_ingredients pi WHERE pi."productId" = p.id)`,
    sample: `SELECT p.name FROM products p WHERE "deletedAt" IS NULL AND NOT EXISTS (SELECT 1 FROM product_ingredients pi WHERE pi."productId" = p.id) LIMIT 5`,
  },
  { label: 'Products with fewer than 4 ingredients (likely truncated)', sql: `SELECT count(*) FROM (SELECT "productId" FROM product_ingredients GROUP BY 1 HAVING count(*) < 4) t` },
  { label: 'Products with no barcode', sql: `SELECT count(*) FROM products WHERE "deletedAt" IS NULL AND (barcode IS NULL OR barcode = '')` },
  { label: 'Products with no retailer URL', sql: `SELECT count(*) FROM products WHERE "deletedAt" IS NULL AND (url IS NULL OR url = '')` },
  { label: 'Products with no image', sql: `SELECT count(*) FROM products WHERE "deletedAt" IS NULL AND ("imageUrl" IS NULL OR "imageUrl" = '')` },
  { label: 'Products with no category', sql: `SELECT count(*) FROM products WHERE "deletedAt" IS NULL AND "categoryId" IS NULL` },
  { label: 'Products priced in USD (default) but sold in India', sql: `SELECT count(*) FROM products WHERE "deletedAt" IS NULL AND country = 'IN' AND currency = 'USD'` },
  {
    label: 'Duplicate products (same brand + name)',
    sql: `SELECT count(*) FROM (SELECT "brandId", lower(trim(name)) FROM products WHERE "deletedAt" IS NULL GROUP BY 1, 2 HAVING count(*) > 1) t`,
    sample: `SELECT min(name) FROM products WHERE "deletedAt" IS NULL GROUP BY "brandId", lower(trim(name)) HAVING count(*) > 1 LIMIT 5`,
  },
  { label: 'Duplicate barcodes', sql: `SELECT count(*) FROM (SELECT barcode FROM products WHERE barcode <> '' AND "deletedAt" IS NULL GROUP BY 1 HAVING count(*) > 1) t` },
  { label: 'Products with a gap or repeat in ingredient positions', sql: `SELECT count(*) FROM (SELECT "productId" FROM product_ingredients GROUP BY 1 HAVING count(DISTINCT position) <> count(*) OR max(position) - min(position) + 1 <> count(*)) t` },
  { label: 'Product prices older than 180 days', sql: `SELECT count(*) FROM product_prices WHERE "createdAt" < now() - interval '180 days'` },

  // Ingredients
  { label: 'Ingredients', sql: `SELECT count(*) FROM ingredients` },
  { label: 'Ingredients by zone', sql: `SELECT coalesce(zone::text,'(unrated)') AS k, count(*) FROM ingredients GROUP BY 1 ORDER BY 2 DESC` },
  { label: 'Ingredients by source', sql: `SELECT coalesce(source::text,'(none)') AS k, count(*) FROM ingredients GROUP BY 1 ORDER BY 2 DESC` },
  {
    label: 'Unrated ingredients that products actually use',
    sql: `SELECT count(DISTINCT i.id) FROM ingredients i JOIN product_ingredients pi ON pi."ingredientId" = i.id WHERE i.zone IS NULL`,
    sample: `SELECT i."inciName", count(*) AS uses FROM ingredients i JOIN product_ingredients pi ON pi."ingredientId" = i.id WHERE i.zone IS NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
  },
  {
    label: 'AI-generated ratings never reviewed by a person (in use)',
    sql: `SELECT count(DISTINCT i.id) FROM ingredients i JOIN product_ingredients pi ON pi."ingredientId" = i.id WHERE i.source = 'ai_generated' AND i."lastReviewedAt" IS NULL`,
    sample: `SELECT i."inciName", i.zone, count(*) AS uses FROM ingredients i JOIN product_ingredients pi ON pi."ingredientId" = i.id WHERE i.source = 'ai_generated' AND i."lastReviewedAt" IS NULL GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10`,
  },
  {
    label: 'RED ingredients that are not hand-checked',
    sql: `SELECT count(*) FROM ingredients WHERE zone = 'red' AND source IS DISTINCT FROM 'manual'`,
    sample: `SELECT "inciName", source FROM ingredients WHERE zone = 'red' AND source IS DISTINCT FROM 'manual' LIMIT 10`,
  },
  { label: 'Zone and safetyRating disagree', sql: `SELECT count(*) FROM ingredients WHERE (zone = 'red' AND "safetyRating" <> 'avoid') OR (zone = 'yellow' AND "safetyRating" <> 'caution') OR (zone = 'green' AND "safetyRating" <> 'safe')` },
  { label: 'Rated but no description', sql: `SELECT count(*) FROM ingredients WHERE zone IS NOT NULL AND ("shortDescription" IS NULL OR "shortDescription" = '')` },
  {
    label: 'Banned by a regulator but rated green',
    sql: `SELECT count(*) FROM ingredients WHERE zone = 'green' AND "regionNotes"::text LIKE '%prohibited%'`,
    sample: `SELECT "inciName", "regionNotes" FROM ingredients WHERE zone = 'green' AND "regionNotes"::text LIKE '%prohibited%' LIMIT 10`,
  },
  {
    label: 'Fragrance rows not rated caution or worse',
    sql: `SELECT count(*) FROM ingredients WHERE "inciName" ~* '(^|[^a-z])(parfum|fragrance)([^a-z]|$)' AND "inciName" !~* 'free' AND zone IS DISTINCT FROM 'yellow' AND zone IS DISTINCT FROM 'red'`,
    sample: `SELECT "inciName", zone FROM ingredients WHERE "inciName" ~* '(^|[^a-z])(parfum|fragrance)([^a-z]|$)' AND "inciName" !~* 'free' AND zone IS DISTINCT FROM 'yellow' AND zone IS DISTINCT FROM 'red' LIMIT 10`,
  },
  {
    label: 'Parabens rated green (the apps treat unrated parabens as avoid)',
    sql: `SELECT count(*) FROM ingredients WHERE "isParaben" AND zone = 'green'`,
    sample: `SELECT "inciName" FROM ingredients WHERE "isParaben" AND zone = 'green' LIMIT 10`,
  },
  {
    label: 'Duplicate ingredients (same name ignoring case/punctuation)',
    sql: `SELECT count(*) FROM (SELECT regexp_replace(lower("inciName"), '[^a-z0-9]', '', 'g') FROM ingredients GROUP BY 1 HAVING count(*) > 1) t`,
    sample: `SELECT string_agg("inciName", ' | ') FROM ingredients GROUP BY regexp_replace(lower("inciName"), '[^a-z0-9]', '', 'g') HAVING count(*) > 1 LIMIT 8`,
  },
  {
    label: 'Ingredient rows that look like marketing text or garbage',
    sql: `SELECT count(*) FROM ingredients WHERE length("inciName") > 80 OR "inciName" ~ '[!?]' OR "inciName" ~* '\\m(helps|reduces|skin tone|apply|free from|boosts|glow)\\M' OR "inciName" ~ '^[a-z ]+$' OR "inciName" ~ '([A-Z] ){4,}'`,
    sample: `SELECT "inciName" FROM ingredients WHERE length("inciName") > 80 OR "inciName" ~ '[!?]' OR "inciName" ~* '\\m(helps|reduces|skin tone|apply|free from|boosts|glow)\\M' OR "inciName" ~ '^[a-z ]+$' OR "inciName" ~ '([A-Z] ){4,}' LIMIT 10`,
  },
  { label: 'Ingredients no product uses', sql: `SELECT count(*) FROM ingredients i WHERE NOT EXISTS (SELECT 1 FROM product_ingredients pi WHERE pi."ingredientId" = i.id)` },
  { label: 'Ratings not reviewed in over a year', sql: `SELECT count(*) FROM ingredients WHERE zone IS NOT NULL AND ("lastReviewedAt" IS NULL OR "lastReviewedAt" < now() - interval '365 days')` },

  // Queues waiting on a person
  { label: 'Label submissions by status', sql: `SELECT status::text AS k, count(*) FROM label_submissions GROUP BY 1 ORDER BY 2 DESC` },
  { label: 'Product contributions by status', sql: `SELECT status::text AS k, count(*) FROM product_contributions GROUP BY 1 ORDER BY 2 DESC` },
  { label: 'Pending items older than 14 days', sql: `SELECT (SELECT count(*) FROM label_submissions WHERE status = 'pending' AND "createdAt" < now() - interval '14 days') + (SELECT count(*) FROM product_contributions WHERE status = 'pending' AND "createdAt" < now() - interval '14 days') AS count` },
  {
    label: 'Most-reported unknown ingredients',
    sql: `SELECT count(*) FROM analytics_events WHERE "eventType" = 'ingredient_reported_unknown'`,
    sample: `SELECT properties->>'name' AS name, count(*) FROM analytics_events WHERE "eventType" = 'ingredient_reported_unknown' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
  },
];

const show = (rows: Record<string, unknown>[]) =>
  rows.map((r) => Object.values(r).map((v) => (typeof v === 'bigint' ? Number(v) : typeof v === 'object' ? JSON.stringify(v) : v)).join(' = ')).join('\n      ');

async function main() {
  const prisma = new PrismaClient();
  try {
    // One read-only transaction per check, so a failed check can't abort the ones after it.
    for (const c of CHECKS) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
          const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(c.sql);
          const single = rows.length === 1 && Object.keys(rows[0]).length === 1;
          console.log(`\n${c.label}: ${single ? Number(Object.values(rows[0])[0]) : '\n      ' + show(rows)}`);
          if (c.sample && single && Number(Object.values(rows[0])[0]) > 0) {
            console.log('      e.g. ' + show(await tx.$queryRawUnsafe<Record<string, unknown>[]>(c.sample)));
          }
        });
      } catch (e) {
        console.log(`\n${c.label}: (check failed: ${(e as Error).message.split('\n').pop()})`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
