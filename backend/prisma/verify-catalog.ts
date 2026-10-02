/**
 * Catalog verification — confirms each product row exists in the real world.
 *
 * Source chain per product: INCIDecoder → Amazon.in → Flipkart
 *   • Found on any source   → "verified" (row stays, stamped with source tag)
 *   • All sources clean miss → "not_found" → soft-deleted (deletedAt set)
 *   • Any source had network/bot error → "ambiguous" → row kept, logged for retry
 *
 * Defaults to --dry-run so nothing is deleted until you pass --execute.
 * Safe to re-run: already-verified rows are skipped unless --force is passed.
 * Progress saved to verify-catalog-progress.json; use --resume to continue.
 *
 * ─── Commands ───────────────────────────────────────────────────────────────
 *
 *   # Preview 50 products (no writes):
 *   npm run prisma:verify-catalog -- --dry-run --limit=50 --verbose
 *
 *   # Run for real:
 *   npm run prisma:verify-catalog -- --execute --limit=200
 *
 *   # Process all 2000 products (skip first 1000 if already done):
 *   npm run prisma:verify-catalog -- --execute --skip=1000 --limit=1000
 *
 *   # Resume an interrupted run:
 *   npm run prisma:verify-catalog -- --execute --resume
 *
 *   # Force recheck products already verified:
 *   npm run prisma:verify-catalog -- --execute --force --limit=100
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { verifyProductExistsOutsideCatalog } from './lib/catalog-existence-verify';

// ─── Checkpoint ───────────────────────────────────────────────────────────────

const CHECKPOINT_FILE = path.join(__dirname, 'verify-catalog-progress.json');

interface Checkpoint {
  lastProcessedId: string | null;
  verified: number;
  softDeleted: number;
  ambiguous: number;
  skipped: number;
  notFoundIds: string[];
  ambiguousIds: string[];
  startedAt: string;
  updatedAt: string;
}

function loadCheckpoint(): Checkpoint | null {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')) as Checkpoint;
    }
  } catch { /* corrupt */ }
  return null;
}

function saveCheckpoint(cp: Checkpoint): void {
  cp.updatedAt = new Date().toISOString();
  try { fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2)); } catch { /* best-effort */ }
}

function clearCheckpoint(): void {
  try { fs.unlinkSync(CHECKPOINT_FILE); } catch { /* fine */ }
}

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v !== undefined ? v : true;
    }
  }
  return out;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GRAY   = '\x1b[90m';
const RESET  = '\x1b[0m';
const c = (col: string, s: string) => `${col}${s}${RESET}`;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args    = parseArgs(process.argv.slice(2));
  const execute = args['execute'] === true;
  const dryRun  = !execute;
  const force   = args['force']   === true;
  const resume  = args['resume']  === true;
  const verbose = args['verbose'] === true;
  const limit   = args['limit']   ? parseInt(String(args['limit']),    10) : undefined;
  const skipArg = args['skip']    ? parseInt(String(args['skip']),     10) : 0;
  const delayMs = args['delay-ms']
    ? parseInt(String(args['delay-ms']), 10)
    : parseInt(process.env.FETCH_DELAY_MS || '1500', 10);
  const stepDelay = Math.max(400, Math.floor(delayMs / 3));

  if (dryRun) {
    console.log(c(YELLOW, '\n⚠  DRY RUN — pass --execute to actually soft-delete rows.\n'));
  }

  const prisma = new PrismaClient();

  // ── Checkpoint setup ──────────────────────────────────────────────────────

  let cp: Checkpoint = (resume ? loadCheckpoint() : null) ?? {
    lastProcessedId: null,
    verified: 0,
    softDeleted: 0,
    ambiguous: 0,
    skipped: 0,
    notFoundIds: [],
    ambiguousIds: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (resume && cp.lastProcessedId) {
    console.log(c(GRAY, `↩  Resuming from checkpoint (last ID: ${cp.lastProcessedId})\n`));
  }

  // ── Build product query ───────────────────────────────────────────────────

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    // When resuming, continue from where we left off (cursor-based, not offset)
    ...(resume && cp.lastProcessedId ? { id: { gt: cp.lastProcessedId } } : {}),
    // Skip already-verified rows unless --force
    ...(!force ? {
      NOT: { source: { startsWith: 'verified:' } },
    } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      brand: { select: { name: true } },
      category: { select: { slug: true } },
    },
    orderBy: { id: 'asc' },
    skip: resume ? 0 : (Number.isFinite(skipArg) ? skipArg : 0),
    take: Number.isFinite(limit!) ? limit : undefined,
  });

  if (products.length === 0) {
    console.log(c(GREEN, 'Nothing to process — catalog empty or all rows already verified.'));
    await prisma.$disconnect();
    return;
  }

  console.log(
    `Verifying ${products.length} product(s) via INCIDecoder → Amazon.in → Flipkart` +
    c(GRAY, `  delay=${delayMs}ms  ${dryRun ? '[DRY RUN]' : '[EXECUTE]'}\n`),
  );

  // ── Process loop ──────────────────────────────────────────────────────────

  let i = 0;
  for (const p of products) {
    i++;
    const brand = p.brand.name;
    const label = `[${i}/${products.length}] ${brand} — ${p.name}`;
    process.stdout.write(label.slice(0, 100).padEnd(102) + '… ');

    let result: Awaited<ReturnType<typeof verifyProductExistsOutsideCatalog>>;
    try {
      result = await verifyProductExistsOutsideCatalog(
        brand,
        p.name,
        p.category?.slug ?? null,
        stepDelay,
      );
    } catch (e) {
      // Defensive: lib should never throw, but guard anyway
      console.log(c(YELLOW, `? error (${(e as Error).message}) — kept`));
      cp.ambiguous++;
      cp.ambiguousIds.push(p.id);
      cp.lastProcessedId = p.id;
      saveCheckpoint(cp);
      await sleep(delayMs);
      continue;
    }

    switch (result.outcome) {
      case 'verified':
        console.log(c(GREEN, `✓ verified   [${result.source}]`));
        if (!dryRun) {
          await prisma.product.update({
            where: { id: p.id },
            data: { source: `verified:${result.source}` },
          });
        }
        cp.verified++;
        break;

      case 'skipped':
        console.log(c(GRAY, `— skipped    (${result.reason})`));
        cp.skipped++;
        break;

      case 'ambiguous':
        console.log(c(YELLOW, `? ambiguous  (${result.reason})`));
        if (verbose) console.log(c(GRAY, `  ↳ network/bot issue — kept, retry later`));
        cp.ambiguous++;
        cp.ambiguousIds.push(p.id);
        break;

      case 'not_found':
        console.log(c(RED, `✗ not found  [${result.checked.join('+')}]${dryRun ? ' (dry-run)' : ' → soft-deleted'}`));
        if (verbose) console.log(c(GRAY, `  ↳ checked: ${result.checked.join(', ')}`));
        if (!dryRun) {
          await prisma.product.update({
            where: { id: p.id },
            data: { deletedAt: new Date() },
          });
        }
        cp.notFoundIds.push(p.id);
        cp.softDeleted++;
        break;
    }

    cp.lastProcessedId = p.id;
    saveCheckpoint(cp);

    if (i < products.length) await sleep(delayMs);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  const line = '─'.repeat(56);
  console.log('\n' + line);
  console.log(c(GREEN,  `  ✓  Verified:         ${cp.verified}`));
  console.log(c(RED,    `  ✗  Soft-deleted:     ${cp.softDeleted}${dryRun ? '  (dry-run — not applied)' : ''}`));
  console.log(c(YELLOW, `  ?  Ambiguous/retry:  ${cp.ambiguous}`));
  console.log(c(GRAY,   `  —  Skipped:          ${cp.skipped}`));
  console.log(line);

  if (cp.ambiguousIds.length > 0) {
    console.log(c(YELLOW, `\nAmbiguous IDs (network issue — safe to retry):`));
    console.log(cp.ambiguousIds.map((id) => `  ${id}`).join('\n'));
  }

  if (dryRun && cp.softDeleted > 0) {
    console.log(c(YELLOW,
      `\n→ Re-run with --execute to apply ${cp.softDeleted} soft-delete(s).`,
    ));
  }

  if (!dryRun) {
    console.log(c(GRAY, `\nProgress: ${CHECKPOINT_FILE}`));
    if (i >= products.length) {
      clearCheckpoint();
      console.log(c(GREEN, 'Run complete — checkpoint cleared.'));
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('\nFatal:', e);
  process.exit(1);
});
