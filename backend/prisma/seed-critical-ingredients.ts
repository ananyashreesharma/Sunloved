/**
 * Hand-checked ratings for the ingredients SkinLens most needs to catch: skin-lightening agents
 * and prescription drugs that turn up in "fairness", "tan removal" and acne creams. Before this,
 * none of them were in the database, so a label containing hydroquinone could read "looks fine".
 *
 * Also rates fragrance consistently as caution (it was unrated, which the apps showed as fine).
 *
 * Idempotent: safe to re-run. `npm run prisma:seed:critical-ingredients`
 * Descriptions are our own wording; keep them short, plain and non-alarmist.
 */
import { IngredientSafetyRating, IngredientSource, IngredientZone, PrismaClient } from '@prisma/client';

type Entry = {
  names: string[];
  zone: IngredientZone;
  safetyRating: IngredientSafetyRating;
  shortDescription: string;
  isFragrance?: boolean;
};

const HYDROQUINONE =
  'Skin-lightening agent. Banned in cosmetics in the EU and UK, and in many countries allowed only on prescription: long unsupervised use can irritate skin and cause lasting dark patches. It should not be in an over-the-counter cream.';
const MERCURY =
  'Mercury compound. Banned in cosmetics in most countries because mercury is toxic to the kidneys and nervous system; it still turns up in illegal skin-lightening creams. Stop using any product that lists it.';
const STEROID =
  'Strong prescription steroid. Sometimes found illegally in "fairness" and acne creams; used without a doctor it can thin the skin and cause steroid acne and rebound flare-ups.';
const TRETINOIN =
  'Prescription retinoid. Effective when a doctor prescribes it, but it should not appear in an over-the-counter cosmetic, and it is not recommended during pregnancy.';
// Confirmed outright bans in EU cosmetics (Annex II), checked by hand — the automated CosIng pass
// (rate-ingredients-cosing.ts) deliberately never assigns "avoid".
const EU_BANNED_FRAGRANCE =
  'Fragrance ingredient now banned in cosmetics in the EU because of safety concerns. Older stock and products made elsewhere may still contain it.';
const EU_BANNED_PARABEN =
  'A paraben preservative banned in cosmetics in the EU because there was not enough data to show it is safe. (Other parabens, like methylparaben, are still allowed.)';
const EU_BANNED_PRESERVATIVE =
  'Preservative that releases formaldehyde; banned in cosmetics in the EU. Formaldehyde can irritate skin and cause allergies.';
const FORMALDEHYDE =
  'Preservative banned as a cosmetic ingredient in the EU: it is a skin allergen and classed as a likely carcinogen.';
const VITAMIN_D =
  'Vitamin D. Banned as a cosmetic ingredient in the EU; vitamin D belongs in food and supplements, not skincare.';
const KETOCONAZOLE =
  'Antifungal medicine. Banned in EU cosmetics; it belongs in medicated products used as directed, like prescription or pharmacy dandruff shampoos.';

// Common actives and irritants: "caution" = worth knowing, not dangerous.
const AHA =
  'Exfoliating acid (AHA). Smooths and brightens, but can sting at first and makes skin more sun-sensitive, so wear sunscreen.';
const BHA =
  'Exfoliating acid (BHA) that works inside pores, useful for breakouts. Can dry or sting at first.';
const RETINOID =
  'Retinoid (vitamin A). Helps with texture, marks and fine lines, but can irritate at first and makes skin more sun-sensitive. Not recommended in pregnancy.';
const DRYING_ALCOHOL =
  'Drying alcohol. High on a label it can leave skin tight or irritated; low down it is mostly there to help the formula.';
const MIT =
  'Preservative and a common skin allergen. The EU no longer allows it in leave-on products.';
const SLS = 'Strong cleansing agent. Can leave skin tight or irritated, especially if it stays on long.';
const NIACINAMIDE = 'Vitamin B3. Helps calm redness, even out tone and support the skin barrier. Gentle for most skin.';
const VITAMIN_C = 'Vitamin C. An antioxidant that helps brighten and even out skin tone.';

const MONOBENZONE =
  'Depigmenting drug used only for the skin condition vitiligo. It can remove skin colour permanently, well beyond where it is applied. It should never be in a cosmetic.';
const LEAD =
  'Lead compound. Banned in cosmetics in the EU and many countries: lead is toxic and builds up in the body. It has turned up in hair dyes and skin-lightening products.';
const RESORCINOL =
  'Peeling agent used in some acne and pigmentation treatments. Can irritate and, used heavily on skin over time, may affect the thyroid. Best used only as directed.';
const KOJIC =
  'Brightening ingredient from fungi, used to fade dark spots. Generally fine in skincare at low levels, but it can irritate or cause allergy, so patch-test first.';
const DEOXYARBUTIN =
  'Lab-made relative of arbutin, used to fade dark spots. Less studied than arbutin; it can break down into hydroquinone in some formulas.';

const FRAGRANCE =
  'Fragrance: a blend of scent chemicals that brands don\'t have to list individually. Fine for many people, but a common cause of irritation and allergy, especially on sensitive skin.';

const ENTRIES: Entry[] = [
  { names: ['Hydroquinone'], zone: 'red', safetyRating: 'avoid', shortDescription: HYDROQUINONE },
  {
    names: ['Mercury', 'Mercurous Chloride', 'Mercuric Chloride', 'Calomel', 'Ammoniated Mercury', 'Mercuric Oxide', 'Mercuric Iodide'],
    zone: 'red',
    safetyRating: 'avoid',
    shortDescription: MERCURY,
  },
  {
    names: [
      'Clobetasol Propionate',
      'Clobetasol',
      'Betamethasone Valerate',
      'Betamethasone Dipropionate',
      'Mometasone Furoate',
      'Fluocinolone Acetonide',
      // Also found in illegal lightening and "fairness" creams.
      'Hydrocortisone',
      'Hydrocortisone Acetate',
      'Dexamethasone',
      'Triamcinolone Acetonide',
      'Beclomethasone Dipropionate',
      'Halobetasol Propionate',
      'Fluticasone Propionate',
    ],
    zone: 'red',
    safetyRating: 'avoid',
    shortDescription: STEROID,
  },
  { names: ['Tretinoin'], zone: 'red', safetyRating: 'avoid', shortDescription: TRETINOIN },
  { names: ['Monobenzone', 'Monobenzyl Ether of Hydroquinone', 'Hydroquinone Monobenzyl Ether'], zone: 'red', safetyRating: 'avoid', shortDescription: MONOBENZONE },
  { names: ['Lead Acetate', 'Lead'], zone: 'red', safetyRating: 'avoid', shortDescription: LEAD },
  { names: ['Resorcinol'], zone: 'yellow', safetyRating: 'caution', shortDescription: RESORCINOL },
  { names: ['Kojic Acid', 'Kojic Dipalmitate'], zone: 'yellow', safetyRating: 'caution', shortDescription: KOJIC },
  { names: ['Deoxyarbutin'], zone: 'yellow', safetyRating: 'caution', shortDescription: DEOXYARBUTIN },
  {
    names: ['Butylphenyl Methylpropional', 'Hydroxyisohexyl 3-Cyclohexene Carboxaldehyde'],
    zone: 'red',
    safetyRating: 'avoid',
    shortDescription: EU_BANNED_FRAGRANCE,
  },
  {
    names: ['Isobutylparaben', 'Isopropylparaben', 'Phenylparaben', 'Benzylparaben', 'Pentylparaben'],
    zone: 'red',
    safetyRating: 'avoid',
    shortDescription: EU_BANNED_PARABEN,
  },
  { names: ['Quaternium-15'], zone: 'red', safetyRating: 'avoid', shortDescription: EU_BANNED_PRESERVATIVE },
  { names: ['Formaldehyde'], zone: 'red', safetyRating: 'avoid', shortDescription: FORMALDEHYDE },
  { names: ['Cholecalciferol', 'Ergocalciferol'], zone: 'red', safetyRating: 'avoid', shortDescription: VITAMIN_D },
  { names: ['Ketoconazole'], zone: 'red', safetyRating: 'avoid', shortDescription: KETOCONAZOLE },
  { names: ['Glycolic Acid', 'Lactic Acid', 'L-Lactic Acid', 'Mandelic Acid'], zone: 'yellow', safetyRating: 'caution', shortDescription: AHA },
  { names: ['Salicylic Acid', 'Capryloyl Salicylic Acid'], zone: 'yellow', safetyRating: 'caution', shortDescription: BHA },
  { names: ['Retinol', 'Retinal', 'Retinaldehyde', 'Retinyl Palmitate', 'Retinyl Retinoate', 'Hydroxypinacolone Retinoate'], zone: 'yellow', safetyRating: 'caution', shortDescription: RETINOID },
  { names: ['Alcohol Denat', 'Alcohol Denat.', 'Alcohol Denatured', 'SD Alcohol 40', 'Isopropyl Alcohol'], zone: 'yellow', safetyRating: 'caution', shortDescription: DRYING_ALCOHOL },
  { names: ['Methylisothiazolinone', 'Methylchloroisothiazolinone'], zone: 'yellow', safetyRating: 'caution', shortDescription: MIT },
  { names: ['Sodium Lauryl Sulfate'], zone: 'yellow', safetyRating: 'caution', shortDescription: SLS },
  { names: ['Niacinamide'], zone: 'green', safetyRating: 'safe', shortDescription: NIACINAMIDE },
  { names: ['Ascorbic Acid', '3-O-Ethyl Ascorbic Acid', 'Ethyl Ascorbic Acid', 'Sodium Ascorbyl Phosphate', 'Magnesium Ascorbyl Phosphate'], zone: 'green', safetyRating: 'safe', shortDescription: VITAMIN_C },
  {
    names: ['Fragrance', 'Parfum', 'Parfum/Fragrance', 'Fragrance/Parfum', 'Fragrance (Parfum)', 'Parfum (Fragrance)'],
    zone: 'yellow',
    safetyRating: 'caution',
    shortDescription: FRAGRANCE,
    isFragrance: true,
  },
];

export async function seedCriticalIngredients(prisma: PrismaClient) {
  let n = 0;
  for (const e of ENTRIES) {
    for (const name of e.names) {
      const existing = await prisma.ingredient.findFirst({ where: { inciName: { equals: name, mode: 'insensitive' } } });
      const data = {
        zone: e.zone,
        safetyRating: e.safetyRating,
        shortDescription: e.shortDescription,
        isFragrance: e.isFragrance ?? false,
        source: IngredientSource.manual,
        lastReviewedAt: new Date(),
      };
      if (existing) await prisma.ingredient.update({ where: { id: existing.id }, data });
      else await prisma.ingredient.create({ data: { inciName: name, ...data } });
      n++;
    }
  }

  // Every other fragrance-blend row ("Natural Fragrance", "Parfum /​ Fragrance", …) gets the same
  // caution rating — but not "fragrance-free" claims or plant names like Myristica Fragrans.
  const blends = await prisma.$executeRaw`
    UPDATE ingredients
    SET zone = 'yellow', "safetyRating" = 'caution', "isFragrance" = true, "updatedAt" = NOW()
    WHERE ("inciName" ~* '(^|[^a-z])(parfum|fragrance)([^a-z]|$)')
      AND "inciName" !~* 'free'
      AND "inciName" !~* '^myristica'
      AND zone IS DISTINCT FROM 'red'`;

  console.log(`   Critical ingredients: ${n} rated, ${blends} fragrance-blend rows set to caution.`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedCriticalIngredients(prisma)
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
