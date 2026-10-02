/**
 * Enriches the `ingredients` table with metadata from two sources:
 *
 *   1) INCIDecoder ingredient pages  — aliases, function, description, zone/safetyRating
 *   2) OpenAI GPT-4o-mini           — comedogenicScore, isVegan, isOrganic, isPregnancySafe,
 *                                     isAyurvedic (only for ingredients INCIDecoder misses)
 *
 * Rule-based flags (zero cost):
 *   isParaben, isSulfate, isFragrance, isTalc, isPfas, isPhthalate
 *   — derived directly from the INCI name.
 *
 * Usage (from backend/):
 *   npx ts-node prisma/enrich-ingredients.ts
 *   npx ts-node prisma/enrich-ingredients.ts --limit=100
 *   npx ts-node prisma/enrich-ingredients.ts --only-empty       # skip already-enriched rows
 *   npx ts-node prisma/enrich-ingredients.ts --dry-run          # print what would change
 *   npx ts-node prisma/enrich-ingredients.ts --no-openai        # INCIDecoder + rules only
 *   npx ts-node prisma/enrich-ingredients.ts --delay-ms=1500
 *
 * Env:
 *   DATABASE_URL   — required
 *   OPENAI_API_KEY — optional; if absent, OpenAI step is skipped automatically
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Prisma, PrismaClient } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Zone = 'red' | 'yellow' | 'green';
type SafetyRating = 'safe' | 'caution' | 'avoid';

interface IncidecoderData {
  aliases: string[];
  function: string | null;
  shortDescription: string | null;
  description: string | null;
  zone: Zone | null;
  safetyRating: SafetyRating | null;
}

interface AiData {
  comedogenicScore: number | null;
  isVegan: boolean;
  isOrganic: boolean;
  isPregnancySafe: boolean;
  isAyurvedic: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

function cleanInciForLookup(inciName: string): string {
  return inciName
    .replace(/^\*+/, '')                     // *Cocos Nucifera → Cocos Nucifera
    .replace(/^\(And\)\s*/i, '')             // (And) Octenidine → Octenidine
    .replace(/^\([^)]{1,30}\)\s*/, '')       // (Apricot) Seed → Apricot Seed (short leading parens → keep)
    .replace(/\s*\([^)]{1,30}\)/g, '')       // Cocos Nucifera (Coconut) Oil → Cocos Nucifera Oil
    .replace(/\(\d+\.?\d*%?\)\s*$/, '')      // 1,2-Hexanediol (2.2%) → 1,2-Hexanediol
    .replace(/\*+$/, '')                     // 1,2-Hexanediol* → 1,2-Hexanediol
    .replace(/\\+$/, '')                     // trailing backslash artifacts
    // Normalise spaces around punctuation common in INCI names
    .replace(/,\s+/g, ',')                   // "1, 2-Hexanediol" → "1,2-Hexanediol"
    .replace(/\s+-\s+/g, '-')               // "Propylene - Glycol" → "Propylene-Glycol"
    .replace(/-\s+/g, '-')                  // "1,2- Hexanediol" → "1,2-Hexanediol"
    .trim();
}

function toIncidecoderSlug(inciName: string): string {
  return cleanInciForLookup(inciName)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s,-]/g, '')          // keep commas and hyphens for INCI names like "1,2-hexanediol"
    .trim()
    .replace(/,/g, '')                       // "1,2-hexanediol" → "12-hexanediol" (INCIDecoder drops commas)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── INCI name validity check ────────────────────────────────────────────────

/**
 * Quick guard: returns false if the inciName is obviously garbage
 * (Amazon JSON, marketing text, price data, image URLs, etc.).
 * Mirrors the logic in audit-ingredients.ts so enrichment never wastes
 * HTTP requests on rows that should be deleted.
 */
function isValidInciName(inciName: string): boolean {
  const n = inciName.trim();
  if (n.length === 0 || n.length > 120) return false;
  if (/&[a-z]+;|&#\d+;/.test(n)) return false; // HTML entities from bad scrapes
  // Keycap emoji like 1️⃣ (digit + variation selector + keycap)
  if (/[0-9#*]\uFE0F?\u20E3/.test(n)) return false;
  // eslint-disable-next-line no-control-regex
  if (/\p{Extended_Pictographic}/u.test(n)) return false; // emoji bullets etc.
  if (/["\{\}\[\]]/.test(n)) return false;
  if (/advertiserId|axiom\.|selectionSignals|pastActivity|STORE_ONLY|currencyCode|priceAmount/i.test(n)) return false;
  if (/^[-–]\s+[A-Z]/.test(n)) return false;
  if (/https?:\/\/|www\./.test(n)) return false;
  if (/\\+"/.test(n)) return false;
  // Sentence-like: 4+ common English words → marketing text
  const englishWords = n.match(/\b(the|and|with|for|from|that|this|our|your|its|has|are|not|but|can|been|have|more|also|skin|face|body|wash|care|uses|gives|made|best|good|rich|deep|clean|bright|glow|moisture)\b/gi) ?? [];
  if (englishWords.length >= 4) return false;
  if (/^[a-z]/.test(n) && n.includes(' ')) return false; // lowercase multi-word phrases are almost always garbage
  // All-caps marketing blobs (but allow short INCI-like acronyms such as BHA)
  const letters = (n.match(/[A-Za-z]/g) ?? []).length;
  const upper = (n.match(/[A-Z]/g) ?? []).length;
  const words = n.split(/\s+/).filter(Boolean).length;
  if (letters >= 12 && upper / Math.max(letters, 1) > 0.85 && words >= 4) return false;
  return true;
}

// ─── Rule-based flags ────────────────────────────────────────────────────────

function ruleBasedFlags(inciName: string) {
  const n = inciName.toLowerCase();
  return {
    isParaben:   /\bparaben\b/.test(n),
    isSulfate:   /\b(sulfate|sulphate)\b/.test(n),
    isFragrance: /\b(fragrance|parfum|linalool|limonene|geraniol|citronellol|eugenol|benzyl alcohol|cinnamal)\b/.test(n),
    isTalc:      /\btalc\b/.test(n),
    isPfas:      /\b(ptfe|polytetrafluoroethylene|fluorocarbon|perfluoro)\b/.test(n),
    isPhthalate: /\bphthalate\b/.test(n),
  };
}

// ─── INCIDecoder rating → our enums ──────────────────────────────────────────

/*
 * INCIDecoder uses CSS class / label text like:
 *   "superstar", "goodie"  → green / safe
 *   "ok", "so-so"          → yellow / caution
 *   "mixed", "controversial" → yellow / caution
 *   "icky"                 → red / avoid
 *
 * The label text usually appears in <span class="label ..."> inside the
 * ingredient header area.
 */
function mapRating(label: string): { zone: Zone; safetyRating: SafetyRating } | null {
  switch (label.toLowerCase().trim()) {
    case 'superstar':
    case 'goodie':
      return { zone: 'green', safetyRating: 'safe' };
    case 'ok':
    case 'so-so':
    case 'mixed':
    case 'controversial':
      return { zone: 'yellow', safetyRating: 'caution' };
    case 'icky':
      return { zone: 'red', safetyRating: 'avoid' };
    default:
      return null;
  }
}

// ─── INCIDecoder ingredient page scraper ─────────────────────────────────────

const INCIDECODER_BASE = 'https://incidecoder.com';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchIncidecoderIngredient(inciName: string): Promise<IncidecoderData | null> {
  const slug = toIncidecoderSlug(inciName);
  const url = `${INCIDECODER_BASE}/ingredients/${slug}`;

  let html: string;
  try {
    const res = await axios.get<string>(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 20000,
      responseType: 'text',
      validateStatus: (s) => s === 200 || s === 404,
    });
    if (res.status === 404) return null;
    html = res.data as string;
  } catch {
    return null;
  }

  const $ = cheerio.load(html);

  // ── Rating ───────────────────────────────────────────────────────────────
  // Real selector confirmed from INCIDecoder HTML: <div class="ourtake grey1">superstar</div>
  let zone: Zone | null = null;
  let safetyRating: SafetyRating | null = null;

  const ourtake = $('div.ourtake').first().text().trim();
  const mapped = mapRating(ourtake);
  if (mapped) {
    zone = mapped.zone;
    safetyRating = mapped.safetyRating;
  }

  // ── Aliases (also-called-like-this) ──────────────────────────────────────
  // Real structure: <div class="itemprop">
  //   <span class="label ...">Also-called-like-this:</span>
  //   <span class="value"> vitamin B3, nicotinamide</span>
  // </div>
  const aliases: string[] = [];

  $('div.itemprop').each((_, el) => {
    const label = $(el).find('span.label').text();
    if (/also-called/i.test(label)) {
      const valueText = $(el).find('span.value').text();
      valueText.split(',').forEach((a) => {
        const trimmed = a.trim();
        if (trimmed.length > 1 && trimmed.length < 80) aliases.push(trimmed);
      });
    }
  });

  // ── Function (what-it-does) ───────────────────────────────────────────────
  // Real structure: <div class="itemprop">
  //   <span class="label ...">What-it-does: </span>
  //   <span class="value"><a href="...">humectant</a>, <a>moisturising</a></span>
  // </div>
  let func: string | null = null;

  $('div.itemprop').each((_, el) => {
    const label = $(el).find('span.label').text();
    if (/what-it-does/i.test(label)) {
      const fns: string[] = [];
      $(el).find('span.value a').each((_, a) => {
        const t = $(a).text().trim();
        if (t.length > 1) fns.push(t);
      });
      // Fallback: plain text of the value span
      if (fns.length === 0) {
        const plain = $(el).find('span.value').text().trim();
        if (plain.length > 1) fns.push(...plain.split(',').map((s) => s.trim()).filter(Boolean));
      }
      if (fns.length > 0) func = fns.join(', ');
    }
  });

  // ── Description ──────────────────────────────────────────────────────────
  // Real structure:
  //   #showmore-section-quickfacts  → ul.starlist with <li> bullet facts
  //   #showmore-section-details     → main long description paragraphs
  let description: string | null = null;
  let shortDescription: string | null = null;

  // Short description = bullet points from quick-facts starlist
  const quickFacts: string[] = [];
  $('#showmore-section-quickfacts li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 5) quickFacts.push(text);
  });
  if (quickFacts.length > 0) {
    shortDescription = quickFacts[0].slice(0, 180);
  }

  // Long description = details section
  const detailsEl = $('#showmore-section-details');
  if (detailsEl.length) {
    const text = detailsEl.text().replace(/\s+/g, ' ').trim();
    if (text.length > 50) description = text.slice(0, 3000);
  }

  // Fallback to meta description
  if (!description) {
    const meta = $('meta[name="description"]').attr('content') || '';
    if (meta.length > 30) {
      description = meta.slice(0, 2000);
      if (!shortDescription) shortDescription = meta.slice(0, 180);
    }
  }

  if (!func && !description && aliases.length === 0 && !zone) {
    return null; // Page existed but had no useful data
  }

  return {
    aliases: [...new Set(aliases)].slice(0, 10),
    function: func,
    shortDescription,
    description,
    zone,
    safetyRating,
  };
}

// ─── OpenAI enrichment ────────────────────────────────────────────────────────

const OPENAI_BATCH_SIZE = 15;

async function enrichWithOpenAI(names: string[]): Promise<Map<string, AiData>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || names.length === 0) return new Map();

  const results = new Map<string, AiData>();

  for (let i = 0; i < names.length; i += OPENAI_BATCH_SIZE) {
    const batch = names.slice(i, i + OPENAI_BATCH_SIZE);

    const prompt = `You are a cosmetic chemistry expert. For each INCI ingredient name below, return a JSON array (same order) where each object has exactly these keys:
- comedogenicScore: integer 0-5 or null if unknown
- isVegan: boolean (true if the ingredient does not come from animals or animal by-products)
- isOrganic: boolean (true if typically derived from certified organic sources)
- isPregnancySafe: boolean (true if generally considered safe during pregnancy)
- isAyurvedic: boolean (true if it is a traditional Ayurvedic / Indian botanical ingredient)

Ingredient names:
${batch.map((n, idx) => `${idx + 1}. ${n}`).join('\n')}

Return ONLY a JSON array, no markdown, no explanation.`;

    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      // The model returns { "ingredients": [...] } or a bare array
      let raw = res.data.choices?.[0]?.message?.content ?? '[]';
      let parsed: AiData[];
      try {
        const outer = JSON.parse(raw);
        parsed = Array.isArray(outer) ? outer : (outer.ingredients ?? Object.values(outer));
      } catch {
        parsed = [];
      }

      batch.forEach((name, idx) => {
        const item = parsed[idx];
        if (!item) return;
        results.set(name, {
          comedogenicScore: typeof item.comedogenicScore === 'number' ? item.comedogenicScore : null,
          isVegan: !!item.isVegan,
          isOrganic: !!item.isOrganic,
          isPregnancySafe: !!item.isPregnancySafe,
          isAyurvedic: !!item.isAyurvedic,
        });
      });
    } catch (err) {
      console.warn(`  OpenAI batch ${Math.floor(i / OPENAI_BATCH_SIZE) + 1} failed:`, (err as Error).message);
    }

    // Free tier = 3 RPM → must wait ≥20s between calls.
    // Tier 1+ = 500 RPM → 500ms is fine.
    // Detect tier from env: set OPENAI_TIER=1 (or higher) once you've added $5.
    const tier = parseInt(process.env.OPENAI_TIER ?? '0', 10);
    const openAiDelay = tier >= 1 ? 500 : 21000;
    if (i + OPENAI_BATCH_SIZE < names.length) await sleep(openAiDelay);
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args['dry-run'] === true;
  const onlyEmpty = args['only-empty'] === true;
  const noOpenAI = args['no-openai'] === true;
  const deleteGarbage = args['delete-garbage'] === true;
  const limit = args['limit'] ? parseInt(String(args['limit']), 10) : undefined;
  const delayMs = args['delay-ms'] ? parseInt(String(args['delay-ms']), 10) : 1500;

  const prisma = new PrismaClient();

  // ── Fetch ingredients to process ────────────────────────────────────────
  // Always select the AI-derived fields so we can skip re-calling OpenAI
  // for ingredients already enriched in a previous run.
  const where = onlyEmpty
    ? {
        AND: [
          { description: null },
          { shortDescription: null },
          { zone: null },
        ],
      }
    : {};

  const ingredients = await prisma.ingredient.findMany({
    where,
    select: {
      id: true,
      inciName: true,
      // These tell us whether OpenAI has already been called for this row.
      // If lastReviewedAt is set and source is ai_generated → already done, skip.
      lastReviewedAt: true,
      comedogenicScore: true,
      source: true,
    },
    orderBy: { inciName: 'asc' },
    take: limit,
  });

  console.log(
    `\nEnriching ${ingredients.length} ingredient(s) — dryRun=${dryRun} onlyEmpty=${onlyEmpty} noOpenAI=${noOpenAI} delay=${delayMs}ms`,
  );

  let incidecoderHit = 0;
  let incidecoderMiss = 0;
  let skippedGarbage = 0;
  let deletedGarbage = 0;
  let openAISkipped = 0;
  let openAIQueued: string[] = [];

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

  const deleteIngredientAndLinks = async (ingredientId: string) => {
    // Delete join rows first (FK constraints)
    await prisma.productIngredient.deleteMany({ where: { ingredientId } });
    await safe('profileIngredientOverride.deleteMany', () =>
      prisma.profileIngredientOverride.deleteMany({ where: { ingredientId } }),
    );
    await safe('ingredientConflict.deleteMany', () =>
      prisma.ingredientConflict.deleteMany({
        where: { OR: [{ ingredientAId: ingredientId }, { ingredientBId: ingredientId }] },
      }),
    );
    await prisma.ingredient.delete({ where: { id: ingredientId } });
  };

  // ── Phase 1: INCIDecoder + rules ────────────────────────────────────────
  for (let i = 0; i < ingredients.length; i++) {
    const { id, inciName, lastReviewedAt, comedogenicScore, source } = ingredients[i];
    const label = `[${i + 1}/${ingredients.length}] ${inciName.slice(0, 60)}`;
    process.stdout.write(`${label} … `);

    // Skip rows that are clearly not valid INCI names (garbage from scraper)
    if (!isValidInciName(inciName)) {
      skippedGarbage++;
      if (deleteGarbage) {
        if (dryRun) {
          console.log('delete (invalid INCI name) [dry-run]');
        } else {
          await deleteIngredientAndLinks(id);
          deletedGarbage++;
          console.log('deleted (invalid INCI name)');
        }
      } else {
        console.log('skipped (invalid INCI name)');
      }
      continue;
    }

    const rules = ruleBasedFlags(inciName);
    const inci = await fetchIncidecoderIngredient(inciName);

    if (!inci) {
      console.log('INCIDecoder: miss');
      incidecoderMiss++;

      // Only queue for OpenAI if NOT already processed before.
      // "Already processed" = lastReviewedAt is set (script ran before for this ingredient).
      // This prevents re-billing OpenAI on every re-run.
      if (!lastReviewedAt && comedogenicScore === null && source !== 'ai_generated') {
        openAIQueued.push(inciName);
      } else {
        openAISkipped++;
      }
    } else {
      console.log(
        `INCIDecoder: ok (zone=${inci.zone ?? '?'} fn=${inci.function?.slice(0, 30) ?? '?'})`,
      );
      incidecoderHit++;
    }

    if (!dryRun) {
      await prisma.ingredient.update({
        where: { id },
        data: {
          ...(inci?.aliases?.length ? { aliases: inci.aliases } : {}),
          ...(inci?.function ? { function: inci.function } : {}),
          ...(inci?.shortDescription ? { shortDescription: inci.shortDescription } : {}),
          ...(inci?.description ? { description: inci.description } : {}),
          ...(inci?.zone ? { zone: inci.zone } : {}),
          ...(inci?.safetyRating ? { safetyRating: inci.safetyRating } : {}),
          // Rule-based flags always applied
          ...rules,
          source: inci ? 'community' : 'ai_generated',
          lastReviewedAt: new Date(),  // ← stamp every processed row so re-runs skip OpenAI
        },
      });
    }

    if (i < ingredients.length - 1) await sleep(delayMs);
  }

  // ── Phase 2: OpenAI for what INCIDecoder missed (first time only) ───────
  if (!noOpenAI && openAIQueued.length > 0 && process.env.OPENAI_API_KEY) {
    console.log(`\nOpenAI enrichment for ${openAIQueued.length} new ingredient(s) (${openAISkipped} already done, skipped)…`);

    const aiResults = await enrichWithOpenAI(openAIQueued);

    if (!dryRun) {
      for (const inciName of openAIQueued) {
        const ai = aiResults.get(inciName);
        // Always stamp lastReviewedAt so this ingredient is never re-billed,
        // even if OpenAI returned partial data.
        await prisma.ingredient.update({
          where: { inciName },
          data: {
            ...(ai ? {
              comedogenicScore: ai.comedogenicScore,
              isVegan: ai.isVegan,
              isOrganic: ai.isOrganic,
              isPregnancySafe: ai.isPregnancySafe,
              isAyurvedic: ai.isAyurvedic,
            } : {}),
            source: 'ai_generated',
            lastReviewedAt: new Date(),  // ← never call OpenAI for this row again
          },
        });
      }
    }

    console.log(`OpenAI: enriched ${aiResults.size}/${openAIQueued.length}`);
  } else if (!noOpenAI && openAIQueued.length > 0) {
    console.log(
      `\nSkipped OpenAI step (${openAIQueued.length} ingredients) — set OPENAI_API_KEY to enable.`,
    );
  } else if (openAISkipped > 0) {
    console.log(`\nOpenAI: skipped ${openAISkipped} already-enriched ingredient(s) — no API cost.`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`
─────────────────────────────────────
INCIDecoder hits  : ${incidecoderHit}
INCIDecoder miss  : ${incidecoderMiss}
Skipped (garbage) : ${skippedGarbage}
Deleted (garbage) : ${deletedGarbage}
OpenAI new calls  : ${openAIQueued.length}
OpenAI skipped    : ${openAISkipped}  ← already done, no cost
─────────────────────────────────────
${skippedGarbage > 0 && !deleteGarbage ? `⚠  Run: npx ts-node prisma/enrich-ingredients.ts --delete-garbage  (or audit script) to clean up ${skippedGarbage} garbage rows.` : ''}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
