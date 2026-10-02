-- Keep streaks in sync on non-skipped routine completions.
-- Rules: skipped rows ignored; same calendar day as last activity → no streak change;
-- consecutive calendar day → increment current; gap → reset current to 1; backdated rows ignored.

CREATE OR REPLACE FUNCTION routine_logs_update_streaks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  s streaks%ROWTYPE;
  ld DATE;
BEGIN
  IF NEW."skipped" THEN
    RETURN NEW;
  END IF;

  ld := NEW."logDate"::date;

  SELECT * INTO s FROM "streaks" WHERE "userId" = NEW."userId";

  IF NOT FOUND THEN
    INSERT INTO "streaks" ("userId", "currentStreak", "longestStreak", "lastActiveDate", "totalDaysCompleted", "updatedAt")
    VALUES (NEW."userId", 1, 1, ld, 1, NOW());
    RETURN NEW;
  END IF;

  IF s."lastActiveDate" = ld THEN
    UPDATE "streaks" SET "updatedAt" = NOW() WHERE "userId" = NEW."userId";
    RETURN NEW;
  END IF;

  IF s."lastActiveDate" < ld THEN
    IF s."lastActiveDate" = ld - 1 THEN
      UPDATE "streaks"
      SET
        "currentStreak" = s."currentStreak" + 1,
        "longestStreak" = GREATEST(s."longestStreak", s."currentStreak" + 1),
        "lastActiveDate" = ld,
        "totalDaysCompleted" = s."totalDaysCompleted" + 1,
        "updatedAt" = NOW()
      WHERE "userId" = NEW."userId";
    ELSE
      UPDATE "streaks"
      SET
        "currentStreak" = 1,
        "longestStreak" = GREATEST(s."longestStreak", 1),
        "lastActiveDate" = ld,
        "totalDaysCompleted" = s."totalDaysCompleted" + 1,
        "updatedAt" = NOW()
      WHERE "userId" = NEW."userId";
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS routine_logs_after_insert_streaks ON "routine_logs";

CREATE TRIGGER routine_logs_after_insert_streaks
  AFTER INSERT ON "routine_logs"
  FOR EACH ROW
  EXECUTE PROCEDURE routine_logs_update_streaks();
