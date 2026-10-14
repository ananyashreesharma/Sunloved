/**
 * Fixes ingredient ratings that contradict each other or the EU rules, found by auditing the live
 * data (2026-10-14). Run crosscheck-regulators.ts --apply first: that one moves ingredients banned
 * by the EU and another regulator to "avoid".
 *
 * 1. Duplicate rows of one ingredient that disagree (a copy with a hidden character, or a trailing
 *    full stop, rated fine while the hand-checked row says caution): every copy gets the
 *    hand-checked rating, because label checks can land on either row.
 * 2. Butylparaben and propylparaben, and their salts: the EU limits them (Annex V, 0.14%) and bans
 *    them in leave-on products for the nappy area of children under 3, so caution, not fine.
 *    Methylparaben and ethylparaben stay as rated.
 *
 * 3. Words too vague to rate ("Butter", "Preservatives"), rated fine: made unrated, so the apps say
 *    "no information" instead of vouching for something unknown.
 *
 * 4. Essential oils (scent oils that aren't carrier oils) rated fine: caution, like all fragrance.
 * 6. Every other boilerplate or missing explanation: written from the ingredient's name and EU
 *    functions by lib/describe-ingredient.ts (common plant names, ceramides, peptides, silicones…).
 * 5. Plain, accurate explanations for the most-used ingredients whose text said almost nothing.
 *
 * Prints what would change; nothing is saved without --apply. With --apply, every row it changes
 * is first written to prisma/backups/.
 *
 *   npx ts-node --transpile-only prisma/repair-ratings.ts [--apply]
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Ingredient, PrismaClient } from '@prisma/client';
import { plainDescription } from './lib/describe-ingredient';

const apply = process.argv.includes('--apply');

/** Same name ignoring case, spacing, punctuation and invisible characters. */
const key = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[­​-‏⁠﻿]/g, '')
    .replace(/[^a-z0-9]+/g, '');

const RESTRICTED_PARABEN = /\b(sodium |potassium |calcium )?(butyl|propyl) ?paraben\b|\b(butil|propil)parabeno\b/i;
const PARABEN_TEXT =
  'Paraben preservative. Allowed in the EU only at low levels (up to 0.14%), and not in leave-on products for the nappy area of children under 3.';

// Words too vague to rate: "fine" for "Preservatives" or "Butter" vouches for something unknown, so
// these become unrated ("no information").
const VAGUE = new Set(['butter', 'oil', 'oils', 'extract', 'extracts', 'gum', 'color', 'colour', 'colors', 'colours', 'silicone', 'silicones', 'preservative', 'preservatives', 'copolymer', 'crosspolymer', 'herbal extracts', 'natural extracts', 'essential oils', 'fda approved color', 'fda approved colors', 'fda approved colours'].map(key));

// Plain explanations for the most-used ingredients whose EU-function text says almost nothing
// ("Keeps skin in good condition") or misleads (xanthan gum "cleans"). Only the wording changes.
const DESCRIPTIONS: Record<string, string> = {
  "Ethylhexylglycerin": "Helps preservatives work and leaves skin feeling soft. Gentle for most skin.",
  "Xanthan Gum": "Thickener made by fermenting sugar. Gives products their gel or cream texture.",
  "Panthenol": "Provitamin B5. Helps skin hold moisture and soothes dryness and irritation.",
  "D-Panthenol": "Provitamin B5. Helps skin hold moisture and soothes dryness and irritation.",
  "Caprylyl Glycol": "Keeps skin moist and helps preservatives work.",
  "Stearic Acid": "Fatty acid that thickens creams and helps oil and water stay mixed.",
  "Lauric Acid": "Fatty acid from coconut. Helps cleansers foam and thickens creams.",
  "Myristic Acid": "Fatty acid that helps cleansers foam and thickens creams.",
  "Squalane": "Lightweight oil similar to one skin makes itself. Softens without feeling greasy.",
  "Cyclopentasiloxane": "Light silicone that gives a silky feel, then evaporates.",
  "Aloe Barbadensis Leaf Juice": "Aloe vera. Soothes skin and adds light moisture.",
  "Arginine": "Amino acid. Adjusts the formula's pH and helps skin hold moisture.",
  "Glycine": "Amino acid. Helps skin hold moisture.",
  "Serine": "Amino acid. Helps skin hold moisture.",
  "Proline": "Amino acid. Helps skin hold moisture.",
  "Alanine": "Amino acid. Helps skin hold moisture.",
  "Lecithin": "From soy or sunflower. Helps oil and water mix and softens skin.",
  "Adenosine": "Helps smooth the look of fine lines. Gentle for most skin.",
  "Simmondsia Chinensis Seed Oil": "Jojoba oil. A light, non-greasy oil that softens skin.",
  "Argania Spinosa Kernel Oil": "Argan oil. Rich in fatty acids; softens and nourishes dry skin.",
  "Prunus Amygdalus Dulcis Oil": "Sweet almond oil. Softens and nourishes dry skin. Skip it if you have a nut allergy.",
  "Glycine Soja Oil": "Soybean oil. Softens skin.",
  "Persea Gratissima Oil": "Avocado oil. A rich oil that softens dry skin.",
  "Vitis Vinifera Seed Oil": "Grapeseed oil. A light oil that softens skin.",
  "Limnanthes Alba Seed Oil": "Meadowfoam seed oil. A stable oil that softens skin.",
  "Ceramide NP": "Ceramide, one of the fats that make up the skin barrier. Helps skin keep moisture in.",
  "Ceramide AP": "Ceramide, one of the fats that make up the skin barrier. Helps skin keep moisture in.",
  "Cholesterol": "One of the fats in the skin barrier. Helps skin keep moisture in.",
  "Phytosphingosine": "Skin lipid related to ceramides. Supports the skin barrier.",
  "Hexylene Glycol": "Solvent that keeps the formula smooth and even.",
  "Glycol Distearate": "Gives cleansers and shampoos a pearly look and a thicker feel.",
  "Dicaprylyl Carbonate": "Light emollient that helps products spread and leaves a dry, non-greasy feel.",
  "Coco-Caprylate/Caprate": "Light, plant-derived emollient, often used instead of silicones.",
  "Sodium Polyacrylate": "Thickener that gives gels and creams their texture.",
  "Hydrogenated Polyisobutene": "Emollient with a smooth, cushiony feel; often used instead of mineral oil.",
  "Isononyl Isononanoate": "Light emollient that leaves skin feeling silky.",
  "Melia Azadirachta Leaf Extract": "Neem leaf. A traditional Ayurvedic plant used in products for oily and spot-prone skin.",
  "Melia Azadirachta Flower Extract": "Neem flower. A traditional Ayurvedic plant used in products for oily and spot-prone skin.",
  "Chamomilla Recutita Flower Extract": "Chamomile. Soothing; rarely, people allergic to daisy-family plants react to it.",
  "Portulaca Oleracea Extract": "Purslane extract. Soothing; often used to calm redness.",
  "Houttuynia Cordata Extract": "Plant extract popular in Korean skincare for calming oily, spot-prone skin.",
  "Madecassic Acid": "From centella asiatica (cica). Soothes skin and supports its repair.",
  "Palmitoyl Tripeptide-1": "Peptide used in anti-ageing products for firmer-looking skin.",
  "Biotin": "Vitamin B7. Conditions skin and hair.",
  "Leuconostoc/Radish Root Ferment Filtrate": "Preservative made by fermenting radish, used in \"natural\" products.",
  "Zinc Oxide": "Mineral sunscreen that blocks UVA and UVB. Gentle, even for sensitive skin. An EU-approved UV filter.",
  "Titanium Dioxide": "Mineral sunscreen that mainly blocks UVB; also whitens and adds coverage. An EU-approved UV filter.",
};

const ESSENTIAL_OIL_TEXT =
  'Essential oil, added for scent. Like fragrance, it can irritate or cause allergy, especially on sensitive skin.';

type Change = { row: Ingredient; data: Partial<Ingredient>; why: string };

(async () => {
  const prisma = new PrismaClient();
  const all = await prisma.ingredient.findMany();
  const changes: Change[] = [];

  // 1. Disagreeing duplicates: the hand-checked row wins.
  const groups = new Map<string, Ingredient[]>();
  for (const i of all) groups.set(key(i.inciName), [...(groups.get(key(i.inciName)) ?? []), i]);
  for (const rows of groups.values()) {
    if (rows.length < 2 || new Set(rows.map((r) => r.zone)).size < 2) continue;
    const truth = rows.find((r) => r.source === 'manual' || r.source === 'dermatologist_verified');
    if (!truth) {
      console.log(`  ? ${rows.map((r) => `${r.inciName}=${r.zone}`).join(' | ')}: no hand-checked row, left for review`);
      continue;
    }
    for (const r of rows) {
      if (r.id === truth.id || r.zone === truth.zone) continue;
      changes.push({
        row: r,
        data: { zone: truth.zone, safetyRating: truth.safetyRating, shortDescription: truth.shortDescription, isFragrance: truth.isFragrance, isParaben: truth.isParaben, displayName: truth.inciName },
        why: `copy of ${truth.inciName} (${truth.zone}, hand-checked)`,
      });
    }
  }

  // 2. Restricted parabens rated fine.
  for (const r of all) {
    if (r.zone !== 'green' || !RESTRICTED_PARABEN.test(r.inciName)) continue;
    if (changes.some((c) => c.row.id === r.id)) continue;
    changes.push({ row: r, data: { zone: 'yellow', safetyRating: 'caution', shortDescription: PARABEN_TEXT, isParaben: true }, why: 'EU-restricted paraben' });
  }

  // 3. Vague words rated fine.
  for (const r of all) {
    if (!r.zone || !VAGUE.has(key(r.inciName)) || r.source === 'manual') continue;
    changes.push({ row: r, data: { zone: null, safetyRating: null, shortDescription: null }, why: 'too vague to rate' });
  }

  // 4. Essential oils rated fine: scent oils that aren't also carrier oils (no emollient or
  // conditioning use). Fragrance is caution everywhere else in the app.
  for (const r of all) {
    const fn = r.function ?? '';
    if (r.zone !== 'green' || r.source === 'manual' || !/perfum|fragrance/i.test(fn) || !/\boil\b/i.test(r.inciName)) continue;
    // Calendula "oil" is flowers soaked in a carrier oil; ferments only use the oil as a base.
    if (/calendula|ferment/i.test(r.inciName)) continue;
    // Oil from peel, leaf, flower, herb, bark, wood, needles or resin is an essential oil even when
    // the EU also lists a conditioning use (orange peel oil); seed and kernel oils are carrier oils.
    const essentialPart = /\b(peel|leaf|flower|herb|bark|wood|needle|twig|resin|bud|rind|zest)\b[^,]*\boil\b/i.test(r.inciName);
    // A scent oil by its EU functions (perfuming, nothing nourishing), or by where it's pressed from.
    const scentOnly = /perfum/i.test(fn) && !/emollient|skin conditioning|hair conditioning|solvent/i.test(fn);
    if (!(scentOnly || essentialPart) || changes.some((c) => c.row.id === r.id)) continue;
    changes.push({ row: r, data: { zone: 'yellow', safetyRating: 'caution', shortDescription: ESSENTIAL_OIL_TEXT, isFragrance: true }, why: 'essential oil' });
  }

  // 5. Better wording for common ingredients (the rating is unchanged).
  const better = new Map(Object.entries(DESCRIPTIONS).map(([n, d]) => [key(n), d]));
  for (const r of all) {
    const d = better.get(key(r.inciName));
    if (!d || r.shortDescription === d || r.source === 'manual' || changes.some((c) => c.row.id === r.id)) continue;
    changes.push({ row: r, data: { shortDescription: d }, why: 'clearer explanation' });
  }

  // 6. Everything else whose explanation is boilerplate or missing: say what it is and does.
  const BOILERPLATE = /^(Keeps skin in good condition\.|Softens and smooths skin\.|Softens and smooths skin and keeps skin in good condition\.|Helps protect the skin\.|Draws water into the skin and keeps skin in good condition\.)$/;
  for (const r of all) {
    if (!r.zone || r.source === 'manual' || changes.some((c) => c.row.id === r.id)) continue;
    if (r.shortDescription && !BOILERPLATE.test(r.shortDescription)) continue;
    const d = plainDescription(r.inciName, r.function ?? '');
    if (d && d !== r.shortDescription) changes.push({ row: r, data: { shortDescription: d }, why: 'explanation written from name and EU functions' });
  }

  console.log(`\n${changes.length} change(s):`);
  const counts = new Map<string, number>();
  for (const c of changes) counts.set(c.why.replace(/^copy of .*/, 'disagreeing duplicate'), (counts.get(c.why.replace(/^copy of .*/, 'disagreeing duplicate')) ?? 0) + 1);
  for (const [why, n] of counts) console.log(`  ${String(n).padStart(4)}  ${why}`);
  if (process.argv.includes('--list'))
    for (const c of changes) console.log(`  ${c.row.inciName.padEnd(36)} ${c.row.zone ?? 'unrated'} -> ${'zone' in c.data ? c.data.zone : c.row.zone}  (${c.why})`);

  if (!apply) {
    console.log('\nPreview only. Re-run with --apply to save.');
  } else if (changes.length) {
    const dir = join(__dirname, 'backups');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `ingredients-before-repair-ratings-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeFileSync(file, JSON.stringify(changes.map((c) => c.row), null, 1), { flag: 'wx' });
    console.log(`\nBacked up ${changes.length} rows to ${file}`);
    // In batches: one transaction of thousands of updates hits the database's statement timeout and
    // saves nothing. Each batch is all-or-nothing, and a re-run picks up whatever is left.
    const BATCH = 200;
    for (let i = 0; i < changes.length; i += BATCH) {
      const part = changes.slice(i, i + BATCH);
      await prisma.$transaction(part.map((c) => prisma.ingredient.update({ where: { id: c.row.id }, data: c.data })));
      process.stdout.write(`\r  saved ${Math.min(i + BATCH, changes.length)} / ${changes.length}`);
    }
    console.log(`\nSaved ${changes.length} changes.`);
  }
  await prisma.$disconnect();
})();
