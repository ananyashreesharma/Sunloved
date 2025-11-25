/**
 * Seed Reference Data for New Schema
 * Run this after migrating to the new schema
 * 
 * Usage: npx ts-node prisma/seed-reference-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding reference data...');

  // Seed Skin Types
  console.log('  → Seeding skin types...');
  const skinTypes = [
    {
      code: 'normal',
      label: 'Normal',
      description: 'Balanced skin with no major concerns',
    },
    {
      code: 'oily',
      label: 'Oily',
      description: 'Excess sebum production, shiny appearance',
    },
    {
      code: 'dry',
      label: 'Dry',
      description: 'Lacks moisture, may feel tight or flaky',
    },
    {
      code: 'combination',
      label: 'Combination',
      description: 'Oily T-zone, dry cheeks',
    },
    {
      code: 'sensitive',
      label: 'Sensitive',
      description: 'Easily irritated, may react to products',
    },
  ];

  for (const skinType of skinTypes) {
    await prisma.skinType.upsert({
      where: { code: skinType.code },
      update: skinType,
      create: skinType,
    });
  }
  console.log(`  ✓ Created ${skinTypes.length} skin types`);

  // Seed Skin Concerns
  console.log('  → Seeding skin concerns...');
  const skinConcerns = [
    {
      code: 'acne',
      label: 'Acne',
      description: 'Breakouts, pimples, blackheads, whiteheads',
    },
    {
      code: 'hyperpigmentation',
      label: 'Hyperpigmentation',
      description: 'Dark spots, melasma, post-inflammatory marks',
    },
    {
      code: 'aging',
      label: 'Aging',
      description: 'Fine lines, wrinkles, loss of elasticity',
    },
    {
      code: 'redness',
      label: 'Redness',
      description: 'Rosacea, irritation, inflammation',
    },
    {
      code: 'dehydration',
      label: 'Dehydration',
      description: 'Lack of moisture, dull appearance',
    },
    {
      code: 'blackheads',
      label: 'Blackheads',
      description: 'Open comedones, clogged pores',
    },
    {
      code: 'whiteheads',
      label: 'Whiteheads',
      description: 'Closed comedones, small bumps',
    },
    {
      code: 'texture',
      label: 'Texture',
      description: 'Uneven skin texture, roughness',
    },
    {
      code: 'dark_circles',
      label: 'Dark Circles',
      description: 'Under-eye darkness, puffiness',
    },
    {
      code: 'pores',
      label: 'Large Pores',
      description: 'Visible, enlarged pores',
    },
    {
      code: 'dullness',
      label: 'Dullness',
      description: 'Lack of radiance, tired appearance',
    },
    {
      code: 'sun_damage',
      label: 'Sun Damage',
      description: 'UV damage, sunspots, photoaging',
    },
  ];

  for (const concern of skinConcerns) {
    await prisma.skinConcern.upsert({
      where: { code: concern.code },
      update: concern,
      create: concern,
    });
  }
  console.log(`  ✓ Created ${skinConcerns.length} skin concerns`);

  // Seed Retailers (if not already seeded)
  console.log('  → Seeding retailers...');
  const retailers = [
    {
      name: 'Sephora',
      slug: 'sephora',
      url: 'https://www.sephora.com',
    },
    {
      name: 'Amazon',
      slug: 'amazon',
      url: 'https://www.amazon.com',
    },
    {
      name: 'Ulta Beauty',
      slug: 'ulta',
      url: 'https://www.ulta.com',
    },
    {
      name: 'Nykaa',
      slug: 'nykaa',
      url: 'https://www.nykaa.com',
    },
  ];

  for (const retailer of retailers) {
    await prisma.retailer.upsert({
      where: { slug: retailer.slug },
      update: retailer,
      create: retailer,
    });
  }
  console.log(`  ✓ Created ${retailers.length} retailers`);

  console.log('✅ Reference data seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding reference data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

