-- Migration: auth fields on users + phone_otps table
-- 2026-04-09

-- Make email nullable (phone-only users have no email)
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Make username nullable (auto-generated, will be set on onboarding)
-- Keep it unique but allow NULL (multiple NULLs are fine in PG unique index)
ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL;

-- Add new auth columns
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone"     TEXT,
  ADD COLUMN IF NOT EXISTS "name"      TEXT,
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "googleId"  TEXT,
  ADD COLUMN IF NOT EXISTS "appleId"   TEXT;

-- Unique indexes (NULL-safe: PG unique index skips NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key"    ON "users" ("phone")    WHERE "phone"    IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users" ("googleId") WHERE "googleId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_appleId_key"  ON "users" ("appleId")  WHERE "appleId"  IS NOT NULL;

-- phone_otps
CREATE TABLE IF NOT EXISTS "phone_otps" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "phone"     TEXT NOT NULL,
  "codeHash"  TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "used"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "phone_otps_phone_idx"     ON "phone_otps" ("phone");
CREATE INDEX IF NOT EXISTS "phone_otps_expiresAt_idx" ON "phone_otps" ("expiresAt");
