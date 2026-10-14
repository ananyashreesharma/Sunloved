-- Hierarchical product categories; legacy text columns preserved for backfill.
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");
CREATE INDEX "product_categories_parentId_idx" ON "product_categories"("parentId");
CREATE INDEX "product_categories_depth_sortOrder_idx" ON "product_categories"("depth", "sortOrder");

ALTER TABLE "product_categories"
  ADD CONSTRAINT "product_categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "product_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "products_category_idx";

ALTER TABLE "products" RENAME COLUMN "category" TO "categoryLegacy";
ALTER TABLE "products" RENAME COLUMN "subCategory" TO "subCategoryLegacy";

ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;

ALTER TABLE "products"
  ADD CONSTRAINT "products_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_categoryLegacy_idx" ON "products"("categoryLegacy");
