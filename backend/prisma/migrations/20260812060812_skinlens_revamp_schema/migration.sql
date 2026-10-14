-- CreateEnum
CREATE TYPE "StepFrequency" AS ENUM ('daily', 'alternate', 'twice_weekly');

-- CreateEnum
CREATE TYPE "ReminderTone" AS ENUM ('coach', 'plain', 'off');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('push', 'whatsapp');

-- AlterTable
ALTER TABLE "ai_cache" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "climate_zones" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ingredient_conflicts" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_preferences" ADD COLUMN     "channel" "ReminderChannel" NOT NULL DEFAULT 'push',
ADD COLUMN     "muted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderTone" "ReminderTone" NOT NULL DEFAULT 'coach';

-- AlterTable
ALTER TABLE "phone_otps" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "profile_ingredient_overrides" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "routine_logs" ADD COLUMN     "completedStepIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "routine_steps" ADD COLUMN     "frequency" "StepFrequency" NOT NULL DEFAULT 'daily';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "routine_logs_userId_routineId_logDate_key" ON "routine_logs"("userId", "routineId", "logDate");

-- users_phone_key / users_googleId_key / users_appleId_key intentionally omitted here:
-- already present on the live database from an earlier partially-applied migration attempt.

-- RenameIndex
ALTER INDEX "profile_ingredient_overrides_skinTypeId_skinConcernId_ingredien" RENAME TO "profile_ingredient_overrides_skinTypeId_skinConcernId_ingre_key";

