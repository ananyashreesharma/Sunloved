import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing database...');

  await prisma.analyticsEvent.deleteMany({});
  await prisma.skinScanHistory.deleteMany({});
  await prisma.userSwapRequest.deleteMany({});
  await prisma.affirmationDelivery.deleteMany({});
  await prisma.userMilestoneBadge.deleteMany({});
  await prisma.milestoneBadge.deleteMany({});
  await prisma.affirmation.deleteMany({});
  await prisma.routineLog.deleteMany({});
  await prisma.routineStep.deleteMany({});
  await prisma.routine.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.streak.deleteMany({});
  await prisma.userSkinConcern.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.productPrice.deleteMany({});
  await prisma.comparison.deleteMany({});
  await prisma.productIngredient.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.retailer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.skinConcern.deleteMany({});
  await prisma.skinType.deleteMany({});
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
