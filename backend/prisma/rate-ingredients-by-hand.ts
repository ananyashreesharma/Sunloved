/**
 * Applies the hand-checked ratings in hand-ratings.ts to ingredient rows that are still unrated:
 * - HAND: rated by us (source "manual", shown as "Checked by hand by SkinLens").
 * - ALIASES, and names that only differ in spacing or punctuation: copy the rating of the
 *   ingredient they really are.
 * - SPLITS: several ingredients run together in one row; each product gets the separate ingredients
 *   in the same place on its list.
 * - NOT_INGREDIENTS: marketing text and fragments; unlinked from products.
 * Product links that are changed are written to prisma/backups/ first. Never touches a rated row.
 *
 *   npm run prisma:rate-by-hand -- --dry-run
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { IngredientSafetyRating, IngredientSource, PrismaClient } from '@prisma/client';
import { ALIASES, HAND, NOT_INGREDIENTS, SPLITS } from './hand-ratings';

const dryRun = process.argv.includes('--dry-run');
const RATING = { green: IngredientSafetyRating.safe, yellow: IngredientSafetyRating.caution, red: IngredientSafetyRating.avoid } as const;

/** Name as a lookup key: case, invisible characters, punctuation and spacing don't matter. */
const key = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[­​-‏⁠﻿]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const byKey = <T>(o: Record<string, T>) => new Map(Object.entries(o).map(([k, v]) => [key(k), v]));

(async () => {
  const prisma = new PrismaClient();
  const all = await prisma.ingredient.findMany({
    select: { id: true, inciName: true, zone: true, safetyRating: true, shortDescription: true, function: true, regulatoryNotes: true, source: true, isFragrance: true, isParaben: true, isSulfate: true, _count: { select: { productIngredients: true } } },
  });
  // Unrated rows, plus unreviewed AI ratings that never got an explanation: a hand rating replaces those.
  const unrated = all.filter((i) => !i.zone || (i.source === IngredientSource.ai_generated && !i.shortDescription));
  const hand = byKey(HAND);
  const aliases = byKey(ALIASES);
  const splits = byKey(SPLITS);
  const junk = new Set(NOT_INGREDIENTS.map(key));

  // Rated rows by key (hand-checked rows win), plus everything we rate by hand in this run.
  type Row = (typeof all)[number];
  const rated = new Map<string, Row>();
  const anyRow = new Map<string, Row>();
  for (const i of all) {
    const k = key(i.inciName);
    if (!anyRow.has(k) || i.zone) anyRow.set(k, i);
    if (i.zone && (!rated.has(k) || i.source === 'manual')) rated.set(k, i);
  }

  const plan = { hand: [] as Row[], alias: [] as [Row, Row][], split: [] as [Row, Row[]][], junk: [] as Row[], left: [] as Row[] };
  const missing = new Set<string>();
  const toCreate: Row[] = [];

  for (const u of unrated) {
    const k = key(u.inciName);
    if (junk.has(k)) plan.junk.push(u);
    else if (splits.has(k)) {
      const parts = splits.get(k)!.map((p) => {
        const hit = anyRow.get(key(p));
        if (hit) return hit;
        if (hand.has(key(p))) {
          // A part with no row yet but a hand rating: created below.
          const row = { id: '', inciName: p, zone: null, _count: { productIngredients: 0 } } as unknown as Row;
          anyRow.set(key(p), row);
          toCreate.push(row);
          return row;
        }
        missing.add(`split part: ${p}`);
        return undefined;
      });
      plan.split.push([u, parts.filter(Boolean) as Row[]]);
    } else if (hand.has(k)) {
      const h = hand.get(k)!;
      plan.hand.push(u);
      Object.assign(u, { zone: h.zone }); // so aliases pointing here resolve
      rated.set(k, { ...u, zone: h.zone, safetyRating: RATING[h.zone], shortDescription: h.text, source: IngredientSource.manual, isFragrance: !!h.fragrance, isParaben: !!h.paraben, isSulfate: !!h.sulfate, regulatoryNotes: null, function: u.function });
    }
  }
  for (const u of unrated) {
    const k = key(u.inciName);
    if (junk.has(k) || splits.has(k) || hand.has(k)) continue;
    const target = aliases.has(k) ? rated.get(key(aliases.get(k)!)) : rated.get(k);
    if (aliases.has(k) && !target) missing.add(`alias target: ${aliases.get(k)}  (for ${u.inciName})`);
    if (target && target.id !== u.id) plan.alias.push([u, target]);
    else plan.left.push(u);
  }

  const uses = (rows: Row[]) => rows.reduce((n, r) => n + r._count.productIngredients, 0);
  console.log(`Unrated rows: ${unrated.length} (${uses(unrated)} product uses)`);
  console.log(`  rated by hand:        ${plan.hand.length} (${uses(plan.hand)} uses)`);
  console.log(`  same as a rated one:  ${plan.alias.length} (${uses(plan.alias.map((a) => a[0]))} uses)`);
  console.log(`  split into parts:     ${plan.split.length} (${uses(plan.split.map((s) => s[0]))} uses)`);
  console.log(`  not an ingredient:    ${plan.junk.length} (${uses(plan.junk)} uses)`);
  console.log(`  left unrated:         ${plan.left.length} (${uses(plan.left)} uses)`);
  if (missing.size) console.log(`\nMissing:\n  ${[...missing].join('\n  ')}`);
  console.log(`\nLeft unrated, in use:\n  ${plan.left.filter((l) => l._count.productIngredients).map((l) => l.inciName).join(' | ')}`);
  if (dryRun) return prisma.$disconnect();

  const now = new Date();
  for (const row of toCreate) {
    const h = hand.get(key(row.inciName))!;
    const created = await prisma.ingredient.create({
      data: { inciName: row.inciName, zone: h.zone, safetyRating: RATING[h.zone], shortDescription: h.text, source: IngredientSource.manual, lastReviewedAt: now, isFragrance: !!h.fragrance, isParaben: !!h.paraben, isSulfate: !!h.sulfate },
    });
    row.id = created.id;
  }
  for (const u of plan.hand) {
    const h = hand.get(key(u.inciName))!;
    await prisma.ingredient.update({
      where: { id: u.id },
      data: { zone: h.zone, safetyRating: RATING[h.zone], shortDescription: h.text, source: IngredientSource.manual, lastReviewedAt: now, isFragrance: !!h.fragrance, isParaben: !!h.paraben, isSulfate: !!h.sulfate },
    });
  }
  for (const [u, t] of plan.alias) {
    await prisma.ingredient.update({
      where: { id: u.id },
      data: { zone: t.zone, safetyRating: t.safetyRating, shortDescription: t.shortDescription, function: t.function, regulatoryNotes: t.regulatoryNotes, source: t.source, isFragrance: t.isFragrance, isParaben: t.isParaben, isSulfate: t.isSulfate, displayName: t.inciName },
    });
  }

  // Product links that change: back them up, then rebuild each affected product's list in order.
  const changing = new Map<string, Row[] | null>([...plan.junk.map((j) => [j.id, null] as const), ...plan.split.map(([s, parts]) => [s.id, parts] as const)]);
  const links = await prisma.productIngredient.findMany({ where: { ingredientId: { in: [...changing.keys()] } }, select: { productId: true } });
  const productIds = [...new Set(links.map((l) => l.productId))];
  const before = await prisma.productIngredient.findMany({
    where: { productId: { in: productIds } },
    orderBy: [{ productId: 'asc' }, { position: 'asc' }],
    select: { id: true, productId: true, ingredientId: true, position: true, isStar: true, concentration: true, rawText: true, moderationStatus: true, contributionId: true, ingredient: { select: { inciName: true } } },
  });
  if (!productIds.length) {
    console.log('\nNo product lists to change.');
    return prisma.$disconnect();
  }
  // One file per run (timestamped, never overwritten), so an earlier backup is never lost.
  const dir = join(__dirname, 'backups');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `product-ingredients-before-hand-ratings-${now.toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(before, null, 1), { flag: 'wx' });
  console.log(`\nBacked up ${before.length} links of ${productIds.length} products to ${file}`);

  for (const productId of productIds) {
    const rows = before.filter((b) => b.productId === productId);
    const next: { ingredientId: string; isStar: boolean; concentration: any; rawText: string | null; moderationStatus: any; contributionId: string | null }[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const change = changing.get(row.ingredientId);
      const ids = change === undefined ? [row.ingredientId] : change === null ? [] : change.map((p) => p.id);
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        next.push({ ingredientId: id, isStar: change === undefined && row.isStar, concentration: change === undefined ? row.concentration : null, rawText: row.rawText, moderationStatus: row.moderationStatus, contributionId: row.contributionId });
      }
    }
    const start = Math.min(...rows.map((r) => r.position));
    await prisma.$transaction([
      prisma.productIngredient.deleteMany({ where: { productId } }),
      prisma.productIngredient.createMany({ data: next.map((n, i) => ({ productId, position: start + i, ...n })) }),
    ]);
  }
  // Rows no product uses any more and that were never real ingredients.
  const removed = await prisma.ingredient.deleteMany({ where: { id: { in: [...changing.keys()] }, productIngredients: { none: {} } } });
  console.log(`Rebuilt ${productIds.length} product lists; removed ${removed.count} non-ingredient rows.`);
  await prisma.$disconnect();
})();
