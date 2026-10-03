"use client"

// V3 web app frame: a quiet top bar on wide screens, bottom tabs on phones (Routine, Check, Me),
// like the mobile app. The Routine screen's Night tab turns the whole frame dark (useAppChrome).

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { AppChromeProvider, useAppChrome } from "@/lib/app-chrome-context"

function MoonIcon() {
  // A crescent: a disc with an offset disc cut out of it.
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <mask id="v3-crescent">
          <rect width="24" height="24" fill="white" />
          <circle cx="16" cy="9" r="8" fill="black" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="9" fill="currentColor" mask="url(#v3-crescent)" />
    </svg>
  )
}
function LensIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function MeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 20v-7a7 7 0 0114 0v7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

const TABS = [
  { href: "/app/routine", label: "Routine", icon: <MoonIcon />, match: (p: string) => p === "/app" || p.startsWith("/app/routine") || p === "/app/home" },
  { href: "/", label: "Check", icon: <LensIcon />, match: (p: string) => p.startsWith("/app/scan") },
  { href: "/app/profile", label: "Me", icon: <MeIcon />, match: (p: string) => p.startsWith("/app/profile") || p.startsWith("/app/products") || p.startsWith("/app/notifications") },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppChromeProvider>
      <Frame>{children}</Frame>
    </AppChromeProvider>
  )
}

function Frame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ""
  const { night } = useAppChrome()
  // No colour transition on the first paint, so opening the routine at night doesn't fade in from day.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSettled(true), 50)
    return () => clearTimeout(id)
  }, [])
  return (
    <div
      className="v3 v3-app"
      data-night={night ? "true" : "false"}
      style={{ transition: settled ? "background-color 600ms var(--standard), color 600ms var(--standard)" : "none" }}
    >
      <header className="v3-app-top">
        <Link href="/app/routine" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, textDecoration: "none" }}>
          <span aria-hidden style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid var(--ink)" }} />
          SkinLens
        </Link>
        <nav aria-label="Main" style={{ display: "flex", gap: 28, fontSize: 15 }}>
          {TABS.map((t) => {
            const on = t.match(pathname)
            return (
              <Link
                key={t.label}
                href={t.href}
                aria-current={on ? "page" : undefined}
                style={{ textDecoration: "none", padding: "6px 0", ...(on ? { fontWeight: 600, boxShadow: "inset 0 -2px 0 var(--ink)" } : { color: "var(--ink2)" }) }}
              >
                {t.label === "Check" ? "Check a label" : t.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="v3-app-main">{children}</main>
      <nav aria-label="Main" className="v3-app-tabs">
        {TABS.map((t) => {
          const on = t.match(pathname)
          return (
            <Link
              key={t.label}
              href={t.href}
              aria-current={on ? "page" : undefined}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", fontSize: 12, fontWeight: on ? 600 : 400, color: on ? "var(--ink)" : "var(--ink3)", minHeight: 48 }}
            >
              {t.icon}
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
