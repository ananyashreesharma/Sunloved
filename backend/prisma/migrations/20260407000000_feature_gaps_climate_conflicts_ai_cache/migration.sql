-- Migration: feature gaps, climate zones, ingredient conflicts, AI cache
-- 2026-04-07

-- ─── New enums ──────────────────────────────────────────────────────────────

-- Rename existing subscription plan values
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'weekly' TO 'monthly';
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'yearly' TO 'annual';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'student';

-- New enums
DO $$ BEGIN
  CREATE TYPE "ConflictSeverity" AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClimateType" AS ENUM ('humid', 'dry_heat', 'temperate', 'cold');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "IngredientSource" AS ENUM ('manual', 'ai_generated', 'community', 'dermatologist_verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Gaps in existing tables ────────────────────────────────────────────────

-- users: add climateZoneId, isPregnancyMode, change locale default
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "climateZoneId" TEXT,
  ADD COLUMN IF NOT EXISTS "isPregnancyMode" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "users" ALTER COLUMN "locale" SET DEFAULT 'IN';

-- routines: add conflictCheckLastRunAt
ALTER TABLE "routines"
  ADD COLUMN IF NOT EXISTS "conflictCheckLastRunAt" TIMESTAMPTZ(6);

-- affirmations: add triggerEvent
ALTER TABLE "affirmations"
  ADD COLUMN IF NOT EXISTS "triggerEvent" TEXT;

-- ingredients: change source from TEXT to enum
ALTER TABLE "ingredients"
  ADD COLUMN IF NOT EXISTS "source_new" "IngredientSource";

UPDATE "ingredients"
SET "source_new" = CASE
  WHEN "source" = 'manual' THEN 'manual'::"IngredientSource"
  WHEN "source" = 'ai_generated' THEN 'ai_generated'::"IngredientSource"
  WHEN "source" = 'community' THEN 'community'::"IngredientSource"
  WHEN "source" = 'dermatologist_verified' THEN 'dermatologist_verified'::"IngredientSource"
  ELSE NULL
END;

ALTER TABLE "ingredients" DROP COLUMN "source";
ALTER TABLE "ingredients" RENAME COLUMN "source_new" TO "source";

-- ─── New tables ─────────────────────────────────────────────────────────────

-- climate_zones
CREATE TABLE IF NOT EXISTS "climate_zones" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
  "cityName"    TEXT NOT NULL,
  "state"       TEXT,
  "climateType" "ClimateType" NOT NULL,
  "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "climate_zones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "climate_zones_cityName_state_key" UNIQUE ("cityName", "state")
);

CREATE INDEX IF NOT EXISTS "climate_zones_climateType_idx" ON "climate_zones" ("climateType");

-- FK from users to climate_zones
ALTER TABLE "users"
  ADD CONSTRAINT "users_climateZoneId_fkey"
  FOREIGN KEY ("climateZoneId") REFERENCES "climate_zones" ("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;

ALTER TABLE "users"
  VALIDATE CONSTRAINT "users_climateZoneId_fkey";

CREATE INDEX IF NOT EXISTS "users_climateZoneId_idx" ON "users" ("climateZoneId");

-- ingredient_conflicts
CREATE TABLE IF NOT EXISTS "ingredient_conflicts" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
  "ingredientAId" TEXT NOT NULL,
  "ingredientBId" TEXT NOT NULL,
  "severity"      "ConflictSeverity" NOT NULL DEFAULT 'medium',
  "reason"        TEXT NOT NULL,
  "timingNote"    TEXT,
  "source"        TEXT,
  "createdAt"     TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "ingredient_conflicts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ingredient_conflicts_ingredientAId_ingredientBId_key" UNIQUE ("ingredientAId", "ingredientBId"),
  CONSTRAINT "ingredient_conflicts_ingredientAId_fkey" FOREIGN KEY ("ingredientAId") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ingredient_conflicts_ingredientBId_fkey" FOREIGN KEY ("ingredientBId") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ingredient_conflicts_ingredientAId_idx" ON "ingredient_conflicts" ("ingredientAId");
CREATE INDEX IF NOT EXISTS "ingredient_conflicts_ingredientBId_idx" ON "ingredient_conflicts" ("ingredientBId");

-- profile_ingredient_overrides
CREATE TABLE IF NOT EXISTS "profile_ingredient_overrides" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
  "skinTypeId"     TEXT,
  "skinConcernId"  TEXT,
  "ingredientId"   TEXT NOT NULL,
  "overrideZone"   "IngredientZone" NOT NULL,
  "overrideReason" TEXT,
  "createdAt"      TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "profile_ingredient_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profile_ingredient_overrides_skinTypeId_skinConcernId_ingredientId_key"
    UNIQUE ("skinTypeId", "skinConcernId", "ingredientId"),
  CONSTRAINT "profile_ingredient_overrides_skinTypeId_fkey"
    FOREIGN KEY ("skinTypeId") REFERENCES "skin_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "profile_ingredient_overrides_skinConcernId_fkey"
    FOREIGN KEY ("skinConcernId") REFERENCES "skin_concerns" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "profile_ingredient_overrides_ingredientId_fkey"
    FOREIGN KEY ("ingredientId") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "profile_ingredient_overrides_ingredientId_idx" ON "profile_ingredient_overrides" ("ingredientId");

-- ai_cache
CREATE TABLE IF NOT EXISTS "ai_cache" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "cacheKey"  TEXT NOT NULL,
  "prompt"    TEXT NOT NULL,
  "response"  TEXT NOT NULL,
  "model"     TEXT NOT NULL,
  "hitCount"  INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "ai_cache_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_cache_cacheKey_key" UNIQUE ("cacheKey")
);

CREATE INDEX IF NOT EXISTS "ai_cache_cacheKey_idx" ON "ai_cache" ("cacheKey");
