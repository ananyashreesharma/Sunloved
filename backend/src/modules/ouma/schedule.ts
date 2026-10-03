// Mirror of packages/shared/src/schedule.ts (the apps' copy): which steps are due on a day.
// "Every other day" and "twice a week" steps have rest days; those don't count toward "done".
// Keep the two in step: same epoch, same weekdays.

type StepFrequency = 'daily' | 'alternate' | 'twice_weekly';

const EPOCH = Date.UTC(2026, 0, 5); // a Monday; anchors the every-other-day rhythm

/** Whether a step with this frequency is due on the given UTC day. */
export function isDueOn(frequency: StepFrequency, day: Date): boolean {
  if (frequency === 'daily') return true;
  const utc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  if (frequency === 'alternate') return Math.abs(Math.round((utc - EPOCH) / 86400000)) % 2 === 0;
  const weekday = new Date(utc).getUTCDay();
  return weekday === 1 || weekday === 4; // twice a week: Mondays and Thursdays
}
