/**
 * Human review of AI-made ratings, highest risk first. Most AI ratings were later re-rated by the
 * EU rules (no restrictions -> fine), so only the risky ones need a person:
 *   A  no EU record at all         B  on an EU banned or restricted list
 *   C  EU allows only with limits  D  rated caution or avoid
 *
 *   npx ts-node --transpile-only prisma/review-ratings.ts                 # writes the sheet
 *   npx ts-node --transpile-only prisma/review-ratings.ts --import FILE   # preview the decisions
 *   npx ts-node --transpile-only prisma/review-ratings.ts --import FILE --apply
 *
 * In the sheet, fill `decision` with keep, fine, caution or avoid (blank = not reviewed yet), and
 * optionally `new_explanation` and `reviewer`. Imported rows are marked hand-checked
 * (source=manual, lastReviewedAt=now), so the apps say "Checked by hand by SkinLens".
 */
import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const DIR = join(__dirname, 'review');
const SHEET = join(DIR, 'ratings-to-review.csv');
const ZONE = { fine: ['green', 'safe'], caution: ['yellow', 'caution'], avoid: ['red', 'avoid'] } as const;
const COLUMNS = ['id', 'tier', 'ingredient', 'current_rating', 'eu_status', 'banned_elsewhere', 'explanation', 'decision', 'new_explanation', 'reviewer'];

function tier(notes: string | null, zone: string | null): string | null {
  const n = notes ?? '';
  if (!n.startsWith('EU CosIng')) return 'A';
  const annexes = new Set(n.replace(/^EU CosIng: Annex /, '').split(',').map((a) => a.trim().replace(/ \(conditional\)$/, '')));
  if (annexes.has('II')) return 'B';
  if (annexes.has('III') || annexes.has('V')) return 'C';
  if (zone && zone !== 'green') return 'D';
  return null;
}

const cell = (v: unknown) => {
  const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') row.push(field), (field = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field), rows.push(row), (row = []), (field = '');
    } else field += c;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

(async () => {
  const prisma = new PrismaClient();
  const importAt = process.argv.indexOf('--import');

  if (importAt === -1) {
    const rows = await prisma.ingredient.findMany({ where: { source: 'ai_generated' }, orderBy: { inciName: 'asc' } });
    const out = rows
      .map((r) => ({ r, t: tier(r.regulatoryNotes, r.zone) }))
      .filter((x) => x.t)
      .sort((a, b) => a.t!.localeCompare(b.t!) || a.r.inciName.localeCompare(b.r.inciName));
    mkdirSync(DIR, { recursive: true });
    const lines = [COLUMNS.join(','), ...out.map(({ r, t }) => [r.id, t, r.inciName, r.zone ?? 'unrated', r.regulatoryNotes, r.regionNotes, r.shortDescription, '', '', ''].map(cell).join(','))];
    writeFileSync(SHEET, lines.join('\n') + '\n');
    console.log(`Wrote ${out.length} ratings to review: ${SHEET}`);
    for (const t of ['A', 'B', 'C', 'D']) console.log(`  ${t}: ${out.filter((x) => x.t === t).length}`);
  } else {
    const file = process.argv[importAt + 1];
    const apply = process.argv.includes('--apply');
    const decided = parseCsv(readFileSync(file, 'utf8')).filter((r) => r.decision);
    const bad = decided.filter((r) => !['keep', 'fine', 'caution', 'avoid'].includes(r.decision.toLowerCase()));
    if (bad.length) throw new Error(`Unknown decision on: ${bad.map((b) => `${b.ingredient} (${b.decision})`).join(', ')}`);
    console.log(`${decided.length} reviewed row(s)${apply ? '' : ' (preview; add --apply to save)'}:`);
    for (const r of decided) {
      const d = r.decision.toLowerCase() as 'keep' | keyof typeof ZONE;
      console.log(`  ${r.ingredient.padEnd(40)} ${r.current_rating} -> ${d === 'keep' ? r.current_rating : d}${r.new_explanation ? ' (new text)' : ''}`);
      if (!apply) continue;
      await prisma.ingredient.update({
        where: { id: r.id },
        data: {
          ...(d === 'keep' ? {} : { zone: ZONE[d][0], safetyRating: ZONE[d][1] }),
          ...(r.new_explanation ? { shortDescription: r.new_explanation } : {}),
          source: 'manual',
          lastReviewedAt: new Date(),
        },
      });
    }
  }
  await prisma.$disconnect();
})();
