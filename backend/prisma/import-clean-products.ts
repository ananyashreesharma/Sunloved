/**
 * The clean product catalogue, built one country at a time. Every product must say which country's
 * formula it is and where its ingredient list came from, and only first-hand sources are accepted:
 *
 *   pack_photo        the ingredient list read off the pack (keep the photo)
 *   brand_website     the brand's own product page (source_url required)
 *   brand_submission  sent by the brand, e.g. through "Brands and corrections"
 *   regulator         a regulator's public notification or database
 *
 * Retailer and review sites (Amazon, Flipkart, Nykaa, INCIDecoder, Sephora…) are refused: their
 * lists are often outdated or copied, and their terms forbid scraping.
 *
 * Re-importing the same brand + name + country replaces that product's list. Dry run unless --apply.
 *   npx ts-node --transpile-only prisma/import-clean-products.ts prisma/catalog/IN.csv [--apply]
 * Columns: see prisma/catalog/TEMPLATE.csv and prisma/catalog/README.md.
 */
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { candidateNames } from '../src/modules/ingredients/label-parser';
import { splitLabel } from '../src/modules/ingredients/shared-labels';

export const SOURCE_TYPES = ['pack_photo', 'brand_website', 'brand_submission', 'regulator'] as const;
const BLOCKED = /amazon\.|flipkart\.|nykaa\.|myntra\.|purplle\.|tirabeauty\.|meesho\.|incidecoder\.|skincarisma\.|sephora\.|ulta\.|boots\.com|cultbeauty\.|lookfantastic\.|yesstyle\.|stylevana\.|ebay\.|aliexpress\./i;
// A name that is really marketing copy, directions or a broken fragment, not an ingredient.
const NOT_AN_INGREDIENT = /:|https?:|\b(free|tested|recommended|apply|avoid contact|for external use|directions|warning|store in|made in|mfg|exp\b|batch|q\.?s\.?|net wt|cruelty|vegan|natural|organic certified)\b|^\W*$/i;

type Row = { country: string; brand: string; name: string; ingredients: string; source_type: string; source_url?: string; category?: string; checked_by?: string; checked_on?: string };

export function validate(row: Row): string[] {
  const errs: string[] = [];
  if (!/^[A-Z]{2}$/.test((row.country ?? '').trim())) errs.push('country must be a two-letter code, e.g. IN');
  if (!row.brand?.trim()) errs.push('brand is missing');
  if (!row.name?.trim()) errs.push('name is missing');
  if (!(SOURCE_TYPES as readonly string[]).includes(row.source_type?.trim())) errs.push(`source_type must be one of ${SOURCE_TYPES.join(', ')}`);
  if (row.source_type === 'brand_website' && !/^https:\/\//.test(row.source_url ?? '')) errs.push('brand_website needs an https source_url');
  if (row.source_url && BLOCKED.test(row.source_url)) errs.push('retailer and review sites are not accepted as sources');
  const names = splitLabel(row.ingredients ?? '');
  if (names.length < 2) errs.push('ingredients: fewer than 2 ingredients read');
  const bad = names.filter((n) => NOT_AN_INGREDIENT.test(n) || n.length > 90);
  if (bad.length) errs.push(`ingredients: not ingredient names: ${bad.slice(0, 3).join(' | ')}`);
  return errs;
}

async function main() {
  const file = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!file) throw new Error('Usage: import-clean-products.ts <file.csv> [--apply]');
  const rows: Row[] = parse(fs.readFileSync(file, 'utf8'), { columns: true, skip_empty_lines: true, trim: true });
  const prisma = new PrismaClient();
  const ingredients = await prisma.ingredient.findMany({ select: { id: true, inciName: true, displayName: true, aliases: true, zone: true } });
  const byName = new Map<string, (typeof ingredients)[number]>();
  // Rated rows win; real names before aliases.
  for (const pass of [0, 1])
    for (const i of [...ingredients].sort((a, b) => Number(!a.zone) - Number(!b.zone)))
      for (const n of pass === 0 ? [i.inciName, i.displayName] : i.aliases) if (n && !byName.has(n.toLowerCase())) byName.set(n.toLowerCase(), i);

  let ok = 0;
  let unknownTotal = 0;
  for (const [idx, row] of rows.entries()) {
    const line = idx + 2;
    const errs = validate(row);
    if (errs.length) {
      console.log(`line ${line} ${row.brand ?? ''} ${row.name ?? ''}: REJECTED\n  - ${errs.join('\n  - ')}`);
      continue;
    }
    const names = splitLabel(row.ingredients);
    const matched = names.map((n) => candidateNames(n).map((c) => byName.get(c.toLowerCase())).find(Boolean) ?? null);
    const unknown = names.filter((_, i) => !matched[i]);
    unknownTotal += unknown.length;
    console.log(`line ${line} ${row.country} · ${row.brand} ${row.name}: ${names.length} ingredients, ${names.length - unknown.length} known${unknown.length ? `, new (unrated): ${unknown.join(' | ')}` : ''}`);
    ok++;
    if (!apply) continue;

    const brand = await prisma.brand.upsert({ where: { name: row.brand.trim() }, update: {}, create: { name: row.brand.trim() } });
    const country = row.country.trim();
    const source = `clean:${row.source_type}`;
    const existing = await prisma.product.findFirst({ where: { brandId: brand.id, name: row.name.trim(), country, source: { startsWith: 'clean:' } } });
    const data = { name: row.name.trim(), brandId: brand.id, country, markets: [country], categoryLegacy: row.category?.trim() || 'skincare', source, url: row.source_url || null, description: [row.checked_by && `Checked by ${row.checked_by}`, row.checked_on && `on ${row.checked_on}`].filter(Boolean).join(' ') || null, deletedAt: null };
    const product = existing ? await prisma.product.update({ where: { id: existing.id }, data }) : await prisma.product.create({ data });
    // Unknown names become unrated rows: they show as "no information", never as fine.
    const ids: string[] = [];
    for (const [i, n] of names.entries()) {
      let ing = matched[i];
      if (!ing) {
        ing = await prisma.ingredient.upsert({ where: { inciName: n }, update: {}, create: { inciName: n }, select: { id: true, inciName: true, displayName: true, aliases: true, zone: true } });
        byName.set(n.toLowerCase(), ing);
      }
      ids.push(ing.id);
    }
    await prisma.$transaction([
      prisma.productIngredient.deleteMany({ where: { productId: product.id } }),
      prisma.productIngredient.createMany({
        data: Array.from(new Map(ids.map((id, i) => [id, { productId: product.id, ingredientId: id, position: i + 1, rawText: names[i] }])).values()).map((r, i) => ({ ...r, position: i + 1 })),
      }),
    ]);
  }
  console.log(`\n${ok} of ${rows.length} rows ${apply ? 'imported' : 'valid (dry run; add --apply to import)'}. Ingredient names not yet in SkinLens: ${unknownTotal}.`);
  await prisma.$disconnect();
}

if (require.main === module) main();
