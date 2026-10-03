"use client"

// V3 streak (web): "N nights", the pause rule in plain words, a month of dots and the milestones.
// Same screen as the mobile app; guests read this browser, accounts read the server.

import Link from "next/link"
import { useEffect, useState } from "react"
import { MILESTONES, todayKey, type StreakDayStatus, type StreakSummary } from "@skinlens/shared"
import { getStreak, getStreakHistory } from "@/lib/api"
import { getGuestStreak, getGuestStreakHistory } from "@/lib/guest-store"
import { useIsGuest } from "@/lib/use-guest"

type Day = { date: string; status: StreakDayStatus }
const MS_NAME: Record<number, string> = { 7: "A full week", 30: "A whole moon", 100: "One hundred nights" }

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export function HistoryPage() {
  const isGuest = useIsGuest()
  const today = todayKey()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [days, setDays] = useState<Day[]>([])
  const [streak, setStreak] = useState<StreakSummary | null>(null)

  useEffect(() => {
    if (isGuest) {
      setStreak(getGuestStreak())
      setDays(getGuestStreakHistory(month).days)
      return
    }
    getStreak().then(setStreak).catch(() => {})
    getStreakHistory(month)
      .then((h) => setDays(h.days))
      .catch(() => setDays([]))
  }, [isGuest, month])

  const [y, m] = month.split("-").map(Number)
  const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)))
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
  const current = streak?.currentStreak ?? 0
  const longest = streak?.longestStreak ?? 0
  const isCurrentMonth = month === today.slice(0, 7)

  function dot(d: Day) {
    const isToday = d.date === today
    if (d.status === "both" || d.status === "one") {
      const fill = <span style={{ display: "block", width: 12, height: 12, borderRadius: 6, background: "var(--ink)", opacity: d.status === "one" ? 0.4 : 1 }} />
      return isToday ? <span style={{ display: "block", padding: 2, borderRadius: 10, border: "2px solid var(--ink)" }}>{fill}</span> : fill
    }
    if (isToday) return <span style={{ display: "block", width: 12, height: 12, borderRadius: 6, border: "1.5px solid var(--ink)" }} />
    if (d.status === "paused") return <span style={{ display: "block", width: 12, height: 12, borderRadius: 6, border: "1.5px dashed var(--ink2)" }} />
    return <span style={{ display: "block", width: 4, height: 4, borderRadius: 2, background: "var(--line)" }} />
  }

  const label = (d: Day) => {
    const date = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d.date}T00:00:00Z`))
    return d.status === "both" ? `${date}: done` : d.status === "one" ? `${date}: one routine done` : d.status === "paused" ? `${date}: paused` : date
  }

  const navBtn: React.CSSProperties = { width: 44, height: 44, border: "none", background: "none", color: "var(--ink)", font: "inherit", fontSize: 20, cursor: "pointer" }

  return (
    <div>
      <Link href="/app/routine" style={{ fontSize: 15, color: "var(--ink2)", textDecoration: "none" }}>
        ← Routine
      </Link>
      <h1 style={{ margin: "12px 0 0", fontSize: "clamp(56px, 9vw, 72px)", fontWeight: 300, letterSpacing: "-0.05em", lineHeight: 1.05 }}>
        {current} {current === 1 ? "night" : "nights"}
      </h1>
      <p style={{ margin: "10px 0 0", fontSize: 17, lineHeight: 1.5, color: "var(--ink2)" }}>Miss a day and your streak pauses. Miss two in a row and it starts again.</p>
      {longest > current && <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--ink2)" }}>Longest: {longest}</p>}

      <div style={{ marginTop: 28, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="v3-label">{monthName}</span>
        <span>
          <button style={navBtn} aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
            ‹
          </button>
          <button style={{ ...navBtn, opacity: isCurrentMonth ? 0.25 : 1 }} aria-label="Next month" disabled={isCurrentMonth} onClick={() => setMonth(shiftMonth(month, 1))}>
            ›
          </button>
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", textAlign: "center", rowGap: 4 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
          <span key={i} style={{ fontSize: 12, color: "var(--ink2)", paddingBottom: 6 }}>
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {days.map((d) => (
          <span key={d.date} role="img" aria-label={label(d)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 0" }}>
            <span style={{ height: 20, display: "flex", alignItems: "center" }}>{dot(d)}</span>
            <span style={{ fontSize: 11, color: "var(--ink3)" }}>{Number(d.date.slice(8))}</span>
          </span>
        ))}
      </div>
      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13, color: "var(--ink2)" }}>
        {(
          [
            ["Done", { background: "var(--ink)" }],
            ["Part done", { background: "var(--ink)", opacity: 0.4 }],
            ["Paused", { border: "1.5px dashed var(--ink2)" }],
            ["Today", { border: "1.5px solid var(--ink)" }],
          ] as [string, React.CSSProperties][]
        ).map(([t, st]) => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, ...st }} />
            {t}
          </span>
        ))}
      </div>

      <div className="v3-label" style={{ marginTop: 28, marginBottom: 4 }}>
        Milestones
      </div>
      {MILESTONES.map((n) => {
        const reached = longest >= n
        return (
          <div key={n} style={{ minHeight: 56, display: "flex", alignItems: "baseline", gap: 14, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ width: 56, fontSize: 28, fontWeight: 300, color: reached ? "var(--ink)" : "var(--ink3)" }}>{n}</span>
            <span style={{ flex: 1, fontSize: 16 }}>{MS_NAME[n]}</span>
            <span style={{ fontSize: 14, color: "var(--ink2)" }}>{reached ? "Reached" : `${n - current} to go`}</span>
          </div>
        )
      })}
    </div>
  )
}
