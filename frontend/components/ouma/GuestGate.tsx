"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { CSSProperties } from "react"
import { useIsGuest } from "@/lib/use-guest"

/** Inline swap-in for a save/submit action a guest can't do yet — links to login, doesn't redirect on its own. */
export function GuestActionPrompt({
  label,
  next,
  style,
}: {
  label: string
  next?: string
  style?: CSSProperties
}) {
  return (
    <Link
      href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
      className="no-underline"
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 15,
        borderRadius: 12,
        border: "1.5px dashed rgba(23,33,26,.3)",
        color: "#5A6259",
        fontSize: 14,
        fontWeight: 600,
        textAlign: "center",
        ...style,
      }}
    >
      {label} →
    </Link>
  )
}

/** Full-card "sign in to unlock this" state for screens that are entirely user-data-driven (Routine, Products, Me). */
export function GuestLocked({
  title,
  body,
  next,
}: {
  title: string
  body: string
  next?: string
}) {
  return (
    <div
      style={{
        marginTop: 40,
        textAlign: "center",
        padding: "32px 24px",
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(23,33,26,.07)",
      }}
    >
      <p className="ouma-display" style={{ fontSize: 20, textTransform: "uppercase", color: "#17211A" }}>
        {title}
      </p>
      <p style={{ marginTop: 8, fontSize: 14, color: "#5A6259", lineHeight: 1.5 }}>{body}</p>
      <Link
        href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        className="no-underline"
        style={{
          marginTop: 18,
          display: "inline-block",
          padding: "13px 24px",
          borderRadius: 999,
          background: "#1E4D3A",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Sign in / create account
      </Link>
    </div>
  )
}

/** Persistent reminder shown across /app while browsing as a guest — everything works, nothing is saved yet. */
export function GuestReminderBanner() {
  const isGuest = useIsGuest()
  const pathname = usePathname()
  if (!isGuest) return null
  return (
    <div
      style={{
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        background: "#F7EDD8",
        border: "1px solid rgba(124,84,16,.18)",
        borderRadius: 12,
        padding: "10px 14px",
      }}
    >
      <span style={{ fontSize: 12.5, color: "#7C5410", lineHeight: 1.4 }}>
        Browsing as a guest — everything here works, but it only lives on this device until you sign in.
      </span>
      <Link
        href={`/login?next=${encodeURIComponent(pathname || "/app")}`}
        className="no-underline"
        style={{ flex: "none", fontSize: 12.5, fontWeight: 700, color: "#7C5410", whiteSpace: "nowrap" }}
      >
        Sign in →
      </Link>
    </div>
  )
}
