"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getStreak, getStreakHistory, type StreakHistoryDay } from "@/lib/api"
import { StreakLeafIcon } from "@/components/ouma/OumaAppShell"
import { useIsGuest } from "@/lib/use-guest"
import { getGuestStreak, getGuestStreakHistory } from "@/lib/guest-store"

const INK = "#17211A"
const MUTE = "#5A6259"
const LINE = "rgba(23,33,26,.07)"

const STATUS_STYLE: Record<StreakHistoryDay["status"], { bg: string; fg: string; border: string }> = {
  both: { bg: "#1D5C3B", fg: "#fff", border: "1px solid transparent" },
  one: { bg: "rgba(29,92,59,.35)", fg: "#fff", border: "1px solid transparent" },
  paused: { bg: "#E4EBE2", fg: "#5A6259", border: "1px solid transparent" },
  future: { bg: "transparent", fg: "#AAB4AB", border: "1px dashed rgba(23,33,26,.15)" },
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function OumaStreakHistoryClient() {
  const isGuest = useIsGuest()
  const [month, setMonth] = useState(currentMonth())
  const [days, setDays] = useState<StreakHistoryDay[]>([])
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number; totalDaysCompleted: number } | null>(null)

  useEffect(() => {
    if (isGuest) {
      setStreak(getGuestStreak())
      return
    }
    getStreak().then(setStreak).catch(() => setStreak(null))
  }, [isGuest])

  useEffect(() => {
    if (isGuest) {
      setDays(getGuestStreakHistory(month).days)
      return
    }
    getStreakHistory(month)
      .then((r) => setDays(r.days))
      .catch(() => setDays([]))
  }, [month, isGuest])

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number)
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    setMonth(d.toISOString().slice(0, 7))
  }

  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })
  const firstWeekday = new Date(`${month}-01T00:00:00Z`).getUTCDay()

  return (
    <div className="mx-auto w-full max-w-lg pb-6" style={{ color: INK }}>
      <Link href="/app/routine" className="no-underline" style={{ fontSize: 13, color: MUTE }}>
        ← Routine
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
        <StreakLeafIcon size={20} color="#1E4D3A" />
        <span className="ouma-mono" style={{ fontSize: 34, fontWeight: 600 }}>
          {streak?.currentStreak ?? "–"}
        </span>
        <span style={{ fontSize: 14, color: MUTE }}>nights in a row</span>
      </div>
      <p style={{ marginTop: 6, fontSize: 13, color: MUTE }}>
        Longest: <span className="ouma-mono">{streak?.longestStreak ?? "–"}</span> · Total logged:{" "}
        <span className="ouma-mono">{streak?.totalDaysCompleted ?? "–"}</span>
      </p>

      <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <button type="button" onClick={() => shiftMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: MUTE }}>
          ← prev
        </button>
        <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
          {monthLabel}
        </p>
        <button type="button" onClick={() => shiftMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: MUTE }}>
          next →
        </button>
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const s = STATUS_STYLE[d.status]
          const dayNum = Number(d.date.slice(-2))
          return (
            <div
              key={d.date}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                background: s.bg,
                border: s.border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: s.fg,
              }}
              className="ouma-mono"
            >
              {dayNum}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 14, fontSize: 11, color: MUTE, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#1D5C3B" }} />
          both done
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(29,92,59,.35)" }} />
          one done
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#E4EBE2" }} />
          paused
        </span>
      </div>

      <div style={{ marginTop: 18, background: "#FFFFFF", borderRadius: 12, border: `1px solid ${LINE}`, padding: "14px 16px", fontSize: 13, color: "#2A342C", lineHeight: 1.5 }}>
        Streak paused, not broken. A missed night doesn&apos;t erase it — skin doesn&apos;t punish one missed day, neither do we.
      </div>
    </div>
  )
}
