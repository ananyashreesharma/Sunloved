"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { AppChromeProvider, useAppChrome } from "@/lib/app-chrome-context"
import { GuestReminderBanner } from "@/components/ouma/GuestGate"

/** The prototype's streak/leaf glyph, used everywhere a 🔥 emoji used to stand in. */
export function StreakLeafIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * (14 / 12)} viewBox="0 0 12 14">
      <path
        d="M6 1C7.5 3.2 10 4.8 10 8a4 4 0 11-8 0c0-1.6.7-2.7 1.6-3.9C4.4 3 5.4 2 6 1z"
        fill={color}
      />
    </svg>
  )
}

const SIDE_ICONS: Record<string, ReactNode> = {
  "/app/routine": (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 5h9M4 10h12M4 15h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "/app/profile": (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 16.5c1.2-2.8 3.4-4 6-4s4.8 1.2 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

const ROUTINE_ICON = SIDE_ICONS["/app/routine"]
const ME_ICON = SIDE_ICONS["/app/profile"]
const SCAN_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M4 8h3l2-2.5h6L17 8h3v10H4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)

// Desktop sidebar has room for the non-prototype "Learn" (Discover) destination too.
const SIDE_TABS = [
  { href: "/app/routine", label: "Routine" },
  { href: "/app/scan", label: "Scan" },
  { href: "/app/discover", label: "Learn" },
  { href: "/app/profile", label: "Me" },
]

function pathActive(pathname: string | null, href: string) {
  if (href === "/app/routine") {
    return pathname === "/app" || pathname === "/app/home" || pathname === "/app/routine" || (pathname?.startsWith("/app/routine/") ?? false)
  }
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false)
}

export function OumaAppShell({ children }: { children: ReactNode }) {
  return (
    <AppChromeProvider>
      <OumaAppShellInner>{children}</OumaAppShellInner>
    </AppChromeProvider>
  )
}

function OumaAppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { night } = useAppChrome()

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row" style={{ background: "#F3F5EF" }}>
      {/* ─── Desktop sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden w-56 shrink-0 md:flex md:flex-col"
        style={{ borderRight: "1px solid #DDE3DA", background: "#FFFFFF" }}
      >
        <div className="sticky top-0 flex flex-col gap-1 p-5 pt-7">
          {/* Logo */}
          <Link
            href="/app/routine"
            className="mb-6 flex items-center gap-2 px-2 no-underline"
            aria-label="SkinLens home"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "#1E4D3A" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ouma-mono, monospace)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                SL
              </span>
            </div>
            <span
              className="ouma-mono text-lg"
              style={{ color: "#17211A", fontWeight: 700, letterSpacing: "0.1em" }}
            >
              SKINLENS
            </span>
          </Link>

          {SIDE_TABS.map(({ href, label }) => {
            const active = pathActive(pathname, href)
            const isScan = href === "/app/scan"
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-all"
                style={{
                  background: isScan
                    ? "#1E4D3A"
                    : active
                    ? "#E4EBE2"
                    : "transparent",
                  color: isScan ? "#fff" : active ? "#17211A" : "#5A6259",
                  fontWeight: active || isScan ? 600 : 500,
                }}
              >
                {label}
              </Link>
            )
          })}

          {/* Streak in sidebar */}
          <div className="mt-auto pt-8">
            <Link
              href="/app/routine/history"
              className="block rounded-2xl px-4 py-3 no-underline"
              style={{ background: "#1E4D3A", color: "#fff" }}
            >
              <p
                className="ouma-mono"
                style={{ fontSize: 9, letterSpacing: 2, opacity: 0.7, marginBottom: 2 }}
              >
                STREAK
              </p>
              <p style={{ marginTop: 4 }}>
                <StreakLeafIcon size={28} color="#fff" />
              </p>
            </Link>
          </div>
        </div>
      </aside>

      {/* ─── Main content ────────────────────────────────────────────── */}
      <div
        className="flex min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        <div className="flex-1 px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-lg">
            <GuestReminderBanner />
          </div>
          {children}
        </div>
      </div>

      {/* ─── Mobile bottom nav (3 tabs: Routine / Scan FAB / Me) ──────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(243,245,239,0.96) 28%)",
        }}
        aria-label="Main navigation"
      >
        <div
          className="mx-auto flex max-w-sm items-center justify-around rounded-full p-2"
          style={{
            background: night ? "#10160F" : "#17211A",
            boxShadow: "0 10px 30px rgba(23,33,26,0.28)",
          }}
        >
          {(() => {
            const routineActive = pathActive(pathname, "/app/routine")
            const meActive = pathActive(pathname, "/app/profile")
            return (
              <>
                <Link
                  href="/app/routine"
                  aria-label="Routine"
                  aria-current={routineActive ? "page" : undefined}
                  className="flex flex-1 flex-col items-center gap-1 rounded-full py-3 no-underline transition-all"
                  style={{
                    background: routineActive ? "#F3F5EF" : "transparent",
                    color: routineActive ? "#17211A" : "rgba(243,245,239,0.5)",
                  }}
                >
                  {ROUTINE_ICON}
                  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.2 }}>Routine</span>
                </Link>

                {/* Scan FAB — floats above the pill, ring matches the page bg behind it */}
                <Link
                  href="/app/scan"
                  aria-label="Scan"
                  className="flex flex-1 flex-col items-center gap-1 no-underline"
                >
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 54,
                      height: 54,
                      marginTop: -34,
                      background: "#1E4D3A",
                      border: `4px solid ${night ? "#0E1411" : "#F3F5EF"}`,
                      boxShadow: "0 4px 12px rgba(30,77,58,.35)",
                      color: "#fff",
                    }}
                  >
                    {SCAN_ICON}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.2, color: "rgba(243,245,239,0.5)" }}>Scan</span>
                </Link>

                <Link
                  href="/app/profile"
                  aria-label="Me"
                  aria-current={meActive ? "page" : undefined}
                  className="flex flex-1 flex-col items-center gap-1 rounded-full py-3 no-underline transition-all"
                  style={{
                    background: meActive ? "#F3F5EF" : "transparent",
                    color: meActive ? "#17211A" : "rgba(243,245,239,0.5)",
                  }}
                >
                  {ME_ICON}
                  <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.2 }}>Me</span>
                </Link>
              </>
            )
          })()}
        </div>
      </nav>
    </div>
  )
}

export function OumaAppTopBar({
  title,
  showBell,
  showStreak,
}: {
  title: string
  showBell?: boolean
  showStreak?: boolean
}) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/app/routine" className="flex items-center gap-1.5 no-underline md:hidden" aria-label="Routine">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "#1E4D3A" }}
          >
            <span
              style={{
                fontFamily: "var(--font-ouma-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              SL
            </span>
          </div>
        </Link>
        <span
          className="ouma-display text-3xl"
          style={{ color: "#17211A", fontWeight: 600, textTransform: "uppercase" }}
        >
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {showStreak && (
          <Link
            href="/app/routine/history"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 no-underline"
            style={{ background: "#1E4D3A", color: "#fff" }}
          >
            <StreakLeafIcon size={10} color="#fff" />
          </Link>
        )}
        {showBell && (
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full transition"
            style={{ border: "1px solid #DDE3DA", background: "#FFFFFF", color: "#17211A" }}
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1a5 5 0 015 5v2.5l1 1.5H2L3 8.5V6a5 5 0 015-5zM6.5 13a1.5 1.5 0 003 0"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
