-- Migration: OTP attempt tracking + revocable refresh tokens
-- 2026-09-14

ALTER TABLE "phone_otps" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "email_otps" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "revokedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_tokenHash_key" ON "refresh_tokens" ("tokenHash");
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON "refresh_tokens" ("userId");
CREATE INDEX IF NOT EXISTS "refresh_tokens_expiresAt_idx" ON "refresh_tokens" ("expiresAt");

DO $$ BEGIN
  ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
