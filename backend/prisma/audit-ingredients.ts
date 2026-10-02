/**
 * Audits the ingredients table for garbage rows (Amazon JSON fragments,
 * marketing copy, malformed scrapes) and optionally deletes them.
 *
 * Usage (from backend/):
 *   npx ts-node prisma/audit-ingredients.ts              # report only
 *   npx ts-node prisma/audit-ingredients.ts --delete     # delete bad rows + detach product links
 *   npx ts-node prisma/audit-ingredients.ts --limit=200  # audit first 200 rows
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v ?? true;
    }
  }
  return out;
}

/**
 * Returns a reason string if the INCI name is clearly garbage, or null if it looks valid.
 *
 * Valid INCI names are:
 *   • 1–120 chars
 *   • No JSON syntax characters: " { } [ ]
 *   • No URL/JS patterns
 *   • Not plain numbers or price values
 *   • Not marketing sentences (contains too many common English words / sentence patterns)
 */
function whyInvalid(inciName: string): string | null {
  const n = inciName.trim();

  if (n.length === 0) return 'empty';
  if (n.length > 120) return `too long (${n.length} chars)`;

  // HTML entities / emoji bullets → definitely not INCI
  if (/&[a-z]+;|&#\d+;/.test(n)) return 'contains HTML entity';
  if (/[0-9#*]\uFE0F?\u20E3/.test(n)) return 'contains keycap emoji';
  // Rough emoji detector (works in modern Node)
  // eslint-disable-next-line no-control-regex
  if (/\p{Extended_Pictographic}/u.test(n)) return 'contains emoji/pictograph';

  // JSON fragments
  if (/["\{\}\[\]]/.test(n)) return 'contains JSON syntax chars';
  if (/^\s*"/.test(n)) return 'starts with quote';

  // Amazon / JS ad payload
  if (/advertiserId|axiom\.|selectionSignals|pastActivity|STORE_ONLY|currencyCode|priceAmount/i.test(n))
    return 'Amazon JS payload';

  // Pure JSON key-value patterns
  if (/^"[a-zA-Z]+":\s*/.test(n)) return 'JSON key-value';
  if (/"[a-zA-Z]+":\s*"/.test(n)) return 'embedded JSON key-value';

  // Numbers / prices
  if (/^\d+(\.\d+)?$/.test(n)) return 'plain number';
  if (/^(INR|USD|EUR|₹)\s*\d/.test(n)) return 'currency value';

  // Starts with dash + marketing
  if (/^[-–]\s+[A-Z]/.test(n)) return 'bullet-point marketing text';

  // Way too many common English filler words → it's a sentence, not an INCI name
  const englishWords = n.match(/\b(the|and|with|for|from|that|this|our|your|its|has|are|not|but|can|been|have|more|also|skin|face|body|wash|care|uses|gives|made|best|good|rich|deep|clean|bright|glow|moisture)\b/gi) ?? [];
  if (englishWords.length >= 4) return `marketing sentence (${englishWords.length} common English words)`;

  // Contains a colon with a full description after it (product feature text)
  if (/:\s+[A-Z][a-z]{3,}/.test(n) && n.includes(' ')) return 'product description text';

  // Backslash escapes (scraper artifact)
  if (/\\"/.test(n)) return 'escaped quote artifact';

  // Context JSON flag
  if (/^"context"\s*:\s*/.test(n)) return 'JSON context flag';

  // Contains HTML or script tags
  if (/<[a-z]/i.test(n)) return 'contains HTML';

  // URL fragments
  if (/https?:\/\/|www\./.test(n)) return 'URL fragment';

  // Lowercase sentence fragments (common in scraped marketing directions)
  if (/^[a-z]/.test(n) && n.includes(' ')) return 'lowercase phrase';

  // All-caps marketing blobs (but allow short acronyms)
  const letters = (n.match(/[A-Za-z]/g) ?? []).length;
  const upper = (n.match(/[A-Z]/g) ?? []).length;
  const words = n.split(/\s+/).filter(Boolean).length;
  if (letters >= 12 && upper / Math.max(letters, 1) > 0.85 && words >= 4) return 'all-caps marketing text';

  return null; // looks valid
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const doDelete = args['delete'] === true;
  const limit = args['limit'] ? parseInt(String(args['limit']), 10) : undefined;

  const prisma = new PrismaClient();

  const ingredients = await prisma.ingredient.findMany({
    select: { id: true, inciName: true },
    orderBy: { inciName: 'asc' },
    take: limit,
  });

  console.log(`\nAuditing ${ingredients.length} ingredient(s)...\n`);

  const bad: Array<{ id: string; inciName: string; reason: string }> = [];
  const good: number[] = [];

  for (const ing of ingredients) {
    const reason = whyInvalid(ing.inciName);
    if (reason) {
      bad.push({ id: ing.id, inciName: ing.inciName, reason });
    } else {
      good.push(1);
    }
  }

  console.log(`✓ Valid   : ${good.length}`);
  console.log(`✗ Invalid : ${bad.length}\n`);

  // Only print first 30 to avoid terminal flood — full list goes to audit-report.txt
  if (bad.length > 0) {
    const reportLines: string[] = [];
    bad.forEach(({ inciName, reason }) => {
      const preview = inciName.length > 80 ? inciName.slice(0, 77) + '…' : inciName;
      reportLines.push(`  [${reason}] ${preview}`);
    });

    const shown = reportLines.slice(0, 30);
    shown.forEach((l) => console.log(l));
    if (reportLines.length > 30) {
      const reportPath = path.join(__dirname, 'data', 'audit-report.txt');
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, reportLines.join('\n'));
      console.log(`  … and ${reportLines.length - 30} more (full list saved to prisma/data/audit-report.txt)`);
    }
  }

  if (doDelete && bad.length > 0) {
    console.log(`\nDeleting ${bad.length} invalid ingredients…`);
    const ids = bad.map((b) => b.id);

    const safe = async (label: string, fn: () => Promise<unknown>) => {
      try {
        return await fn();
      } catch (e) {
        // Some environments may not have all tables migrated yet.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
          console.warn(`Skipping ${label}: table not found in current database.`);
          return null;
        }
        throw e;
      }
    };

    // Delete product_ingredient links first (FK constraint)
    const { count: linksDel } = await prisma.productIngredient.deleteMany({
      where: { ingredientId: { in: ids } },
    });

    // Delete profile overrides
    await safe('profileIngredientOverride.deleteMany', () =>
      prisma.profileIngredientOverride.deleteMany({
        where: { ingredientId: { in: ids } },
      }),
    );

    // Delete ingredient conflicts
    await safe('ingredientConflict.deleteMany', () =>
      prisma.ingredientConflict.deleteMany({
        where: { OR: [{ ingredientAId: { in: ids } }, { ingredientBId: { in: ids } }] },
      }),
    );

    // Delete the ingredients themselves
    const { count: delCount } = await prisma.ingredient.deleteMany({
      where: { id: { in: ids } },
    });

    console.log(`Deleted ${delCount} ingredient(s) and ${linksDel} product link(s).`);
  } else if (bad.length > 0) {
    console.log('\nRun with --delete to remove these rows.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
