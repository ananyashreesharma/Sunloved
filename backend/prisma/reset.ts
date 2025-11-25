import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing database...');
  
  await prisma.productIngredient.deleteMany({});
  await prisma.productEthics.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.brand.deleteMany({});
  
  console.log('✅ Database cleared');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

