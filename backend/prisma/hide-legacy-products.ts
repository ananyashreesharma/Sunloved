/**
 * Hides every product imported before SkinLens started its clean, country-by-country catalogue
 * (INCIDecoder, Amazon India, Flipkart and CSV imports of unclear origin). Soft delete only: the
 * rows stay, marked with HIDDEN_AT, so `--undo` brings exactly these back.
 *
 *   npx ts-node --transpile-only prisma/hide-legacy-products.ts [--dry-run | --undo]
 */
import { PrismaClient } from '@prisma/client';

const HIDDEN_AT = new Date('2026-10-13T00:00:00.000Z');
const dryRun = process.argv.includes('--dry-run');
const undo = process.argv.includes('--undo');

(async () => {
  const prisma = new PrismaClient();
  if (undo) {
    const r = await prisma.product.updateMany({ where: { deletedAt: HIDDEN_AT }, data: { deletedAt: null } });
    console.log(`Restored ${r.count} products.`);
  } else {
    const where = { deletedAt: null };
    const n = await prisma.product.count({ where });
    if (dryRun) console.log(`[dry run] would hide ${n} products.`);
    else console.log(`Hid ${(await prisma.product.updateMany({ where, data: { deletedAt: HIDDEN_AT } })).count} products.`);
  }
  console.log(`Visible now: ${await prisma.product.count({ where: { deletedAt: null } })}`);
  await prisma.$disconnect();
})();
