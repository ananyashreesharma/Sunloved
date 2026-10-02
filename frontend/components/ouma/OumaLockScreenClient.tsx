"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const TONE_GREETINGS = {
  morning: {
    Gentle: "Good morning, sunshine. Five minutes for your skin today. You've earned it.",
    Bold: "Your skin didn't come this far to be treated with trash ingredients. Let's go.",
    Spiritual: "The morning is yours. Begin it with intention. Begin it with care.",
    Playful: "Rise and glow. Your pores are ready. Are you?",
  },
  night: {
    Gentle: "Your skin repairs itself while you sleep. Give it what it needs tonight.",
    Bold: "You're not an overthinker. You're emotionally intelligent. Now go wash your face.",
    Spiritual: "Release the day. Let your skin breathe, rest, renew.",
    Playful: "Skincare o'clock. Your SPF worked hard all day. Time to clock out.",
  },
}

type Tone = keyof typeof TONE_GREETINGS.morning

function getTimeString() {
  const now = new Date()
  const h = now.getHours() % 12 || 12
  const m = now.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

function getDateString() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).toUpperCase()
}

function getTimeOfDay(): "morning" | "night" {
  return new Date().getHours() < 17 ? "morning" : "night"
}

export function OumaLockScreenClient() {
  const [tone, setTone] = useState<Tone>("Gentle")
  const [timeStr, setTimeStr] = useState(getTimeString())
  const tod = getTimeOfDay()

  // Read tone from localStorage (set during onboarding)
  useEffect(() => {
    const saved = localStorage.getItem("kb_tone") as Tone | null
    if (saved && saved in TONE_GREETINGS.morning) setTone(saved)
    // Tick every minute
    const interval = setInterval(() => setTimeStr(getTimeString()), 10000)
    return () => clearInterval(interval)
  }, [])

  const msg = TONE_GREETINGS[tod][tone]

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, #2a1f18 0%, #0e0a07 100%)",
      }}
    >
      {/* moody bloom */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "-30%",
          width: "160%",
          height: 400,
          background: "radial-gradient(ellipse at center, rgba(244,217,178,0.12) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* back button */}
      <Link
        href="/app/profile"
        className="no-underline"
        style={{
          position: "absolute",
          top: 52,
          left: 20,
          width: 36,
          height: 36,
          borderRadius: 99,
          background: "rgba(255,255,255,0.1)",
          border: "0.5px solid rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {/* time */}
      <div style={{ paddingTop: 90, textAlign: "center", color: "#fff" }}>
        <p
          className="ouma-mono"
          style={{ fontSize: 11, letterSpacing: 2, opacity: 0.5 }}
        >
          {getDateString()}
        </p>
        <p
          className="ouma-display"
          style={{ fontSize: 96, lineHeight: 1, marginTop: 4, fontWeight: 300, letterSpacing: -2, color: "#fff" }}
        >
          {timeStr}
        </p>
      </div>

      {/* notification card */}
      <div
        style={{
          position: "absolute",
          bottom: 130,
          left: 14,
          right: 14,
          background: "rgba(255,255,255,0.14)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderRadius: 22,
          padding: 16,
          border: "0.5px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* app icon + name + timestamp */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "#F3F5EF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-ouma-display, 'Archivo Narrow', sans-serif)",
              fontSize: 14,
              color: "#17211A",
              fontStyle: "italic",
            }}
          >
            K
          </div>
          <span
            className="ouma-mono"
            style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", letterSpacing: 0.5 }}
          >
            KNOW BETTER
          </span>
          <span
            style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}
          >
            now
          </span>
        </div>

        {/* tone message */}
        <p
          className="ouma-display"
          style={{ fontSize: 18, lineHeight: 1.3, color: "#fff", fontStyle: "italic" }}
        >
          {msg}
        </p>

        {/* metadata */}
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
          Day 23 · {tod === "morning" ? "Morning" : "Evening"} ritual
        </p>
      </div>

      {/* tone switcher (web-only affordance — not in prototype but needed to preview tones) */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {(Object.keys(TONE_GREETINGS.morning) as Tone[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            style={{
              padding: "6px 12px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 500,
              background: tone === t ? "rgba(243,245,239,0.9)" : "rgba(243,245,239,0.1)",
              color: tone === t ? "#17211A" : "rgba(243,245,239,0.6)",
              border: "0.5px solid rgba(243,245,239,0.2)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
