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
    ],
    zone: 'red',
    safetyRating: 'avoid',
    shortDescription: STEROID,
  },
  { names: ['Tretinoin'], zone: 'red', safetyRating: 'avoid', shortDescription: TRETINOIN },
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
