/**
 * Exports labels people checked in the app (anonymous; see LabelSubmission) as a review sheet for one
 * country, most-checked first. A reviewer confirms each against the pack or the brand's own site, fills
 * in source_type / source_url / checked_by / checked_on, moves the good rows into prisma/catalog/<CC>.csv
 * and imports them with import-clean-products.ts. Nothing here publishes anything.
 *
 *   npx ts-node --transpile-only prisma/review-submissions.ts IN
 */
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

async function main() {
  const country = (process.argv[2] ?? '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new Error('Usage: review-submissions.ts <country code, e.g. IN>');
  const prisma = new PrismaClient();
  const rows = await prisma.labelSubmission.findMany({ where: { country, status: 'pending' }, orderBy: [{ timesSeen: 'desc' }, { createdAt: 'asc' }] });
  const file = path.join(__dirname, 'catalog', `review-${country}.csv`);
  const cell = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const header = ['country', 'brand', 'name', 'ingredients', 'source_type', 'source_url', 'category', 'checked_by', 'checked_on', 'times_checked'];
  const lines = rows.map((r) => [country, '', r.name, r.ingredients, '', '', '', '', '', r.timesSeen].map(cell).join(','));
  fs.writeFileSync(file, [header.join(','), ...lines].join('\n') + '\n');
  console.log(`${rows.length} pending ${country} labels -> ${path.relative(process.cwd(), file)}`);
  await prisma.$disconnect();
}

if (require.main === module) main();
