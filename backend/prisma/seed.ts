import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedProductCategories } from './seed-categories';
import { seedIndiaCatalog } from './seed-india-catalog';
import { seedIndiaBodyHairCatalog } from './seed-india-body-hair-catalog';
import { seedSkinProfiles } from './seed-skin-profiles';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (India catalog)...');

  await seedProductCategories(prisma);
  await seedIndiaCatalog(prisma);
  await seedIndiaBodyHairCatalog(prisma, { skipIfEmpty: true });
  await seedSkinProfiles(prisma);

  console.log('');
  console.log('✅ Done: product categories + skincare NDJSON + body/hair/bath CSV (if present).');
  console.log('   More skincare SKUs: add `prisma/data/india-catalog/part-*.ndjson`.');
  console.log('   Body/hair list: `prisma/data/india-body-hair-catalog/catalog.csv` (ids `in-bh-…`).');
  console.log('   Optional makeup-only seed: npm run prisma:seed:makeup-catalog (see seed-india-makeup-catalog.ts).');
  console.log(
    '   Ingredients: npm run prisma:fetch-ingredients -- --only-missing --delay-ms=2000 (INCIDecoder only)',
  );
  console.log('   Retail URLs/prices: npm run prisma:fetch-retail-metadata -- --limit=5 --dry-run');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
