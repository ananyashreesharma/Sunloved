/**
 * Rates ingredients from the EU's official cosmetics ingredient database (CosIng) and rewrites
 * their descriptions in our own words.
 *
 *   EU Annex II reference (banned in some form)    → yellow / caution
 *   … only poorly refined grades banned ("except") → green  / safe    (refined grades are what's sold)
 *   EU Annex III with a scent function (allergens) → yellow / caution
 *   EU Annex III otherwise (pH adjusters, BHT…)    → green  / safe    (used within the EU's limits)
 *   approved lists only (Annex IV–VI) or unlisted   → green  / safe
 *
 * "Caution" means "worth knowing for many people", not "the EU sets a limit". Actives that deserve
 * caution (exfoliating acids, retinoids, drying alcohols, MIT/MCI) are hand-rated in
 * seed-critical-ingredients.ts.
 *
 * Why: half the catalogue's ingredients had no rating, ~1,000 descriptions were copied from
 * INCIDecoder (copyright risk, and an off-brand jokey tone), and some unreviewed AI ratings marked
 * ordinary ingredients "red", which now makes a whole product "Avoid".
 *
 * Never "red": an ingredient record's Annex II link often covers only some forms of it (citrus
 * extracts high in furocoumarins, poorly refined mineral oil, colourants in certain uses), and the
 * "except…" wording lives in the annex entry, not on the ingredient. Calling those "banned" would
 * be false. Confirmed outright bans are hand-listed in seed-critical-ingredients.ts (source=manual).
 *
 * Rules
 * - Rows with source=manual (hand-checked, e.g. seed-critical-ingredients.ts) are never touched.
 * - "red" is reserved for regulator-banned or hand-checked ingredients: an AI-generated red that the
 *   EU doesn't ban becomes yellow.
 * - Every non-manual description is replaced: by one built from the EU function list, or by none
 *   (the apps then show a neutral default) — copied text never survives.
 *
 * CosIng data © European Union, reused under Commission Decision 2011/833/EU.
 *
 *   npm run prisma:rate-ingredients -- --dry-run --limit=30
 *   npm run prisma:rate-ingredients
 */
import * as https from 'https';
import * as querystring from 'querystring';
import { IngredientSource, IngredientZone, Prisma, PrismaClient } from '@prisma/client';
import { describe, RATING, zoneFromEu } from './cosing-rules';

const HOST = 'api.tech.ec.europa.eu';
const SEARCH_PATH = '/search-api/prod/rest/search';
// The public key the CosIng website itself uses for this search API.
const API_KEY = '285a77fd-1257-4271-8507-f0c6b2961203';


type CosingHit = { functions: string[]; annexes: string[]; conditionalBan: boolean };

function post(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: HOST,
        path,
        method: 'POST',
        headers: {
          Origin: 'https://ec.europa.eu',
          Referer: 'https://ec.europa.eu/growth/tools-databases/cosing/advanced',
          'Content-Length': 0,
        },
        timeout: 20000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => (res.statusCode === 200 ? resolve(body) : reject(new Error(`HTTP ${res.statusCode}`))));
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

/** Exact INCI lookup. Restrictions look like "II/1339\r\nIII/14" → annex roman numerals. */
async function lookup(name: string): Promise<CosingHit | null> {
  const upper = name.toUpperCase();
  const qs = querystring.stringify({ apiKey: API_KEY, text: `"${upper}"`, pageSize: 10, languages: 'en' });
  const data = JSON.parse(await post(`${SEARCH_PATH}?${qs}`));
  for (const r of data.results ?? []) {
    const m = r.metadata ?? {};
    const names: string[] = [...(m.inciName ?? []), ...(m.nameOfCommonIngredientsGlossary ?? [])];
    if (!names.some((n) => n.toUpperCase() === upper)) continue;
    const restrictions = ((m.cosmeticRestriction ?? []) as string[]).join('\n');
    const annexes = Array.from(new Set(restrictions.split(/\s+/).map((t) => t.split('/')[0]).filter((a) => /^[IVX]+$/.test(a))));
    // "II/875 Distillates (petroleum)… except if the full refining history is known…" bans only
    // some grades of the substance, not the ingredient as sold.
    const conditionalBan = annexes.includes('II') && /\bexcept\b/i.test(restrictions);
    return { functions: (m.functionName ?? []) as string[], annexes, conditionalBan };
  }
  return null;
}

/** Candidate spellings for a messy catalogue name: "' Niacinamide", "(Aloe Vera Leaf Extract", "Parfum/Fragrance". */
function candidates(raw: string): string[] {
  // Invisible characters copied from websites are removed outright ("Caprylic/<ZWSP>Capric").
  const base = raw.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/['"`*]/g, ' ').replace(/\\/g, '/').replace(/\s+/g, ' ').trim();
  const out = new Set<string>();
  const add = (s: string) => {
    const t = s.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)]+$/g, '').trim();
    if (t.length >= 3) out.add(t);
  };
  add(base);
  add(base.replace(/\([^)]*\)?/g, ' ').replace(/\s+/g, ' '));
  // In polymer names the slash is part of one chemical name, not a list of alternatives.
  if (!/polymer|glyceride|\d\/\d/i.test(base)) for (const part of base.split('/')) add(part);
  // "1,3 Butylene glycol" → "Butylene glycol", "2-Phenoxyethanol" → "Phenoxyethanol" (tried last,
  // so a real locant name like "1,2-Hexanediol" still matches first).
  add(base.replace(/^\d+(,\d+)*[- ]+/, ''));
  return Array.from(out).slice(0, 5);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1]) || undefined;
  const concurrency = Number(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1]) || 4;

  const prisma = new PrismaClient();

  // --rezone-only: re-apply the zone policy to rows already matched in CosIng, no network.
  if (args.includes('--rezone-only')) {
    const stored = await prisma.ingredient.findMany({
      where: { OR: [{ source: null }, { source: { not: IngredientSource.manual } }], regulatoryNotes: { startsWith: 'EU CosIng' } },
      select: { id: true, function: true, regulatoryNotes: true, zone: true },
    });
    const counts: Record<string, number> = {};
    for (const r of stored) {
      const notes = r.regulatoryNotes ?? '';
      const annexes = notes.startsWith('EU CosIng: Annex') ? (notes.replace('EU CosIng: Annex', '').match(/\b[IVX]+\b/g) ?? []) : [];
      const zone = zoneFromEu(annexes, (r.function ?? '').split(/,\s*/).map((f) => f.toUpperCase()), notes.includes('(conditional)'));
      counts[`${r.zone}→${zone}`] = (counts[`${r.zone}→${zone}`] ?? 0) + 1;
      if (!dryRun && zone !== r.zone) await prisma.ingredient.update({ where: { id: r.id }, data: { zone, safetyRating: RATING[zone] } });
    }
    console.log(`Re-zoned ${stored.length} rows${dryRun ? ' (dry run)' : ''}:`, counts);
    await prisma.$disconnect();
    return;
  }

  // --describe-only: rebuild descriptions from the stored function list and EU notes, no network.
  if (args.includes('--describe-only')) {
    const stored = await prisma.ingredient.findMany({
      where: { OR: [{ source: null }, { source: { not: IngredientSource.manual } }] },
      select: { id: true, function: true, regulatoryNotes: true },
    });
    let n = 0;
    for (const r of stored) {
      const notes = r.regulatoryNotes ?? '';
      const annexes = notes.startsWith('EU CosIng: Annex') ? (notes.match(/\b[IVX]+\b/g) ?? []) : [];
      const shortDescription = r.function
        ? describe(r.function.split(/,\s*/).map((f) => f.toUpperCase()), annexes, notes.includes('(conditional)'))
        : null;
      if (!dryRun) await prisma.ingredient.update({ where: { id: r.id }, data: { shortDescription } });
      n++;
    }
    console.log(`Rebuilt ${n} descriptions${dryRun ? ' (dry run)' : ''}.`);
    await prisma.$disconnect();
    return;
  }

  // Scraper junk stored as "ingredients" (Amazon image file names, label directions) that no
  // product uses: delete. Junk that a product does reference is left for a human to fix.
  const junk = Prisma.sql`("inciName" ~* '\\.(png|jpe?g|webp|avif|gif|svg)|_AC_|https?:|www\\.'
      OR "inciName" ~* '(directions:|how to use|safety information|ingredients:)')
      AND NOT EXISTS (SELECT 1 FROM product_ingredients pi WHERE pi."ingredientId" = ingredients.id)`;
  if (dryRun) {
    const [{ n }] = await prisma.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM ingredients WHERE ${junk}`;
    console.log(`Would delete ${n} unused junk ingredient rows.`);
  } else {
    console.log(`Deleted ${await prisma.$executeRaw`DELETE FROM ingredients WHERE ${junk}`} unused junk ingredient rows.`);
  }

  const rows = await prisma.ingredient.findMany({
    where: {
      OR: [{ source: null }, { source: { not: IngredientSource.manual } }],
      // --unrated-only: just the rows still without a rating (e.g. after fixing name cleanup).
      ...(process.argv.includes('--unrated-only') ? { zone: null } : {}),
    },
    select: { id: true, inciName: true, zone: true, function: true },
    orderBy: { inciName: 'asc' },
    take: limit,
  });
  console.log(`CosIng rating | ${rows.length} ingredients | dry=${dryRun} concurrency=${concurrency}\n`);

  const stats = { found: 0, notFound: 0, red: 0, yellow: 0, green: 0, demotedRed: 0, described: 0, errors: 0 };
  let next = 0;

  async function worker() {
    while (next < rows.length) {
      const row = rows[next++];
      let hit: CosingHit | null = null;
      try {
        for (const name of candidates(row.inciName)) {
          hit = await lookup(name);
          if (hit) break;
        }
      } catch (e) {
        stats.errors++;
        console.log(`  ! ${row.inciName}: ${(e as Error).message}`);
        continue;
      }

      const data: Record<string, unknown> = {};
      if (hit) {
        stats.found++;
        // EU-derived rating replaces unreviewed AI guesses; only hand-checked rows (never touched
        // here) can say otherwise.
        const zone: IngredientZone = zoneFromEu(hit.annexes, hit.functions, hit.conditionalBan);
        if (row.zone === 'red') stats.demotedRed++;
        if (zone) {
          data.zone = zone;
          data.safetyRating = RATING[zone];
          stats[zone]++;
        }
        if (hit.functions.length) data.function = hit.functions.map((f) => f.toLowerCase()).join(', ');
        data.regulatoryNotes = hit.annexes.length
          ? `EU CosIng: Annex ${hit.annexes.join(', ')}${hit.conditionalBan ? ' (conditional)' : ''}`
          : 'EU CosIng: listed, no restrictions';
        data.shortDescription = describe(hit.functions, hit.annexes, hit.conditionalBan);
      } else {
        stats.notFound++;
        // Not in CosIng: keep the rating, but never keep copied text.
        data.shortDescription = row.function ? describe(row.function.split(/,\s*/), []) : null;
      }
      if (data.shortDescription) stats.described++;

      if (dryRun) console.log(`  ${hit ? (data.zone as string)?.padEnd(6) ?? '—     ' : 'n/a   '} ${row.inciName}  →  ${data.shortDescription ?? '(no description)'}`);
      else await prisma.ingredient.update({ where: { id: row.id }, data });

      const done = stats.found + stats.notFound + stats.errors;
      if (!dryRun && done % 200 === 0) console.log(`  … ${done}/${rows.length}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log('\nDone.', stats);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
