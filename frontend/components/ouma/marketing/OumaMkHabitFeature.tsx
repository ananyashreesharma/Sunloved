const DAYS = ["M", "T", "W", "T", "F", "S", "S"]
const DONE = [true, true, true, false, true, true, false]

export function OumaMkHabitFeature() {
  return (
    <section className="ouma-container py-2 pb-14">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D5C3B] to-[#0A5038] p-6 text-white">
        {/* Label */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
          <span className="text-sm" aria-hidden>🔥</span>
          <span className="text-xs font-bold uppercase tracking-wider">Habit Tracker</span>
        </div>

        {/* Headline */}
        <h2 className="ouma-display text-[1.6rem] font-semibold leading-snug">
          Build the routine that actually sticks.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          Affirmation reminders, daily streaks, and milestone badges — designed to keep you showing
          up morning and night, every day.
        </p>

        {/* Streak calendar */}
        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">This week</p>
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
              <span className="text-sm" aria-hidden>🔥</span>
              <span className="text-xs font-bold">5-day streak</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    DONE[i]
                      ? "bg-white text-[#1D5C3B] shadow-sm"
                      : "bg-white/15 text-white/40"
                  }`}
                  aria-label={DONE[i] ? `${day}: completed` : `${day}: missed`}
                >
                  {DONE[i] ? "✓" : "·"}
                </div>
                <span className="text-[10px] text-white/55">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Affirmation preview */}
        <div className="mt-3 rounded-2xl bg-white/10 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
            Morning reminder · 7:30 AM
          </p>
          <p className="text-sm italic leading-relaxed text-white">
            &ldquo;Good morning sunshine ✨ Your skin healed while you slept — let&apos;s take
            care of it today.&rdquo;
          </p>
        </div>

        {/* Badges row */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              🏅
            </div>
            <p className="text-[10px] text-white/60">7 days</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              🥇
            </div>
            <p className="text-[10px] font-bold text-white">30 days</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl opacity-40">
              💎
            </div>
            <p className="text-[10px] text-white/40">100 days</p>
          </div>
          <div className="ml-3 text-xs leading-relaxed text-white/70">
            Earn badges at 7, 30 &amp; 100-day milestones
          </div>
        </div>
      </div>
    </section>
  )
}
