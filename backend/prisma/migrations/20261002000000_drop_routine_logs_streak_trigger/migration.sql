-- The routine_logs trigger bumped the streak when a day's log row was first inserted — i.e. on the
-- FIRST step ticked, not when a routine was finished — and reset it after any missed day. That
-- contradicts the app's rule ("Streak paused, not broken": one missed day keeps the streak) and
-- pre-empted OumaService.bumpStreak, which applies the real rule on full completion.
-- The streak is now owned by OumaService alone.
DROP TRIGGER IF EXISTS routine_logs_after_insert_streaks ON "routine_logs";
DROP FUNCTION IF EXISTS routine_logs_update_streaks();
