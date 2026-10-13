-- Anonymous label submissions: the review queue for the clean, country-by-country product catalogue.
CREATE TABLE "label_submissions" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "timesSeen" INTEGER NOT NULL DEFAULT 1,
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "label_submissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "label_submissions_fingerprint_key" ON "label_submissions"("fingerprint");
CREATE INDEX "label_submissions_country_status_idx" ON "label_submissions"("country", "status");
