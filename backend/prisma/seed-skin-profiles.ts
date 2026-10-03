import { PrismaClient } from '@prisma/client';

// Codes match onboarding's options (packages/shared/src/profile.ts). Retired options stay, so
// profiles saved with them keep resolving.
const SKIN_TYPES = [
  { code: 'oily', label: 'Oily' },
  { code: 'dry', label: 'Dry' },
  { code: 'combination', label: 'Combination' },
  { code: 'normal', label: 'Normal' },
  { code: 'unsure', label: 'Not sure' },
  { code: 'sensitive', label: 'Sensitive' },
];

const SKIN_CONCERNS = [
  { code: 'acne', label: 'Acne' },
  { code: 'pigmentation', label: 'Dark spots' },
  { code: 'sensitivity', label: 'Sensitivity' },
  { code: 'dryness', label: 'Dryness' },
  { code: 'redness', label: 'Redness' },
  { code: 'aging', label: 'Fine lines' },
  { code: 'pores', label: 'Large pores' },
  { code: 'texture', label: 'Texture' },
  { code: 'dullness', label: 'Dullness' },
];

if (require.main === module) {
  const prisma = new PrismaClient();
  seedSkinProfiles(prisma)
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

export async function seedSkinProfiles(prisma: PrismaClient) {
  for (const t of SKIN_TYPES) {
    await prisma.skinType.upsert({ where: { code: t.code }, update: { label: t.label }, create: t });
  }
  for (const c of SKIN_CONCERNS) {
    await prisma.skinConcern.upsert({ where: { code: c.code }, update: { label: c.label }, create: c });
  }
  console.log(`   Skin profiles: ${SKIN_TYPES.length} types, ${SKIN_CONCERNS.length} concerns.`);
}
