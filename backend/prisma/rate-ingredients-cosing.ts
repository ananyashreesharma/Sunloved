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
import { IngredientSafetyRating, IngredientSource, IngredientZone, Prisma, PrismaClient } from '@prisma/client';

const HOST = 'api.tech.ec.europa.eu';
const SEARCH_PATH = '/search-api/prod/rest/search';
// The public key the CosIng website itself uses for this search API.
const API_KEY = '285a77fd-1257-4271-8507-f0c6b2961203';

// CosIng function name → what it does, in plain words.
const FUNCTION_PHRASES: Record<string, string> = {
  ABRASIVE: 'scrubs away dead skin',
  ABSORBENT: 'soaks up oil and moisture',
  ANTICAKING: 'keeps powders from clumping',
  ANTICORROSIVE: 'protects the packaging from corrosion',
  ANTIDANDRUFF: 'helps control dandruff',
  ANTIFOAMING: 'stops unwanted foaming',
  ANTIMICROBIAL: 'slows the growth of microbes',
  ANTIOXIDANT: 'protects the formula from going off',
  ANTIPERSPIRANT: 'reduces sweating',
  ANTISEBORRHOEIC: 'helps control oiliness',
  ANTISTATIC: 'reduces static, especially in hair',
  ASTRINGENT: 'tightens and tones the skin',
  BINDING: 'holds the product together',
  BLEACHING: 'lightens skin or hair',
  BUFFERING: 'keeps the pH steady',
  BULKING: 'adds body to the formula',
  CHELATING: 'stops minerals in water from spoiling the formula',
  CLEANSING: 'cleans skin or hair',
  'COSMETIC COLORANT': 'adds colour',
  DENATURANT: 'makes the alcohol undrinkable',
  DEODORANT: 'reduces body odour',
  DEPILATORY: 'removes hair',
  DETANGLING: 'helps detangle hair',
  EMOLLIENT: 'softens and smooths skin',
  EMULSIFYING: 'helps oil and water mix',
  'EMULSION STABILISING': 'keeps the formula from separating',
  EXFOLIATING: 'loosens dead skin cells',
  'FILM FORMING': 'leaves a thin film on skin or hair',
  FLAVOURING: 'adds flavour',
  'FOAM BOOSTING': 'boosts lather',
  FOAMING: 'makes the product lather',
  'GEL FORMING': 'gives a gel texture',
  'HAIR CONDITIONING': 'conditions hair',
  'HAIR DYEING': 'colours hair',
  'HAIR FIXING': 'holds hairstyles in place',
  'HAIR WAVING OR STRAIGHTENING': 'reshapes hair',
  HUMECTANT: 'draws water into the skin',
  HYDROTROPE: 'helps other ingredients dissolve',
  KERATOLYTIC: 'loosens dead skin cells',
  MASKING: "masks the product's base smell",
  MOISTURISING: 'moisturises',
  'NAIL CONDITIONING': 'conditions nails',
  OPACIFYING: 'makes the product less see-through',
  'ORAL CARE': 'used in oral care',
  OXIDISING: 'used in hair colouring and bleaching',
  PEARLESCENT: 'adds a pearly shine',
  PERFUMING: 'adds scent',
  PLASTICISER: 'keeps films flexible',
  PRESERVATIVE: 'keeps the product free of bacteria and mould',
  PROPELLANT: 'pushes the product out of a spray can',
  REDUCING: 'used in perms and hair straightening',
  REFATTING: 'replaces oils that washing strips away',
  REFRESHING: 'gives a cooling, fresh feel',
  'SKIN CONDITIONING': 'keeps skin in good condition',
  'SKIN CONDITIONING - EMOLLIENT': 'softens and smooths skin',
  'SKIN CONDITIONING - HUMECTANT': 'draws water into the skin',
  'SKIN CONDITIONING - MISCELLANEOUS': 'keeps skin in good condition',
  'SKIN CONDITIONING - OCCLUSIVE': 'seals moisture into the skin',
  'SKIN PROTECTING': 'helps protect the skin',
  SMOOTHING: 'smooths the skin surface',
  SOLVENT: 'dissolves other ingredients',
  SOOTHING: 'helps calm the skin',
  STABILISING: 'keeps the formula stable',
  SURFACTANT: 'helps the product spread and rinse off',
  'SURFACTANT - CLEANSING': 'cleans by lifting away oil and dirt',
  'SURFACTANT - DISPERSING NON-SOLUBLE': 'spreads other ingredients evenly',
  'SURFACTANT - EMULSIFYING': 'helps oil and water mix',
  'SURFACTANT - FOAM BOOSTING': 'boosts lather',
  'SURFACTANT - HYDROTROPE': 'helps other ingredients dissolve',
  'SURFACTANT - SOLUBILIZING': 'helps oils dissolve in water',
  TANNING: 'darkens skin without sun',
  TONIC: 'gives a toned, refreshed feel',
  'UV ABSORBER': 'protects the product from UV light',
  'UV FILTER': 'filters UV rays to protect skin',
  'VISCOSITY CONTROLLING': 'adjusts thickness',
};

// Order in which functions are worth telling a skincare user about. CosIng lists them
// alphabetically, which put "denaturant" and "hair conditioning" first for glycerin.
const FUNCTION_PRIORITY = [
  'SKIN CONDITIONING - HUMECTANT', 'HUMECTANT', 'MOISTURISING', 'SKIN CONDITIONING - EMOLLIENT', 'EMOLLIENT',
  'SKIN CONDITIONING - OCCLUSIVE', 'UV FILTER', 'PRESERVATIVE', 'EXFOLIATING', 'KERATOLYTIC', 'SOOTHING',
  'SKIN PROTECTING', 'BLEACHING', 'ANTIMICROBIAL', 'ANTIOXIDANT', 'SURFACTANT - CLEANSING', 'CLEANSING',
  'ASTRINGENT', 'SKIN CONDITIONING', 'SKIN CONDITIONING - MISCELLANEOUS', 'PERFUMING', 'MASKING',
  'EMULSIFYING', 'SURFACTANT - EMULSIFYING', 'TANNING', 'COSMETIC COLORANT', 'ABRASIVE', 'ABSORBENT',
  'SMOOTHING', 'REFRESHING', 'FILM FORMING', 'SURFACTANT', 'FOAMING', 'SOLVENT', 'VISCOSITY CONTROLLING',
];

// Roles that only matter for niche products; never worth a second clause in a skincare description.
const MINOR = new Set(['DENATURANT', 'DEODORANT', 'ORAL CARE', 'FLAVOURING', 'ANTICORROSIVE', 'ANTISTATIC', 'HAIR CONDITIONING', 'HAIR DYEING', 'HAIR FIXING', 'HAIR WAVING OR STRAIGHTENING', 'NAIL CONDITIONING', 'PROPELLANT', 'PLASTICISER', 'REDUCING', 'OXIDISING']);

function rankFunctions(functions: string[]): string[] {
  const rank = (f: string) => {
    const i = FUNCTION_PRIORITY.indexOf(f.toUpperCase());
    return i === -1 ? FUNCTION_PRIORITY.length : i;
  };
  return [...functions].sort((a, b) => rank(a) - rank(b));
}

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
  const base = raw.replace(/[​'"`*]/g, ' ').replace(/\s+/g, ' ').trim();
  const out = new Set<string>();
  const add = (s: string) => {
    const t = s.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)]+$/g, '').trim();
    if (t.length >= 3) out.add(t);
  };
  add(base);
  add(base.replace(/\([^)]*\)?/g, ' ').replace(/\s+/g, ' '));
  for (const part of base.split('/')) add(part);
  // "1,3 Butylene glycol" → "Butylene glycol", "2-Phenoxyethanol" → "Phenoxyethanol" (tried last,
  // so a real locant name like "1,2-Hexanediol" still matches first).
  add(base.replace(/^\d+(,\d+)*[- ]+/, ''));
  return Array.from(out).slice(0, 5);
}

function zoneFromEu(annexes: string[], functions: string[], conditionalBan: boolean): IngredientZone {
  if (annexes.includes('II')) return conditionalBan ? 'green' : 'yellow';
  if (annexes.includes('III')) return functions.some((f) => /PERFUMING|MASKING/i.test(f)) ? 'yellow' : 'green';
  return 'green';
}

const RATING: Record<IngredientZone, IngredientSafetyRating> = { red: 'avoid', yellow: 'caution', green: 'safe' };

function regulatorySentence(annexes: string[], conditionalBan = false): string | null {
  if (annexes.includes('II') && conditionalBan) return 'Only allowed in EU cosmetics when properly refined or purified.';
  if (annexes.includes('II')) return 'The EU bans or restricts some forms or uses of this ingredient.';
  if (annexes.includes('III')) return 'Allowed in EU cosmetics only with limits on strength or use.';
  if (annexes.includes('V')) return 'An EU-approved preservative, used within set limits.';
  if (annexes.includes('VI')) return 'An EU-approved UV filter.';
  if (annexes.includes('IV')) return 'An EU-approved colourant.';
  return null;
}

function describe(functions: string[], annexes: string[], conditionalBan = false): string | null {
  // Skip a second phrase that repeats the first ("cleans… and cleans skin or hair").
  const SAME: string[][] = [['PRESERVATIVE', 'ANTIMICROBIAL'], ['CLEANSING', 'SURFACTANT - CLEANSING', 'SURFACTANT', 'FOAMING']];
  const groupOf = (f: string) => SAME.findIndex((g) => g.includes(f));
  const picked: string[] = [];
  for (const f of rankFunctions(functions).map((x) => x.toUpperCase())) {
    if (!FUNCTION_PHRASES[f]) continue;
    const g = groupOf(f);
    const dup = picked.some((p) => FUNCTION_PHRASES[p] === FUNCTION_PHRASES[f] || (g !== -1 && groupOf(p) === g) || FUNCTION_PHRASES[p].split(' ')[0] === FUNCTION_PHRASES[f].split(' ')[0]);
    if (!dup) picked.push(f);
    if (picked.length === 2) break;
  }
  const phrases = picked.map((f) => FUNCTION_PHRASES[f]);
  // A secondary role like "denaturant" or "oral care" is noise next to the main one.
  if (phrases.length === 2 && MINOR.has(picked[1])) phrases.pop();
  const what = phrases.length ? `${phrases.join(' and ')}.` : '';
  const sentence = what ? what.charAt(0).toUpperCase() + what.slice(1) : '';
  return [sentence, regulatorySentence(annexes, conditionalBan)].filter(Boolean).join(' ') || null;
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
    where: { OR: [{ source: null }, { source: { not: IngredientSource.manual } }] },
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
