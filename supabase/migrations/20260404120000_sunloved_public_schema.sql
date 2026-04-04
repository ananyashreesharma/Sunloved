-- Sunloved app schema (public). Safe on a new Supabase project: only creates public tables.
-- Apply: Dashboard → SQL → New query → paste → Run, OR from repo root: `supabase db push` (if linked),
-- OR from backend: set DATABASE_URL (+ DIRECT_URL) and run `npx prisma migrate deploy` then `npm run prisma:seed`.

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "website" TEXT,
    "isCrueltyFree" BOOLEAN NOT NULL DEFAULT false,
    "isVeganBrand" BOOLEAN NOT NULL DEFAULT false,
    "crueltyFreeSource" TEXT,
    "crueltyFreeLastCheckedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "volumeValue" DECIMAL(10,2),
    "volumeUnit" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "url" TEXT,
    "barcode" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "pricePerUnit" DECIMAL(10,4),
    "originalProductId" TEXT,
    "source" TEXT,
    "sourceProductId" TEXT,
    "isDiscontinued" BOOLEAN NOT NULL DEFAULT false,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "inciName" TEXT NOT NULL,
    "displayName" TEXT,
    "aliases" JSONB,
    "function" TEXT,
    "description" TEXT,
    "isFragrance" BOOLEAN NOT NULL DEFAULT false,
    "isParaben" BOOLEAN NOT NULL DEFAULT false,
    "isPhthalate" BOOLEAN NOT NULL DEFAULT false,
    "isSulfate" BOOLEAN NOT NULL DEFAULT false,
    "isTalc" BOOLEAN NOT NULL DEFAULT false,
    "isPfas" BOOLEAN NOT NULL DEFAULT false,
    "comedogenicRating" INTEGER,
    "irritancyRating" INTEGER,
    "sensitivityFlags" JSONB,
    "regulatoryNotes" TEXT,
    "source" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "concentration" DECIMAL(7,4),
    "concentrationUnit" TEXT,
    "isStarIngredient" BOOLEAN NOT NULL DEFAULT false,
    "rawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ethics" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isCrueltyFree" BOOLEAN,
    "isVegan" BOOLEAN,
    "isOrganic" BOOLEAN,
    "isFragranceFree" BOOLEAN NOT NULL DEFAULT false,
    "isAlcoholFree" BOOLEAN NOT NULL DEFAULT false,
    "isEssentialOilFree" BOOLEAN NOT NULL DEFAULT false,
    "isParabenFree" BOOLEAN NOT NULL DEFAULT false,
    "isSulfateFree" BOOLEAN NOT NULL DEFAULT false,
    "isPhthalateFree" BOOLEAN NOT NULL DEFAULT false,
    "isTalcFree" BOOLEAN NOT NULL DEFAULT false,
    "isPfasFree" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_ethics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skin_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_concerns" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skin_concerns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_skin_types" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "skinTypeId" TEXT NOT NULL,
    "score" INTEGER,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_skin_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_skin_concerns" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "skinConcernId" TEXT NOT NULL,
    "role" TEXT,
    "score" INTEGER,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_skin_concerns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL,
    "baseProductId" TEXT NOT NULL,
    "altProductId" TEXT NOT NULL,
    "similarityScore" DECIMAL(5,2) NOT NULL,
    "ecoScore" DECIMAL(5,2),
    "sensitivityScore" DECIMAL(5,2),
    "matchType" TEXT NOT NULL,
    "overlapPercentage" DECIMAL(5,2),
    "sharedKeyIngredients" JSONB,
    "priceDiff" DECIMAL(10,2),
    "pricePerUnitDiff" DECIMAL(10,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "skinTypeId" TEXT,
    "skinConcerns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "userSkinTypeId" TEXT,
    "userSkinConcerns" JSONB,
    "usedForDuration" TEXT,
    "wouldRepurchase" BOOLEAN,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "brands_isCrueltyFree_idx" ON "brands"("isCrueltyFree");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_category_subCategory_idx" ON "products"("category", "subCategory");

-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");

-- CreateIndex
CREATE INDEX "products_source_idx" ON "products"("source");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_inciName_key" ON "ingredients"("inciName");

-- CreateIndex
CREATE INDEX "ingredients_isFragrance_idx" ON "ingredients"("isFragrance");

-- CreateIndex
CREATE INDEX "ingredients_isParaben_idx" ON "ingredients"("isParaben");

-- CreateIndex
CREATE INDEX "ingredients_isSulfate_idx" ON "ingredients"("isSulfate");

-- CreateIndex
CREATE INDEX "product_ingredients_productId_idx" ON "product_ingredients"("productId");

-- CreateIndex
CREATE INDEX "product_ingredients_ingredientId_idx" ON "product_ingredients"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "product_ingredients_productId_ingredientId_key" ON "product_ingredients"("productId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "product_ingredients_productId_position_key" ON "product_ingredients"("productId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "product_ethics_productId_key" ON "product_ethics"("productId");

-- CreateIndex
CREATE INDEX "product_ethics_isVegan_idx" ON "product_ethics"("isVegan");

-- CreateIndex
CREATE INDEX "product_ethics_isCrueltyFree_idx" ON "product_ethics"("isCrueltyFree");

-- CreateIndex
CREATE INDEX "product_ethics_isFragranceFree_idx" ON "product_ethics"("isFragranceFree");

-- CreateIndex
CREATE INDEX "product_ethics_isParabenFree_idx" ON "product_ethics"("isParabenFree");

-- CreateIndex
CREATE UNIQUE INDEX "skin_types_code_key" ON "skin_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skin_concerns_code_key" ON "skin_concerns"("code");

-- CreateIndex
CREATE INDEX "product_skin_types_skinTypeId_productId_idx" ON "product_skin_types"("skinTypeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_skin_types_productId_skinTypeId_key" ON "product_skin_types"("productId", "skinTypeId");

-- CreateIndex
CREATE INDEX "product_skin_concerns_skinConcernId_productId_idx" ON "product_skin_concerns"("skinConcernId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_skin_concerns_productId_skinConcernId_role_key" ON "product_skin_concerns"("productId", "skinConcernId", "role");

-- CreateIndex
CREATE INDEX "comparisons_baseProductId_idx" ON "comparisons"("baseProductId");

-- CreateIndex
CREATE INDEX "comparisons_altProductId_idx" ON "comparisons"("altProductId");

-- CreateIndex
CREATE INDEX "comparisons_baseProductId_matchType_similarityScore_idx" ON "comparisons"("baseProductId", "matchType", "similarityScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "comparisons_baseProductId_altProductId_key" ON "comparisons"("baseProductId", "altProductId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "product_reviews_productId_rating_idx" ON "product_reviews"("productId", "rating");

-- CreateIndex
CREATE INDEX "product_reviews_userId_idx" ON "product_reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_userId_productId_key" ON "product_reviews"("userId", "productId");

-- CreateIndex
CREATE INDEX "wishlist_items_wishlistId_idx" ON "wishlist_items"("wishlistId");

-- CreateIndex
CREATE INDEX "wishlist_items_productId_idx" ON "wishlist_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlistId_productId_key" ON "wishlist_items"("wishlistId", "productId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_productId_idx" ON "favorites"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_productId_key" ON "favorites"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "retailers_name_key" ON "retailers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "retailers_slug_key" ON "retailers"("slug");

-- CreateIndex
CREATE INDEX "product_prices_productId_idx" ON "product_prices"("productId");

-- CreateIndex
CREATE INDEX "product_prices_retailerId_idx" ON "product_prices"("retailerId");

-- CreateIndex
CREATE UNIQUE INDEX "product_prices_productId_retailerId_key" ON "product_prices"("productId", "retailerId");

-- CreateIndex
CREATE INDEX "price_history_productId_recordedAt_idx" ON "price_history"("productId", "recordedAt");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_originalProductId_fkey" FOREIGN KEY ("originalProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ethics" ADD CONSTRAINT "product_ethics_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skin_types" ADD CONSTRAINT "product_skin_types_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skin_types" ADD CONSTRAINT "product_skin_types_skinTypeId_fkey" FOREIGN KEY ("skinTypeId") REFERENCES "skin_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skin_concerns" ADD CONSTRAINT "product_skin_concerns_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_skin_concerns" ADD CONSTRAINT "product_skin_concerns_skinConcernId_fkey" FOREIGN KEY ("skinConcernId") REFERENCES "skin_concerns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_altProductId_fkey" FOREIGN KEY ("altProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_skinTypeId_fkey" FOREIGN KEY ("skinTypeId") REFERENCES "skin_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

