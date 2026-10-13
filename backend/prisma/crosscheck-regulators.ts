/**
 * Cross-checks every SkinLens ingredient rating against regulators beyond the EU:
 *   Health Canada Cosmetic Ingredient Hotlist (prohibited), ASEAN Cosmetic Directive Annex II,
 *   US FDA prohibited/restricted ingredients, and the EU's fragrance allergens that must be labelled.
 * Data files (official sources, dated) are in prisma/regulatory/. Matching is by CAS number (from the
 * EU CosIng inventory cache) or exact name; group entries ("Steroids", "Antibiotics") cannot match.
 *
 * Applied, never to hand-checked rows (those are only reported):
 *   - rated fine or unrated, but prohibited by Canada, ASEAN or the US -> caution, saying where;
 *   - an EU-labelled fragrance allergen rated fine or unrated -> caution, marked as fragrance.
 * Reported for review: hand-checked rows that disagree, and "avoid" ratings no other regulator bans.
 * Every match is stored in ingredients.regionNotes, e.g. {"CA":"prohibited","ASEAN":"prohibited"}.
 *
 *   npx ts-node --transpile-only prisma/crosscheck-regulators.ts [--apply]
 */
import * as fs from 'fs';
import * as path from 'path';
import { Prisma, PrismaClient } from '@prisma/client';

const DIR = path.join(__dirname, 'regulatory');
const COSING = path.join(__dirname, 'data', 'cosing-inventory.json');
const apply = process.argv.includes('--apply');
const key = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[­​-‏⁠﻿]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const CAS = /\b\d{2,7}-\d{2}-\d\b/g;
const PLACE: Record<string, string> = { CA: 'Canada', ASEAN: 'Southeast Asia (ASEAN)', US: 'the US' };
// A preservative first and a scent only sometimes: an allergen label applies only when it is used as fragrance.
const ALLERGEN_EXEMPT = new Set(['benzyl alcohol']);

type Entry = { names: string[]; cas: string[]; status: string; note?: string };

/**
 * Group entries ("Mercury and its compounds", "Glucocorticoids") can't match by exact name, so each
 * is spelled out here against the regulator's own entry.
 */
const GROUPS: { test: RegExp; src: string; status: string; entry: string }[] = [
  ...['CA', 'ASEAN', 'EU'].flatMap((src) => [
    { test: /\b(mercury|mercuric|mercurous|calomel)\b/i, src, status: 'prohibited', entry: 'Mercury and its compounds' },
    { test: /\blead\b/i, src, status: 'prohibited', entry: 'Lead and its compounds' },
    { test: /\b(cadmium|arsenic|antimony|thallium|beryllium)\b/i, src, status: 'prohibited', entry: 'Toxic metals and their compounds' },
    { test: /\b(clobetasol|clobetasone|betamethasone|mometasone|hydrocortisone|dexamethasone|triamcinolone|beclomethasone|halobetasol|fluticasone|fluocinolone|prednisolone|desonide)\b/i, src, status: 'prohibited', entry: 'Glucocorticoids' },
    { test: /\b(estradiol|estrone|ethinylestradiol)\b/i, src, status: 'prohibited', entry: 'Oestrogens' },
    { test: /\b(monobenz\w*|benzyloxyphenol)\b/i, src, status: 'prohibited', entry: '4-Benzyloxyphenol (monobenzone)' },
  ]),
  { test: /\bprogesterone\b/i, src: 'CA', status: 'prohibited', entry: 'Progestogens' },
  { test: /\btestosterone\b/i, src: 'CA', status: 'prohibited', entry: 'Androgenic effects, substances with' },
  ...['ASEAN', 'EU'].flatMap((src) => [
    { test: /^human\b/i, src, status: 'prohibited', entry: 'Cells, tissues or products of human origin' },
    { test: /\b(cholecalciferol|ergocalciferol)\b/i, src, status: 'prohibited', entry: 'Ergocalciferol and cholecalciferol' },
    { test: /^(isobutyl|isopropyl|pentyl|phenyl|benzyl)paraben$/i, src, status: 'prohibited', entry: 'Isopropyl-, isobutyl-, phenyl-, benzyl- and pentylparaben' },
    { test: /^formaldehyde$/i, src, status: 'prohibited', entry: 'Formaldehyde' },
  ]),
  { test: /^human\b/i, src: 'CA', status: 'restricted', entry: 'Human origin, substance of' },
];

// A ban with conditions ("except if fully refined", "when used in hair dyes") is not a ban on the
// ingredient as sold in skincare.
const CONDITIONAL = /\bexcept\b|\bwhen used\b|\bunless\b|\bif (it|the|they)\b|\bcontain(s|ing)? (more|>)|\bhair dye|\bas a substance in\b|\bnaturally occurring\b/i;
// Plant materials share one CAS number per species (oil, water, powder, extract alike), so they are
// matched by exact name only.
const BOTANICAL = /\b(extract|oil|water|powder|juice|leaf|flower|seed|root|bark|fruit|wax|distillate|absolute|hydrosol)\b/i;

function readTsv(file: string, parse: (cols: string[]) => Entry): Entry[] {
  return fs
    .readFileSync(path.join(DIR, file), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => parse(l.split('\t')));
}
const list = (s = '') => s.split(/\s*;\s*/).map((x) => x.trim()).filter(Boolean);
const casOf = (s = '') => s.match(CAS) ?? [];

const SOURCES: Record<string, Entry[]> = {
  CA: readTsv('canada-prohibited.tsv', ([n, c, syn]) => ({ names: [n, ...list(syn)], cas: casOf(c), status: CONDITIONAL.test(n) ? 'conditional' : 'prohibited' })),
  ASEAN: readTsv('asean-prohibited.tsv', ([n, c]) => ({ names: [n], cas: casOf(c), status: CONDITIONAL.test(n) ? 'conditional' : 'prohibited' })),
  US: readTsv('us-fda.tsv', ([n, c, st, note]) => ({ names: [n], cas: casOf(c), status: st, note })),
  EU_ALLERGEN: readTsv('eu-fragrance-allergens.tsv', ([n, c]) => ({ names: list(n), cas: casOf(c), status: 'labelled allergen' })),
};

async function main() {
  // CAS numbers per INCI name, from the EU inventory.
  const casByName = new Map<string, string[]>();
  if (fs.existsSync(COSING)) {
    for (const r of JSON.parse(fs.readFileSync(COSING, 'utf8'))) {
      const m = r.metadata ?? {};
      const cas = ((m.casNo ?? []) as string[]).flatMap((c) => c.match(CAS) ?? []);
      if (m.inciName?.[0] && cas.length) casByName.set(key(m.inciName[0]), cas);
    }
  }
  const prisma = new PrismaClient();
  const rows = await prisma.ingredient.findMany({
    select: { id: true, inciName: true, displayName: true, aliases: true, zone: true, source: true, shortDescription: true, isFragrance: true, regionNotes: true, regulatoryNotes: true },
  });

  // Index each regulator's entries by CAS and by name.
  const idx = Object.fromEntries(
    Object.entries(SOURCES).map(([src, entries]) => {
      const byCas = new Map<string, Entry>();
      const byName = new Map<string, Entry>();
      for (const e of entries) {
        e.cas.forEach((c) => byCas.set(c, e));
        e.names.forEach((n) => byName.set(key(n), e));
      }
      return [src, { byCas, byName }];
    }),
  );

  const hits = new Map<string, Record<string, string>>();
  for (const r of rows) {
    const names = [r.inciName, r.displayName, ...r.aliases].filter(Boolean) as string[];
    const cas = new Set(names.flatMap((n) => casByName.get(key(n)) ?? []));
    for (const [src, { byCas, byName }] of Object.entries(idx)) {
      // Allergen labelling names exact ingredients; plants share CAS numbers across their parts.
      const byNumber = src !== 'EU_ALLERGEN' && !BOTANICAL.test(r.inciName);
      const e = names.map((n) => byName.get(key(n))).find(Boolean) ?? (byNumber ? [...cas].map((c) => byCas.get(c)).find(Boolean) : undefined);
      if (!e) continue;
      hits.set(r.id, { ...(hits.get(r.id) ?? {}), [src]: e.status });
    }
    // EU: an "avoid" that rests on an EU ban (hand-checked, or the EU's banned list without an "except").
    const euBanned = r.zone === 'red' && (/Annex II(?! \(conditional\))/.test(r.regulatoryNotes ?? '') || /\b(in|across) the EU\b|\bEU\b.*\bbann|\bbanned\b[^.]*\bEU\b/i.test(r.shortDescription ?? ''));
    if (euBanned) hits.set(r.id, { ...(hits.get(r.id) ?? {}), EU: 'prohibited' });
    for (const g of GROUPS) {
      if (!names.some((n) => g.test.test(n))) continue;
      const cur = hits.get(r.id) ?? {};
      if (cur[g.src] !== 'prohibited') hits.set(r.id, { ...cur, [g.src]: g.status });
    }
  }

  const changes: { row: (typeof rows)[number]; zone: 'yellow' | 'red'; text: string; fragrance: boolean; why: string }[] = [];
  const review: string[] = [];
  for (const r of rows) {
    const h = hits.get(r.id) ?? {};
    const bannedIn = ['CA', 'ASEAN', 'US'].filter((s) => h[s] === 'prohibited');
    const allergen = !!h.EU_ALLERGEN && !ALLERGEN_EXEMPT.has(key(r.inciName));
    const soft = r.zone === 'green' || r.zone === null;
    // Human-origin material is banned outright (EU Annex II/416, ASEAN 416): avoid, like the rest of that group.
    if (soft && /^human\b/i.test(r.inciName) && h.ASEAN === 'prohibited' && r.source !== 'manual') {
      changes.push({ row: r, zone: 'red', text: 'Made from human cells, tissue or blood. Products of human origin are banned in cosmetics in the EU and Southeast Asia.', fragrance: false, why: 'human origin, banned in the EU and ASEAN' });
      continue;
    }
    if (bannedIn.length && soft) {
      const where = bannedIn.map((s) => PLACE[s]).join(', ').replace(/, ([^,]*)$/, ' and $1');
      const line = `Banned in cosmetics in ${where}.`;
      if (r.source === 'manual') review.push(`- **${r.inciName}** (${r.zone ?? 'unrated'}, hand-checked): banned in ${where}. Re-check by hand.`);
      else changes.push({ row: r, zone: 'yellow', text: [r.shortDescription, line].filter(Boolean).join(' '), fragrance: r.isFragrance, why: `banned in ${where}` });
    } else if (allergen && soft) {
      const line = 'A fragrance allergen that must be named on EU labels; can irritate sensitive skin.';
      if (r.source === 'manual') review.push(`- **${r.inciName}** (${r.zone ?? 'unrated'}, hand-checked): an EU-labelled fragrance allergen. Re-check by hand.`);
      else changes.push({ row: r, zone: 'yellow', text: [r.shortDescription, line].filter(Boolean).join(' '), fragrance: true, why: 'EU fragrance allergen' });
    }
    if (r.zone === 'red' && !bannedIn.length && h.EU !== 'prohibited') {
      review.push(`- **${r.inciName}** (avoid): no other regulator in this check bans it. Confirm the EU or hand reason still holds.`);
    }
  }

  const count = (src: string) => [...hits.values()].filter((h) => h[src]).length;
  const summary = `Matched: EU bans ${count('EU')}, Canada ${count('CA')}, ASEAN ${count('ASEAN')}, US ${count('US')}, EU allergens ${count('EU_ALLERGEN')}. To caution: ${changes.length}. For review: ${review.length}.`;
  console.log(summary);
  changes.slice(0, 40).forEach((c) => console.log(`  ${c.row.inciName.padEnd(42)} ${c.row.zone ?? 'unrated'} -> ${c.zone === 'red' ? 'avoid' : 'caution'} (${c.why})`));
  const report = [
    '# Regulator cross-check',
    '',
    `Run ${new Date().toISOString().slice(0, 10)}. ${summary}`,
    '',
    '## Changed',
    '',
    ...changes.map((c) => `- ${c.row.inciName}: ${c.zone === 'red' ? 'avoid' : 'caution'}, ${c.why}`),
    '',
    '## For review by hand',
    '',
    ...review,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIR, 'crosscheck-report.md'), report);

  if (!apply) {
    console.log('\nDry run; --apply to save. Report: prisma/regulatory/crosscheck-report.md');
    return prisma.$disconnect();
  }
  for (const [id, h] of hits) {
    const r = rows.find((x) => x.id === id)!;
    await prisma.ingredient.update({ where: { id }, data: { regionNotes: { ...((r.regionNotes as object) ?? {}), ...h } as Prisma.InputJsonValue } });
  }
  for (const c of changes) {
    await prisma.ingredient.update({
      where: { id: c.row.id },
      data: c.zone === 'red'
        ? { zone: 'red', safetyRating: 'avoid', shortDescription: c.text, source: 'manual', lastReviewedAt: new Date() }
        : { zone: 'yellow', safetyRating: 'caution', shortDescription: c.text, isFragrance: c.fragrance },
    });
  }
  console.log(`Saved region notes on ${hits.size} ingredients and moved ${changes.length} to caution.`);
  await prisma.$disconnect();
}

if (require.main === module) main();
