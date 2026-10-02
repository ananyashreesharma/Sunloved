"use client"

import Link from "next/link"
import { useEffect, useState, useCallback, useMemo } from "react"
import { getRoutine, toggleRoutineStep, getStreak, type RoutineResponse } from "@/lib/api"
import { StreakLeafIcon } from "@/components/ouma/OumaAppShell"
import { useAppChrome } from "@/lib/app-chrome-context"
import { useIsGuest } from "@/lib/use-guest"
import { getGuestRoutine, toggleGuestStep, getGuestStreak } from "@/lib/guest-store"

const LIGHT = {
  bg: "#F3F5EF",
  ink: "#17211A",
  mute: "#5A6259",
  accent: "#1E4D3A",
  card: "#FFFFFF",
  line: "rgba(23,33,26,.07)",
  track: "#E4EBE2",
  warnBg: "#F7EDD8",
  warnFg: "#7C5410",
  doneTint: "rgba(29,92,59,.08)",
  doneText: "#1D5C3B",
  enrichBorder: "rgba(23,33,26,.2)",
  checkBorder: "1.5px solid rgba(23,33,26,.25)",
}

const DARK = {
  bg: "#0E1411",
  ink: "#E7ECE7",
  mute: "#9FB0A4",
  accent: "#5C9977",
  card: "#202B23",
  line: "rgba(231,236,231,.09)",
  track: "#17201A",
  warnBg: "#33301E",
  warnFg: "#E3C27E",
  doneTint: "rgba(92,153,119,.12)",
  doneText: "#5C9977",
  enrichBorder: "rgba(231,236,231,.25)",
  checkBorder: "1.5px solid rgba(231,236,231,.3)",
}

const QUICK_STEPS = ["Cleanser", "Toner", "Serum", "Moisturiser", "SPF"]

function WarnTriangleIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" style={{ flex: "none", marginTop: 2 }}>
      <path
        d="M6 1.2 11 10.8H1zM6 4.8v2.4M6 9.2v.01"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CameraIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M4 8h3l2-2.5h6L17 8h3v10H4z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3" stroke={color} strokeWidth="1.7" />
    </svg>
  )
}

export function OumaRoutineClient() {
  const [ampm, setAmpm] = useState<"morning" | "night">("night")
  const [data, setData] = useState<RoutineResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { setNight } = useAppChrome()
  const isGuest = useIsGuest()

  const night = ampm === "night"
  const T = night ? DARK : LIGHT

  useEffect(() => {
    setNight(night)
    return () => setNight(false)
  }, [night, setNight])

  const load = useCallback(async (type: "morning" | "night", guest: boolean) => {
    if (guest) {
      setData(getGuestRoutine(type))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const res = await getRoutine(type)
      setData(res)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(ampm, isGuest)
  }, [ampm, load, isGuest])

  async function toggle(stepId: string) {
    if (!data) return
    if (isGuest) {
      toggleGuestStep(stepId)
      load(ampm, true)
      return
    }
    // Optimistic update so the checkbox feels instant.
    setData({
      ...data,
      steps: data.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)),
    })
    try {
      await toggleRoutineStep(stepId)
      load(ampm, false)
    } catch {
      load(ampm, false)
    }
  }

  async function markAllDone() {
    if (!data) return
    const targets = data.steps.filter((s) => !data.allDone && !s.done)
    if (isGuest) {
      for (const s of targets) toggleGuestStep(s.id)
      load(ampm, true)
      return
    }
    for (const s of targets) {
      await toggleRoutineStep(s.id)
    }
    load(ampm, false)
  }

  const conflictsByStep = useMemo(() => {
    const map = new Map<string, RoutineResponse["conflicts"]>()
    if (!data) return map
    for (const c of data.conflicts) {
      for (const stepId of c.stepIds) {
        const list = map.get(stepId) ?? []
        list.push(c)
        map.set(stepId, list)
      }
    }
    return map
  }, [data])

  const dayLabel = ampm === "night" ? "Tonight" : "This morning"
  const routineTitle = ampm === "night" ? "PM routine" : "AM routine"

  return (
    <div className="mx-auto w-full max-w-lg pb-6" style={{ background: T.bg, color: T.ink, transition: "background .3s, color .3s" }}>
      <style>{`@keyframes sl-slpop{0%{transform:scale(.6)}55%{transform:scale(1.18)}100%{transform:scale(1)}}`}</style>
      <header className="flex items-start justify-between pt-1">
        <div>
          <span style={{ display: "block", fontSize: 13, color: T.mute }}>{dayLabel}</span>
          <h1 className="ouma-display" style={{ fontSize: 28, textTransform: "uppercase", lineHeight: 1.05 }}>
            {routineTitle}
          </h1>
        </div>
        <Link
          href="/app/routine/history"
          className="ouma-mono no-underline"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: T.card,
            border: `1px solid ${T.line}`,
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: T.accent,
          }}
        >
          <StreakLeafIcon size={12} color={T.accent} /> <StreakCount />
        </Link>
      </header>

      <>
      {error && (
        <div style={{ marginTop: 16, borderRadius: 12, border: `1px solid ${T.line}`, background: T.card, padding: "12px 16px", fontSize: 13, color: T.mute }}>
          Couldn&apos;t load your routine. Pull to refresh or try again shortly.
        </div>
      )}

      {!loading && data && data.steps.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {data.steps.map((step, i) => {
            const stepConflicts = conflictsByStep.get(step.id) ?? []
            return (
              <div key={step.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.line}`, padding: "12px 14px" }}>
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                >
                  <span className="ouma-mono" style={{ fontSize: 13, color: T.mute, width: 12 }}>
                    {i + 1}
                  </span>
                  <span style={{ width: 40, height: 40, borderRadius: 9, background: night ? "#2A362C" : "#E4EBE2", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: step.done ? T.mute : T.ink, textDecoration: step.done ? "line-through" : "none" }}>
                      {step.name}
                    </span>
                    {step.brand && <span style={{ display: "block", fontSize: 12, color: T.mute }}>{step.brand}</span>}
                  </span>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      flex: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: step.done ? T.accent : "transparent",
                      border: step.done ? `1.5px solid ${T.accent}` : T.checkBorder,
                      animation: step.done ? "sl-slpop .3s ease-out" : "none",
                    }}
                  >
                    {step.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>

                {stepConflicts.map((c, ci) => (
                  <div key={ci} style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-start", background: T.warnBg, borderRadius: 9, padding: "9px 11px" }}>
                    <WarnTriangleIcon color={T.warnFg} />
                    <span style={{ fontSize: 12.5, color: T.warnFg, lineHeight: 1.4 }}>
                      {c.ingredientAName} + {c.ingredientBName} in the same {ampm === "night" ? "night" : "morning"} can irritate
                      {c.timingNote ? ` — ${c.timingNote}` : ""}.{" "}
                      {/* Decorative only — no step-frequency-edit endpoint exists yet to actually split steps across nights. */}
                      <span style={{ fontWeight: 600, textDecoration: "underline" }}>Split across nights</span>
                    </span>
                  </div>
                ))}

                {step.enrich && (
                  <Link
                    href="/app/scan"
                    className="ouma-mono no-underline"
                    style={{
                      marginTop: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      border: `1px dashed ${T.enrichBorder}`,
                      borderRadius: 999,
                      padding: "5px 11px",
                      fontSize: 12,
                      color: T.mute,
                    }}
                  >
                    <CameraIcon color={T.mute} />
                    Scan its label to check ingredients &amp; conflicts
                  </Link>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={markAllDone}
            disabled={data.allDone}
            style={{
              marginTop: 6,
              border: `1.5px solid ${T.accent}`,
              color: data.allDone ? T.doneText : T.accent,
              background: data.allDone ? T.doneTint : "transparent",
              borderRadius: 12,
              padding: 14,
              textAlign: "center",
              fontSize: 15,
              fontWeight: 600,
              cursor: data.allDone ? "default" : "pointer",
            }}
          >
            {data.allDone ? "All done ✓" : "Mark all done"}
          </button>
          {data.allDone && (
            <p style={{ textAlign: "center", fontSize: 13, color: T.doneText, fontWeight: 500 }}>
              {ampm === "night" ? "Done for tonight." : "Done for today."}
            </p>
          )}

          {(() => {
            const missing = QUICK_STEPS.filter((q) => !data.steps.some((s) => s.name === q))
            if (missing.length === 0) return null
            return (
              <div style={{ marginTop: 10 }}>
                <p className="ouma-mono" style={{ fontSize: 12, color: T.mute }}>
                  Also use any of these?
                </p>
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {missing.map((q) => (
                    <Link
                      key={q}
                      href={`/app/routine/add?type=${ampm}&name=${encodeURIComponent(q)}`}
                      className="no-underline"
                      style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${T.enrichBorder}`, background: T.card, color: T.ink, fontSize: 13 }}
                    >
                      + {q}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {!loading && data && data.steps.length === 0 && (
        <div style={{ marginTop: 40, textAlign: "center", padding: "0 12px" }}>
          <p className="ouma-display" style={{ fontSize: 22, textTransform: "uppercase" }}>
            Add what you use {ampm === "night" ? "at night" : "in the morning"}
          </p>
          <p style={{ marginTop: 8, fontSize: 14, color: T.mute }}>Just type the names — no scanning needed.</p>
          <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {QUICK_STEPS.map((q) => (
              <Link
                key={q}
                href={`/app/routine/add?type=${ampm}&name=${encodeURIComponent(q)}`}
                className="no-underline"
                style={{ padding: "9px 15px", borderRadius: 999, border: `1px solid ${T.enrichBorder}`, background: T.card, color: T.ink, fontSize: 13 }}
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      )}
      </>

      <div style={{ marginTop: 16, display: "flex", background: T.track, borderRadius: 12, padding: 4 }}>
        <button
          type="button"
          onClick={() => setAmpm("morning")}
          className="ouma-display"
          style={{
            flex: 1,
            textAlign: "center",
            padding: 9,
            borderRadius: 9,
            fontSize: 13,
            letterSpacing: "0.1em",
            border: "none",
            cursor: "pointer",
            background: ampm === "morning" ? (night ? T.card : "#fff") : "transparent",
            color: ampm === "morning" ? T.ink : T.mute,
            boxShadow: ampm === "morning" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
          }}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => setAmpm("night")}
          className="ouma-display"
          style={{
            flex: 1,
            textAlign: "center",
            padding: 9,
            borderRadius: 9,
            fontSize: 13,
            letterSpacing: "0.1em",
            border: "none",
            cursor: "pointer",
            background: ampm === "night" ? (night ? T.card : "#fff") : "transparent",
            color: ampm === "night" ? T.ink : T.mute,
            boxShadow: ampm === "night" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
          }}
        >
          PM
        </button>
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/app/products" className="no-underline" style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>
          My products →
        </Link>
        <Link href={`/app/routine/add?type=${ampm}`} className="no-underline" style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>
          + Add a step
        </Link>
      </div>
    </div>
  )
}

function StreakCount() {
  const isGuest = useIsGuest()
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    if (isGuest) {
      setCount(getGuestStreak().currentStreak)
      return
    }
    getStreak()
      .then((s) => setCount(s.currentStreak))
      .catch(() => setCount(0))
  }, [isGuest])
  return <span>{count ?? "–"}</span>
}
