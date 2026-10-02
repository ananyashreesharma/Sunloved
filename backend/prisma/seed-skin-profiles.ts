import { PrismaClient } from '@prisma/client';

// Codes match the onboarding wizard's chip options 1:1 (frontend/components/ouma/onboarding).
const SKIN_TYPES = [
  { code: 'oily', label: 'Oily' },
  { code: 'dry', label: 'Dry' },
  { code: 'combination', label: 'Combination' },
  { code: 'sensitive', label: 'Sensitive' },
];

const SKIN_CONCERNS = [
  { code: 'acne', label: 'Acne' },
  { code: 'pigmentation', label: 'Pigmentation' },
  { code: 'redness', label: 'Redness' },
  { code: 'texture', label: 'Texture' },
  { code: 'dullness', label: 'Dullness' },
];

export async function seedSkinProfiles(prisma: PrismaClient) {
  for (const t of SKIN_TYPES) {
    await prisma.skinType.upsert({ where: { code: t.code }, update: { label: t.label }, create: t });
  }
  for (const c of SKIN_CONCERNS) {
    await prisma.skinConcern.upsert({ where: { code: c.code }, update: { label: c.label }, create: c });
  }
  console.log(`   Skin profiles: ${SKIN_TYPES.length} types, ${SKIN_CONCERNS.length} concerns.`);
}
