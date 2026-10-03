"use client"

// V3 routine on the web: same screen as the mobile app. Morning/Night tabs (Night turns the whole
// page dark), the date and a big "Tonight", the moon or sunrise filling as steps are ticked, a
// clash note for retinoid + acid on the same night, and the numbered steps with highlighter marks.
// Works for guests (this browser) and signed-in people (their account) alike.

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { findRoutineClash, isDueOn, stepKind, stepSortKey, todayKey, type StepFrequency, type StepKind, type StreakDayStatus } from "@skinlens/shared"
import { getRoutine, getStreak, getStreakHistory, toggleRoutineStep, updateRoutineStep } from "@/lib/api"
import { getGuestRoutine, getGuestStreak, getGuestStreakHistory, setGuestStepFrequency, toggleGuestStep } from "@/lib/guest-store"
import { useAppChrome } from "@/lib/app-chrome-context"
import { useIsGuest } from "@/lib/use-guest"
import { Moon, Sunrise } from "./Sky"

type Period = "morning" | "night"
type Step = { id: string; name: string; brand: string | null; frequency: StepFrequency; done: boolean; rest: boolean; kind: StepKind | null }

const KIND: Record<StepKind, string> = {
  cleanse: "Cleanse",
  exfoliate: "Exfoliate",
  serum: "Serum",
  treat: "Treat",
  moisturise: "Moisturise",
  seal: "Seal",
  sunscreen: "Sunscreen",
}
const FREQ: Record<StepFrequency, string> = { daily: "Daily", alternate: "Every other day", twice_weekly: "Twice a week" }
const QUICK = ["Cleanser", "Toner", "Serum", "Moisturiser", "SPF"]

function shiftDay(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function RoutinePage() {
  const isGuest = useIsGuest()
  const { setNight } = useAppChrome()
  const [period, setPeriod] = useState<Period>(() => (new Date().getHours() < 15 ? "morning" : "night"))
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [error, setError] = useState(false)
  const [streak, setStreak] = useState(0)
  const [week, setWeek] = useState<StreakDayStatus[]>([])
  const [clashDismissed, setClashDismissed] = useState(false)
  const night = period === "night"

  useEffect(() => {
    setNight(night)
    return () => setNight(false)
  }, [night, setNight])

  const load = useCallback(
    async (p: Period) => {
      const today = todayKey()
      try {
        setError(false)
        if (isGuest) {
          const r = getGuestRoutine(p)
          setSteps(r.steps.map((s) => ({ id: s.id, name: s.name, brand: s.brand, frequency: s.frequency, done: s.done, rest: s.rest, kind: s.kind })))
          setStreak(getGuestStreak().currentStreak)
        } else {
          const r = await getRoutine(p)
          // Accounts store steps in the order they were added; show them in the order they go on.
          setSteps(
            [...r.steps].sort((a, b) => stepSortKey(a.name) - stepSortKey(b.name)).map((s) => ({
              id: s.id,
              name: s.name,
              brand: s.brand,
              frequency: s.frequency,
              done: s.done,
              rest: s.rest ?? !isDueOn(s.frequency, today),
              kind: stepKind(s.name),
            })),
          )
          getStreak().then((s) => setStreak(s.currentStreak)).catch(() => {})
        }
        // Last seven days for the tally beside the streak.
        const months = Array.from(new Set([shiftDay(today, -6).slice(0, 7), today.slice(0, 7)]))
        const histories = isGuest ? months.map((m) => getGuestStreakHistory(m)) : await Promise.all(months.map((m) => getStreakHistory(m).catch(() => ({ days: [] }))))
        const byDate = new Map(histories.flatMap((h) => h.days).map((d) => [d.date, d.status]))
        const last7 = Array.from({ length: 7 }, (_, i) => byDate.get(shiftDay(today, i - 6)) ?? "paused")
        const first = last7.findIndex((st) => st === "both" || st === "one")
        setWeek(last7.map((st, i) => (first === -1 || i < first ? "future" : st)))
      } catch {
        setError(true)
      }
    },
    [isGuest],
  )

  useEffect(() => {
    load(period)
  }, [period, load])

  async function toggle(s: Step) {
    if (s.rest) return
    // Instant feedback; the saved state follows.
    setSteps((list) => list?.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) ?? null)
    if (isGuest) toggleGuestStep(s.id, period)
    else await toggleRoutineStep(s.id).catch(() => {})
    load(period)
  }

  const clash = useMemo(() => (steps ? findRoutineClash(steps) : null), [steps])

  async function alternate() {
    if (!clash) return
    if (isGuest) setGuestStepFrequency(clash.alternateStepId, "alternate")
    else await updateRoutineStep(clash.alternateStepId, { frequency: "alternate" }).catch(() => {})
    load(period)
  }

  const due = steps?.filter((s) => !s.rest) ?? []
  const doneN = due.filter((s) => s.done).length
  const complete = due.length > 0 && doneN === due.length
  const progress = due.length ? doneN / due.length : 0
  const countText = `${doneN} of ${due.length} done`
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(new Date())
  let n = 0

  return (
    <div>
      {/* Period switch + streak */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div role="tablist" aria-label="Routine" style={{ display: "flex", gap: 20 }}>
          {(["morning", "night"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => {
                setPeriod(p)
                setClashDismissed(false)
              }}
              style={{
                minHeight: 44,
                padding: 0,
                border: "none",
                background: "none",
                color: period === p ? "var(--ink)" : "var(--ink3)",
                font: "inherit",
                fontSize: 16,
                fontWeight: period === p ? 600 : 400,
                boxShadow: period === p ? "inset 0 -2px 0 var(--ink)" : "none",
                cursor: "pointer",
              }}
            >
              {p === "morning" ? "Morning" : "Night"}
            </button>
          ))}
        </div>
        <Link
          href="/app/routine/history"
          aria-label={`Streak: ${streak} ${streak === 1 ? "night" : "nights"}. Open history`}
          style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 14, color: "var(--ink2)" }}
        >
          <span aria-hidden style={{ display: "flex", gap: 3 }}>
            {week.map((st, i) => {
              const filled = st === "both" || st === "one"
              return (
                <span
                  key={i}
                  style={{
                    width: 3,
                    height: 13,
                    borderRadius: 1,
                    ...(filled ? { background: "var(--ink)" } : i === 6 || st === "future" ? { background: "var(--line)" } : { border: "1px dashed var(--ink2)" }),
                  }}
                />
              )
            })}
          </span>
          {streak} {streak === 1 ? "night" : "nights"} →
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "var(--ink2)" }}>{dateLabel}</div>
          <h1 style={{ margin: "4px 0 0", fontSize: "clamp(52px, 9vw, 72px)", fontWeight: 300, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
            <span
              key={complete ? "done" : "open"}
              className={complete ? "v3-mark" : undefined}
              style={complete ? { backgroundImage: "linear-gradient(var(--done),var(--done))", backgroundSize: "100% 38%", backgroundPosition: "0 88%", animationDuration: "700ms", animationDelay: "200ms" } : undefined}
            >
              {night ? "Tonight" : "Morning"}
            </span>
          </h1>
          {due.length > 0 && (
            <div aria-live="polite" style={{ marginTop: 10, fontSize: 17, color: "var(--ink2)" }}>
              {countText}
            </div>
          )}
        </div>
        {night ? <Moon progress={progress} /> : <Sunrise progress={progress} />}
      </div>

      {error && (
        <p style={{ marginTop: 24, fontSize: 17 }}>
          We couldn&apos;t load your routine. Check your connection and{" "}
          <button onClick={() => load(period)} style={{ font: "inherit", color: "inherit", background: "none", border: "none", padding: 0, textDecoration: "underline", cursor: "pointer" }}>
            try again
          </button>
          .
        </p>
      )}

      {/* Clash note */}
      {clash && !clashDismissed && (
        <div className="v3-fade" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.45 }}>
            <span style={{ background: "var(--hi-caution)" }}>
              {clash.a} and {clash.b}
            </span>{" "}
            on the same {night ? "night" : "morning"} can leave skin red and stinging.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--ink2)" }}>Alternating gets you the benefits of both.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="v3-btn" style={{ minHeight: 44, fontSize: 15, padding: "0 18px", borderRadius: 12 }} onClick={alternate}>
              Alternate them
            </button>
            <button className="v3-chip" style={{ border: "none", minHeight: 44 }} onClick={() => setClashDismissed(true)}>
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Steps */}
      {steps && steps.length > 0 && (
        <ol style={{ listStyle: "none", margin: "20px 0 0", padding: 0 }}>
          {steps.map((s) => {
            const num = s.rest ? "—" : String(++n).padStart(2, "0")
            const sub = s.rest ? `${night ? "Rest night" : "Rest day"} · ${FREQ[s.frequency]}` : `${s.kind ? `${KIND[s.kind]} · ` : ""}${FREQ[s.frequency]}`
            return (
              <li key={s.id} style={{ borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  role="checkbox"
                  aria-checked={s.done}
                  aria-disabled={s.rest}
                  onClick={() => toggle(s)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    minHeight: s.rest ? 60 : 80,
                    padding: "14px 0",
                    border: "none",
                    background: "none",
                    color: "var(--ink)",
                    font: "inherit",
                    textAlign: "start",
                    cursor: s.rest ? "default" : "pointer",
                    opacity: s.rest ? 0.6 : 1,
                  }}
                >
                  <span style={{ width: 56, flex: "none", fontSize: s.rest ? 24 : 40, fontWeight: 300, letterSpacing: "-0.03em", color: s.done ? "var(--ink)" : "var(--ink3)", transition: "color 240ms" }}>
                    {num}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: s.rest ? 17 : 22,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: s.rest ? "var(--ink2)" : "var(--ink)",
                        backgroundImage: "linear-gradient(var(--done),var(--done))",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "0 85%",
                        backgroundSize: s.done ? "100% 55%" : "0% 55%",
                        transition: "background-size 420ms var(--standard)",
                        WebkitBoxDecorationBreak: "clone",
                        boxDecorationBreak: "clone",
                      }}
                    >
                      {s.name}
                    </span>
                    <span style={{ display: "block", marginTop: 4, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink2)" }}>{sub}</span>
                  </span>
                </button>
                {/* Edit sits beside the tick target, not inside it. */}
                <Link href={`/app/routine/edit?id=${s.id}`} aria-label={`Edit ${s.name}`} className="v3-step-edit">
                  Edit
                </Link>
              </li>
            )
          })}
          <li style={{ borderTop: "1px solid var(--line)" }}>
            <Link href={`/app/routine/add?type=${period}`} style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 16, textDecoration: "none", color: "var(--ink2)", fontSize: 15 }}>
              <span style={{ width: 56, fontSize: 24, fontWeight: 300 }}>+</span>
              Add a step
            </Link>
          </li>
        </ol>
      )}

      {/* Empty routine */}
      {steps && steps.length === 0 && (
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>{night ? "Nothing here for tonight yet." : "Nothing here for the morning yet."}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--ink2)" }}>Add what you use and we&apos;ll put it in order.</p>
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK.map((q) => (
              <Link key={q} className="v3-chip" href={`/app/routine/add?type=${period}&name=${encodeURIComponent(q)}`} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                + {q}
              </Link>
            ))}
          </div>
        </div>
      )}

      {complete && (
        <div className="v3-up" style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)", animationDelay: "300ms" }}>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }}>{night ? "Done for tonight." : "Morning done."}</div>
          <div style={{ marginTop: 4, fontSize: 16, color: "var(--ink2)" }}>{night ? "Sleep well." : "Have a good day."}</div>
        </div>
      )}
    </div>
  )
}
