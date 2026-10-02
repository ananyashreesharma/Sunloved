-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'active', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('weekly', 'yearly');

-- CreateEnum
CREATE TYPE "RoutineType" AS ENUM ('morning', 'night', 'weekly');

-- CreateEnum
CREATE TYPE "AffirmationTone" AS ENUM ('gentle', 'bold', 'spiritual');

-- CreateEnum
CREATE TYPE "IngredientSafetyRating" AS ENUM ('safe', 'caution', 'avoid');

-- CreateEnum
CREATE TYPE "IngredientZone" AS ENUM ('red', 'yellow', 'green');

-- CreateEnum
CREATE TYPE "SwapType" AS ENUM ('better_ingredients', 'cheaper', 'vegan_alternative');

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_productId_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_userId_fkey";

-- DropForeignKey
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_ethics" DROP CONSTRAINT "product_ethics_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_reviews" DROP CONSTRAINT "product_reviews_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_reviews" DROP CONSTRAINT "product_reviews_userId_fkey";

-- DropForeignKey
ALTER TABLE "product_skin_concerns" DROP CONSTRAINT "product_skin_concerns_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_skin_concerns" DROP CONSTRAINT "product_skin_concerns_skinConcernId_fkey";

-- DropForeignKey
ALTER TABLE "product_skin_types" DROP CONSTRAINT "product_skin_types_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_skin_types" DROP CONSTRAINT "product_skin_types_skinTypeId_fkey";

-- DropForeignKey
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_userId_fkey";

-- DropForeignKey
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_wishlistId_fkey";

-- DropIndex
DROP INDEX "comparisons_baseProductId_altProductId_key";

-- DropIndex
DROP INDEX "comparisons_baseProductId_matchType_similarityScore_idx";

-- DropIndex
DROP INDEX "product_prices_productId_retailerId_key";

-- DropIndex
DROP INDEX "product_prices_retailerId_idx";

-- DropIndex
DROP INDEX "products_category_subCategory_idx";

-- DropIndex
DROP INDEX "products_price_idx";

-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "crueltyFreeLastCheckedAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "comparisons" DROP COLUMN "ecoScore",
DROP COLUMN "matchType",
DROP COLUMN "notes",
DROP COLUMN "overlapPercentage",
DROP COLUMN "priceDiff",
DROP COLUMN "pricePerUnitDiff",
DROP COLUMN "sensitivityScore",
ADD COLUMN     "ingredientImprovements" JSONB,
ADD COLUMN     "marketAvailability" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "overlapPct" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "priceDelta" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "swapReason" TEXT,
ADD COLUMN     "swapType" "SwapType" NOT NULL DEFAULT 'better_ingredients',
ALTER COLUMN "similarityScore" SET DATA TYPE INTEGER,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "comedogenicRating",
ADD COLUMN     "comedogenicScore" INTEGER,
ADD COLUMN     "isAyurvedic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCrueltyFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOrganic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPregnancySafe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVegan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regionNotes" JSONB,
ADD COLUMN     "safetyRating" "IngredientSafetyRating",
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "zone" "IngredientZone",
DROP COLUMN "aliases",
ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "lastReviewedAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "product_ingredients" DROP COLUMN "concentrationUnit",
DROP COLUMN "isStarIngredient",
ADD COLUMN     "isStar" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "concentration" SET DATA TYPE DECIMAL(10,6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "product_prices" ADD COLUMN     "market" TEXT NOT NULL,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "lastCheckedAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "deletedAt" TIMESTAMPTZ(6),
ADD COLUMN     "discontinuedAt" TIMESTAMPTZ(6),
ADD COLUMN     "markets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "overallScore" DECIMAL(5,2),
ADD COLUMN     "search_vector" tsvector,
ALTER COLUMN "lastScrapedAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "retailers" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "skin_concerns" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "skin_types" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "displayName",
DROP COLUMN "skinConcerns",
ADD COLUMN     "deletedAt" TIMESTAMPTZ(6),
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- DropTable
DROP TABLE "favorites";

-- DropTable
DROP TABLE "price_history";

-- DropTable
DROP TABLE "product_ethics";

-- DropTable
DROP TABLE "product_reviews";

-- DropTable
DROP TABLE "product_skin_concerns";

-- DropTable
DROP TABLE "product_skin_types";

-- DropTable
DROP TABLE "wishlist_items";

-- DropTable
DROP TABLE "wishlists";

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "market" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "storeProductId" TEXT,
    "receiptData" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skin_concerns" (
    "userId" TEXT NOT NULL,
    "skinConcernId" TEXT NOT NULL,
    "severity" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skin_concerns_pkey" PRIMARY KEY ("userId","skinConcernId")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RoutineType" NOT NULL,
    "reminderTime" TIME(6),
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_steps" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "productId" TEXT,
    "stepOrder" INTEGER NOT NULL,
    "customName" TEXT,
    "notes" TEXT,
    "waitAfterMins" INTEGER,

    CONSTRAINT "routine_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "completedAt" TIMESTAMPTZ(6),
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "mood" INTEGER,

    CONSTRAINT "routine_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalDaysCompleted" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "userId" TEXT NOT NULL,
    "morningTime" TIME(6),
    "nightTime" TIME(6),
    "affirmationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "streakAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "affirmationTone" "AffirmationTone" NOT NULL DEFAULT 'gentle',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "pushToken" TEXT,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "affirmations" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" "AffirmationTone",
    "locale" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "affirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affirmation_deliveries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affirmationId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT,

    CONSTRAINT "affirmation_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_badges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "streakDaysRequired" INTEGER,
    "criteria" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_milestone_badges" (
    "userId" TEXT NOT NULL,
    "milestoneBadgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_milestone_badges_pkey" PRIMARY KEY ("userId","milestoneBadgeId")
);

-- CreateTable
CREATE TABLE "user_swap_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "swapType" "SwapType",
    "notes" TEXT,
    "comparisonId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_swap_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_scan_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "rawIngredientText" TEXT NOT NULL,
    "scannedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanResult" JSONB NOT NULL,
    "flagCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skin_scan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "properties" JSONB,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_expiresAt_idx" ON "subscriptions"("expiresAt");

-- CreateIndex
CREATE INDEX "routines_userId_idx" ON "routines"("userId");

-- CreateIndex
CREATE INDEX "routine_steps_routineId_idx" ON "routine_steps"("routineId");

-- CreateIndex
CREATE UNIQUE INDEX "routine_steps_routineId_stepOrder_key" ON "routine_steps"("routineId", "stepOrder");

-- CreateIndex
CREATE INDEX "routine_logs_userId_idx" ON "routine_logs"("userId");

-- CreateIndex
CREATE INDEX "routine_logs_routineId_idx" ON "routine_logs"("routineId");

-- CreateIndex
CREATE INDEX "routine_logs_logDate_idx" ON "routine_logs"("logDate");

-- CreateIndex
CREATE INDEX "affirmations_isActive_tone_locale_idx" ON "affirmations"("isActive", "tone", "locale");

-- CreateIndex
CREATE INDEX "affirmation_deliveries_userId_deliveredAt_idx" ON "affirmation_deliveries"("userId", "deliveredAt");

-- CreateIndex
CREATE INDEX "affirmation_deliveries_userId_affirmationId_idx" ON "affirmation_deliveries"("userId", "affirmationId");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_badges_code_key" ON "milestone_badges"("code");

-- CreateIndex
CREATE INDEX "user_swap_requests_userId_createdAt_idx" ON "user_swap_requests"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "user_swap_requests_productId_idx" ON "user_swap_requests"("productId");

-- CreateIndex
CREATE INDEX "skin_scan_history_userId_idx" ON "skin_scan_history"("userId");

-- CreateIndex
CREATE INDEX "skin_scan_history_scannedAt_idx" ON "skin_scan_history"("scannedAt");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "analytics_events_occurredAt_idx" ON "analytics_events"("occurredAt");

-- CreateIndex
CREATE INDEX "comparisons_swapType_idx" ON "comparisons"("swapType");

-- CreateIndex
CREATE UNIQUE INDEX "comparisons_baseProductId_altProductId_swapType_key" ON "comparisons"("baseProductId", "altProductId", "swapType");

-- CreateIndex
CREATE INDEX "ingredients_inciName_idx" ON "ingredients"("inciName");

-- CreateIndex
CREATE INDEX "ingredients_isAyurvedic_idx" ON "ingredients"("isAyurvedic");

-- CreateIndex
CREATE INDEX "ingredients_zone_idx" ON "ingredients"("zone");

-- CreateIndex
CREATE INDEX "ingredients_isVegan_idx" ON "ingredients"("isVegan");

-- CreateIndex
CREATE INDEX "ingredients_isPregnancySafe_idx" ON "ingredients"("isPregnancySafe");

-- CreateIndex
CREATE INDEX "ingredients_aliases_gin" ON "ingredients" USING GIN ("aliases");

-- CreateIndex
CREATE INDEX "product_prices_market_idx" ON "product_prices"("market");

-- CreateIndex
CREATE UNIQUE INDEX "product_prices_productId_retailerId_market_key" ON "product_prices"("productId", "retailerId", "market");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_markets_gin" ON "products" USING GIN ("markets");

-- CreateIndex
CREATE INDEX "products_originalProductId_idx" ON "products"("originalProductId");

-- CreateIndex
CREATE INDEX "users_skinTypeId_idx" ON "users"("skinTypeId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skin_concerns" ADD CONSTRAINT "user_skin_concerns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skin_concerns" ADD CONSTRAINT "user_skin_concerns_skinConcernId_fkey" FOREIGN KEY ("skinConcernId") REFERENCES "skin_concerns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_logs" ADD CONSTRAINT "routine_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_logs" ADD CONSTRAINT "routine_logs_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affirmation_deliveries" ADD CONSTRAINT "affirmation_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affirmation_deliveries" ADD CONSTRAINT "affirmation_deliveries_affirmationId_fkey" FOREIGN KEY ("affirmationId") REFERENCES "affirmations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_milestone_badges" ADD CONSTRAINT "user_milestone_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_milestone_badges" ADD CONSTRAINT "user_milestone_badges_milestoneBadgeId_fkey" FOREIGN KEY ("milestoneBadgeId") REFERENCES "milestone_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_swap_requests" ADD CONSTRAINT "user_swap_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_swap_requests" ADD CONSTRAINT "user_swap_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_swap_requests" ADD CONSTRAINT "user_swap_requests_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "comparisons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_scan_history" ADD CONSTRAINT "skin_scan_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_scan_history" ADD CONSTRAINT "skin_scan_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

