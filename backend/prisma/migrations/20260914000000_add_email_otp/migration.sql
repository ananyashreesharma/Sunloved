-- Migration: email_otps table (mobile email login, mirrors phone_otps)
-- 2026-09-14

CREATE TABLE IF NOT EXISTS "email_otps" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "email"     TEXT NOT NULL,
  "codeHash"  TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "used"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "email_otps_email_idx"     ON "email_otps" ("email");
CREATE INDEX IF NOT EXISTS "email_otps_expiresAt_idx" ON "email_otps" ("expiresAt");
