/**
 * Catalogue seeds stored the retailer's star rating (out of 5) in products.overallScore, which the
 * apps read as an 18–96 safety score: every such product showed "high risk". The apps now ignore
 * scores outside 18–96; this clears them from the data too, so the score is worked out from the
 * ingredient list. Real safety scores (18 and up) are never touched.
 *
 *   npx ts-node --transpile-only prisma/clear-star-rating-scores.ts           # preview only
 *   npx ts-node --transpile-only prisma/clear-star-rating-scores.ts --apply   # make the change
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const apply = process.argv.includes('--apply');

(async () => {
  const prisma = new PrismaClient();
  const where = { overallScore: { gte: 0, lte: 5 } };
  const count = await prisma.product.count({ where });
  const sample = await prisma.product.findMany({ where, select: { name: true, overallScore: true }, take: 5 });
  console.log(`Products with a star rating stored as their safety score: ${count}`);
  for (const p of sample) console.log(`  e.g. ${p.name}: ${p.overallScore}`);
  if (!apply) {
    console.log('\nPreview only. Re-run with --apply to clear them.');
  } else if (count > 0) {
    const { count: cleared } = await prisma.product.updateMany({ where, data: { overallScore: null } });
    console.log(`\nCleared ${cleared}.`);
  }
  await prisma.$disconnect();
})();
