-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "product_ingredients" ADD COLUMN     "contributionId" TEXT,
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'approved';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "country" TEXT;

-- CreateTable
CREATE TABLE "product_contributions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rawIngredientText" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "autoPublishAt" TIMESTAMPTZ(6) NOT NULL,
    "reviewedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_contributions_userId_idx" ON "product_contributions"("userId");

-- CreateIndex
CREATE INDEX "product_contributions_productId_idx" ON "product_contributions"("productId");

-- CreateIndex
CREATE INDEX "product_contributions_status_autoPublishAt_idx" ON "product_contributions"("status", "autoPublishAt");

-- CreateIndex
CREATE INDEX "product_ingredients_contributionId_idx" ON "product_ingredients"("contributionId");

-- CreateIndex
CREATE INDEX "product_ingredients_moderationStatus_idx" ON "product_ingredients"("moderationStatus");

-- CreateIndex
CREATE INDEX "products_brandId_name_country_idx" ON "products"("brandId", "name", "country");

-- users_phone_key / users_googleId_key / users_appleId_key intentionally omitted:
-- already present on the live database (diff tool doesn't see them in migration history).

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "product_contributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_contributions" ADD CONSTRAINT "product_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_contributions" ADD CONSTRAINT "product_contributions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
