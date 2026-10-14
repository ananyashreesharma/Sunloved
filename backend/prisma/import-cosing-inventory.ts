/**
 * Brings the EU's whole cosmetic ingredient inventory (CosIng, ~30,000 active ingredients) into
 * SkinLens, so far more labels can be read. Clean source only: the European Commission's own
 * database, reused under Commission Decision 2011/833/EU (attribution: "CosIng data © European
 * Union"). No retailer or third-party site is scraped.
 *
 * 1. Fetch: pages through CosIng's public search (the one its website uses), politely, splitting
 *    by substance id because one query returns at most 10,000 results. Cached in prisma/data/.
 * 2. Clean: active ingredients only; names in normal INCI capitals ("PEG-100 Stearate"); the
 *    EU's US, common, INN and Ph. Eur. names kept as aliases (lower case) so labels that use them match.
 * 3. Import: rated with the same EU rules as rate-ingredients-cosing.ts (cosing-rules.ts), never
 *    "avoid" automatically. Existing rows are never re-rated or renamed: they only gain aliases,
 *    and an EU name that is another spelling of an existing row becomes that row's alias.
 *
 *   npx ts-node --transpile-only prisma/import-cosing-inventory.ts [--refetch] [--dry-run]
 */
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as querystring from 'querystring';
import { Prisma, PrismaClient } from '@prisma/client';
import { describe, RATING, zoneFromEu } from './cosing-rules';

const CACHE = path.join(__dirname, 'data', 'cosing-inventory.json');
const API = { host: 'api.tech.ec.europa.eu', path: '/search-api/prod/rest/search', key: '285a77fd-1257-4271-8507-f0c6b2961203' };
const PAGE = 100;
const CAP = 9_900; // one query can page through at most 10,000 results
const PAUSE_MS = 700; // be gentle with a public service
const dryRun = process.argv.includes('--dry-run');

type Rec = { inci: string; aliases: string[]; functions: string[]; annexes: string[]; conditionalBan: boolean; id: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function search(query: object, page: number, size = PAGE): Promise<{ total: number; results: any[] }> {
  const boundary = `----skinlens${Date.now()}`;
  const body = `--${boundary}\r\nContent-Disposition: form-data; name="query"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(query)}\r\n--${boundary}--\r\n`;
  const qs = querystring.stringify({ apiKey: API.key, text: '*', languages: 'en', pageSize: size, pageNumber: page });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: API.host,
        path: `${API.path}?${qs}`,
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(body), Origin: 'https://ec.europa.eu', Referer: 'https://ec.europa.eu/growth/tools-databases/cosing/advanced' },
        timeout: 30_000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          const j = JSON.parse(data);
          resolve({ total: j.totalResults ?? 0, results: j.results ?? [] });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end(body);
  });
}

async function retry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= 4) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

const BASE = [{ terms: { itemType: ['ingredient'] } }, { terms: { status: ['Active'] } }];
// Ids compare as text, and the service only accepts digit bounds: every id starting with p sorts
// between p and p followed by nines.
const prefixRange = (p: string) => ({ range: { substanceId: { gte: p, lte: p + '99999999' } } });

/** Every active ingredient, splitting substance-id prefixes until each query fits under the cap. */
async function fetchAll(only?: string[], into: any[] = []): Promise<any[]> {
  const out = new Map<string, any>(into.map((r) => [r.reference ?? JSON.stringify(r.metadata?.inciName), r]));
  const all = (await retry(() => search({ bool: { must: BASE } }, 1, 1))).total;
  console.log(`CosIng: ${all} active ingredients`);
  async function pageThrough(query: object, total: number) {
    for (let page = 1; (page - 1) * PAGE < total; page++) {
      const { results } = await retry(() => search(query, page));
      for (const r of results) out.set(r.reference ?? JSON.stringify(r.metadata?.inciName), r);
      await sleep(PAUSE_MS);
    }
  }
  async function visit(prefix: string) {
    const query = { bool: { must: [...BASE, prefixRange(prefix)] } };
    const { total } = await retry(() => search(query, 1, 1));
    await sleep(PAUSE_MS);
    if (total === 0) return;
    if (total <= CAP) {
      await pageThrough(query, total);
      console.log(`  prefix ${prefix.padEnd(4)} ${String(total).padStart(5)}   (${out.size} so far)`);
      return;
    }
    // Too many: the exact id, then every longer prefix.
    await pageThrough({ bool: { must: [...BASE, { terms: { substanceId: [prefix] } }] } }, PAGE);
    for (let d = 0; d <= 9; d++) await visit(prefix + d);
  }
  for (const p of only ?? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) await visit(p);
  console.log(`Fetched ${out.size} of ${all}.`);
  return [...out.values()];
}

// INCI names come in capitals; these stay that way.
const KEEP_UPPER = new Set(['PEG', 'PPG', 'CI', 'EDTA', 'HEDTA', 'BHT', 'BHA', 'DEA', 'MEA', 'TEA', 'MIPA', 'PCA', 'PVP', 'VA', 'VP', 'HDI', 'IPDI', 'TDI', 'DNA', 'RNA', 'SD', 'UV', 'AMP', 'AMPD', 'PEI', 'PG', 'DMDM', 'MDI', 'PET', 'PTFE', 'HCL', 'HC', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'SH', 'EGF', 'FGF', 'TGF', 'IGF', 'CTFA', 'USP', 'NF', 'D&C', 'FD&C', 'ATP', 'NAD', 'NADH', 'CBD']);
export function inciCase(upper: string): string {
  return upper
    .toLowerCase()
    .replace(/[a-z0-9&]+/g, (w) => (KEEP_UPPER.has(w.toUpperCase()) || /^[a-z]\d/.test(w) ? w.toUpperCase() : w))
    .replace(/(^|[\s(/\[-])([a-z])/g, (_m, sep: string, c: string) => sep + c.toUpperCase())
    .replace(/\bhcl\b/gi, 'HCl');
}

/**
 * Hand-checked "avoid" for whole categories the EU bans outright (Annex II, no "except"): products
 * of human origin (Annex II/416), toxic heavy-metal compounds, and hormones. Automated EU rules
 * never say "avoid"; these categories are unambiguous, so they are marked by hand rule instead.
 */
export function bannedCategory(upperName: string, annexes: string[], conditionalBan: boolean): string | null {
  if (!annexes.includes('II') || conditionalBan) return null;
  if (/^HUMAN\b/.test(upperName)) return 'Made from human cells, tissue or blood. Products of human origin are banned in cosmetics in the EU.';
  if (/\b(CADMIUM|ANTIMONY|LEAD|MERCUR\w*|THALLIUM|ARSENIC|BERYLLIUM)\b/.test(upperName) || upperName === 'CHROMIUM')
    return 'A compound of a toxic heavy metal. Banned in cosmetics in the EU; it has turned up in illegal and counterfeit products.';
  if (/\b(ESTRADIOL|PROGESTERONE|TESTOSTERONE)\b/.test(upperName)) return 'A hormone. Hormones are banned in cosmetics in the EU; they belong in medicines prescribed by a doctor.';
  return null;
}

/** Same lookup key as hand-ratings: case, punctuation and spacing don't matter. */
const key = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[­​-‏⁠﻿]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function clean(raw: any[]): Rec[] {
  const recs: Rec[] = [];
  for (const r of raw) {
    const m = r.metadata ?? {};
    // Footnote marks ("[1]") go; group entries listing several substances ("X[1]; Y[2]") are
    // annex groupings, not names that appear on labels.
    const inci: string | undefined = m.inciName?.[0]?.replace(/\[\d+\]/g, '').trim();
    if (!inci || inci.length > 200 || inci.includes(';')) continue;
    const restrictions = ((m.cosmeticRestriction ?? []) as string[]).join('\n');
    const annexes = Array.from(new Set(restrictions.split(/\s+/).map((t) => t.split('/')[0]).filter((a) => /^[IVX]+$/.test(a))));
    const names = [...(m.inciUsaName ?? []), ...(m.nameOfCommonIngredientsGlossary ?? []), ...(m.innName ?? []), ...(m.phEurName ?? [])]
      .flatMap((n: string) => n.split(/\s*;\s*/))
      .map((n: string) => n.trim().toLowerCase())
      .filter((n: string) => n.length >= 3 && n.length <= 150 && n !== '-' && key(n) !== key(inci));
    recs.push({
      inci: inciCase(inci),
      aliases: Array.from(new Set(names)),
      functions: (m.functionName ?? []) as string[],
      annexes,
      conditionalBan: annexes.includes('II') && /\bexcept\b/i.test(restrictions),
      id: m.substanceId?.[0] ?? '',
    });
  }
  return recs;
}

async function main() {
  let raw: any[];
  const only = process.argv.find((a) => a.startsWith('--prefixes='))?.split('=')[1].split(',');
  if (fs.existsSync(CACHE) && only) {
    // Fetch just these id prefixes and merge them into the cached copy.
    raw = await fetchAll(only, JSON.parse(fs.readFileSync(CACHE, 'utf8')));
    fs.writeFileSync(CACHE, JSON.stringify(raw));
  } else if (fs.existsSync(CACHE) && !process.argv.includes('--refetch')) {
    raw = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    console.log(`Using cached CosIng inventory (${raw.length}); --refetch to download again.`);
  } else {
    raw = await fetchAll();
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(raw));
  }
  const recs = clean(raw);

  const prisma = new PrismaClient();
  const existing = await prisma.ingredient.findMany({ select: { id: true, inciName: true, displayName: true, aliases: true } });
  const byKey = new Map<string, (typeof existing)[number]>();
  for (const e of existing) for (const n of [e.inciName, e.displayName, ...e.aliases]) if (n && !byKey.has(key(n))) byKey.set(key(n), e);

  const aliasAdds = new Map<string, Set<string>>();
  const addAliases = (id: string, names: string[]) => {
    const set = aliasAdds.get(id) ?? new Set<string>();
    names.forEach((n) => set.add(n.toLowerCase()));
    aliasAdds.set(id, set);
  };
  const creates: Prisma.IngredientCreateManyInput[] = [];
  const seen = new Set<string>();
  let asAlias = 0;
  for (const r of recs) {
    const k = key(r.inci);
    if (seen.has(k)) continue;
    seen.add(k);
    const same = byKey.get(k);
    if (same) {
      if (r.aliases.length) addAliases(same.id, r.aliases);
      continue;
    }
    // The EU name is another name of a row we have ("Cocos Nucifera Oil" for "Coconut Oil").
    const twin = r.aliases.map((a) => byKey.get(key(a))).find(Boolean);
    if (twin) {
      addAliases(twin.id, [r.inci, ...r.aliases]);
      asAlias++;
      continue;
    }
    const banned = bannedCategory(r.inci.toUpperCase(), r.annexes, r.conditionalBan);
    if (banned) {
      creates.push({ inciName: r.inci, aliases: r.aliases, function: r.functions.map((f) => f.toLowerCase()).join(', ') || null, zone: 'red', safetyRating: 'avoid', shortDescription: banned, regulatoryNotes: 'EU CosIng: Annex II', source: 'manual', lastReviewedAt: new Date() });
      continue;
    }
    const zone = zoneFromEu(r.annexes, r.functions, r.conditionalBan);
    creates.push({
      inciName: r.inci,
      aliases: r.aliases,
      function: r.functions.length ? r.functions.map((f) => f.toLowerCase()).join(', ') : null,
      zone,
      safetyRating: RATING[zone],
      shortDescription: describe(r.functions, r.annexes, r.conditionalBan),
      regulatoryNotes: r.annexes.length ? `EU CosIng: Annex ${r.annexes.join(', ')}${r.conditionalBan ? ' (conditional)' : ''}` : 'EU CosIng: listed, no restrictions',
      isFragrance: r.functions.some((f) => /PERFUMING/i.test(f)),
      isParaben: /paraben\b/i.test(r.inci),
      isSulfate: /\bsulfate\b/i.test(r.inci) && r.functions.some((f) => /CLEANSING|SURFACTANT/i.test(f)),
    });
  }
  const zones = creates.reduce<Record<string, number>>((a, c) => ((a[c.zone as string] = (a[c.zone as string] ?? 0) + 1), a), {});
  console.log(`Clean records: ${recs.length}. New ingredients: ${creates.length} (${JSON.stringify(zones)}). Existing rows gaining aliases: ${aliasAdds.size} (${asAlias} EU names that are another spelling of a row we have).`);
  console.log('Examples:', creates.slice(0, 8).map((c) => c.inciName).join(' | '));
  if (dryRun) {
    await prisma.$disconnect();
    return;
  }

  for (let i = 0; i < creates.length; i += 1000) {
    await prisma.ingredient.createMany({ data: creates.slice(i, i + 1000), skipDuplicates: true });
    console.log(`  created ${Math.min(i + 1000, creates.length)}/${creates.length}`);
  }
  let n = 0;
  for (const [id, names] of aliasAdds) {
    const e = existing.find((x) => x.id === id)!;
    const merged = Array.from(new Set([...e.aliases.map((a) => a.toLowerCase()), ...names])).slice(0, 40);
    if (merged.length !== e.aliases.length) await prisma.ingredient.update({ where: { id }, data: { aliases: merged } });
    if (++n % 500 === 0) console.log(`  aliases ${n}/${aliasAdds.size}`);
  }
  console.log(`Done. Ingredients now: ${await prisma.ingredient.count()}`);
  await prisma.$disconnect();
}

// Only when run directly, never when another file imports inciCase.
if (require.main === module) main();
