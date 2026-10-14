/**
 * Cross-check each product against Open Beauty Facts, INCIDecoder, then Amazon.in (title + INCI).
 * Soft-delete rows only when every source definitively misses and nothing is ambiguous (bot/network).
 *
 * Default is dry-run. Use --apply to set deletedAt. Use --limit to cap work.
 *
 * From backend/:
 *   npx ts-node prisma/prune-unverified-products.ts --limit=20
 *   npx ts-node prisma/prune-unverified-products.ts --apply --all --delay-ms=2000
 */

import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { verifyProductExistsOutsideCatalog } from './lib/catalog-existence-verify';

function parseArgs(argv: string[]): {
  apply: boolean;
  limit?: number;
  skip: number;
  delayMs: number;
  out: string;
} {
  let apply = false;
  let all = false;
  let limit = 25;
  let skip = 0;
  let delayMs = parseInt(process.env.FETCH_DELAY_MS || '1800', 10);
  let out = resolve(__dirname, 'data', 'prune-unverified-report.json');

  for (const a of argv) {
    if (a === '--apply') apply = true;
    else if (a === '--all') all = true;
    else if (a.startsWith('--limit=')) limit = Math.max(1, parseInt(a.slice('--limit='.length), 10) || 25);
    else if (a.startsWith('--skip=')) skip = Math.max(0, parseInt(a.slice('--skip='.length), 10) || 0);
    else if (a.startsWith('--delay-ms=')) delayMs = Math.max(0, parseInt(a.slice('--delay-ms='.length), 10) || 0);
    else if (a.startsWith('--out=')) out = resolve(process.cwd(), a.slice('--out='.length));
  }

  return { apply, limit: all ? undefined : limit, skip, delayMs, out };
}

async function main() {
  const { apply, limit, skip, delayMs, out } = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  const rows = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      brand: { select: { name: true } },
      category: { select: { slug: true } },
      source: true,
    },
  });

  const report: {
    mode: string;
    at: string;
    delayMs: number;
    counts: Record<string, number>;
    removedIds: string[];
    samples: unknown[];
  } = {
    mode: apply ? 'apply_soft_delete' : 'dry_run',
    at: new Date().toISOString(),
    delayMs,
    counts: {
      scanned: 0,
      verified: 0,
      not_found: 0,
      ambiguous: 0,
      skipped_non_cosmetic: 0,
      soft_deleted: 0,
    },
    removedIds: [],
    samples: [],
  };

  console.log(
    `${apply ? 'APPLY' : 'DRY-RUN'}: ${rows.length} product(s); delayMs=${delayMs}; report → ${out}`,
  );

  for (const p of rows) {
    report.counts.scanned++;
    const r = await verifyProductExistsOutsideCatalog(
      p.brand.name,
      p.name,
      p.category?.slug ?? null,
      delayMs,
    );

    if (r.outcome === 'verified') {
      report.counts.verified++;
      continue;
    }
    if (r.outcome === 'skipped') {
      report.counts.skipped_non_cosmetic++;
      if (report.samples.length < 25) report.samples.push({ id: p.id, name: p.name, ...r });
      continue;
    }
    if (r.outcome === 'ambiguous') {
      report.counts.ambiguous++;
      if (report.samples.length < 40) report.samples.push({ id: p.id, name: p.name, brand: p.brand.name, ...r });
      continue;
    }

    report.counts.not_found++;
    report.removedIds.push(p.id);
    if (report.samples.length < 40) {
      report.samples.push({
        id: p.id,
        name: p.name,
        brand: p.brand.name,
        source: p.source,
        outcome: 'not_found',
        checked: r.checked,
      });
    }

    if (apply) {
      await prisma.product.update({
        where: { id: p.id },
        data: { deletedAt: new Date() },
      });
      report.counts.soft_deleted++;
    }
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');

  console.log(JSON.stringify(report.counts, null, 2));
  console.log(`Wrote ${out}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
