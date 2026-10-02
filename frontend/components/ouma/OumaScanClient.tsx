"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { OumaAppTopBar } from "@/components/ouma/OumaAppShell"
import { getRecentScans, type RecentScanEntry } from "@/lib/api"
import { riskFromScore } from "@/lib/ouma-recent-scans"
import { useIsGuest } from "@/lib/use-guest"
import { getGuestScans } from "@/lib/guest-store"

const DEMO_INCI =
  "Aqua, Glycerin, Niacinamide, Dimethicone, Phenoxyethanol, Fragrance (Parfum), Carbomer, Sodium Hyaluronate, Methylparaben, Tocopherol, Retinol, Limonene, Linalool, Citric Acid"

type ScanMethod = "photo" | "paste"

type OumaScanClientProps = {
  resultBasePath?: string
  /** Defaults to resultBasePath with "/result" swapped for "/confirm". */
  confirmBasePath?: string
  catalogHref?: string
  showTopBar?: boolean
  topBarVariant?: "app" | "public"
  showRecentScans?: boolean
  showBarcodeTip?: boolean
  loginHref?: string
  /** Set when this is embedded inside another page (e.g. the landing page hero)
   *  that already has its own heading and back navigation. Hides the
   *  "← Home" link and the duplicate "What's on your skin?" heading. */
  embedded?: boolean
}

const VERDICT_PILL = {
  "HIGH RISK": { bg: "#F8E5E1", fg: "#8A2E22", label: "avoid", icon: "M3 3l6 6M9 3l-6 6" },
  CAUTION: { bg: "#F7EDD8", fg: "#7C5410", label: "caution", icon: "M6 1.2 11 10.8H1zM6 4.8v2.4M6 9.2v.01" },
  SAFE: { bg: "#DFF0E4", fg: "#1D5C3B", label: "fine", icon: "M2 6.5l2.5 2.5L10 3.5" },
} as const

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return "today"
  if (days === 1) return "1d"
  return `${days}d`
}

export function OumaScanClient({
  resultBasePath = "/app/scan/result",
  confirmBasePath,
  showTopBar = true,
  topBarVariant = "app",
  showRecentScans = true,
  loginHref = "/login",
  embedded = false,
}: OumaScanClientProps) {
  const confirmPath = confirmBasePath ?? resultBasePath.replace(/\/result$/, "/confirm")
  const [tab, setTab] = useState<ScanMethod>("photo")
  const [inci, setInci] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [recents, setRecents] = useState<RecentScanEntry[] | null>(null)
  const isGuest = useIsGuest()

  useEffect(() => {
    if (!showRecentScans) return
    if (isGuest) {
      setRecents(
        getGuestScans().map((s) => ({
          id: s.id,
          productId: s.productId ?? null,
          rawIngredientText: s.rawIngredientText ?? null,
          name: s.title,
          brand: s.brand || null,
          score: s.score,
          scannedAt: s.savedAt,
        })),
      )
      return
    }
    getRecentScans()
      .then(setRecents)
      .catch(() => setRecents([]))
  }, [showRecentScans, isGuest])

  const parsedChips = inci
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        paddingBottom: 110,
        minHeight: "100%",
        background: "#F3F5EF",
      }}
    >
      {/* Top bar */}
      {showTopBar &&
        (topBarVariant === "app" ? (
          <OumaAppTopBar title="Scan" showBell />
        ) : (
          <header style={{ padding: "0 24px 0", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" className="no-underline" style={{ display: "flex", alignItems: "center", gap: 8 }} aria-label="SkinLens home">
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#17211A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="ouma-display" style={{ fontSize: 16, color: "#F3F5EF", fontStyle: "italic" }}>S</span>
              </div>
              <span className="ouma-display" style={{ fontSize: 18, color: "#17211A", fontStyle: "italic" }}>SkinLens</span>
            </Link>
            <Link href={loginHref} className="no-underline" style={{ padding: "10px 18px", background: "#17211A", color: "#F3F5EF", borderRadius: 99, fontSize: 15, fontWeight: 600 }}>
              Log in
            </Link>
          </header>
        ))}

      <div style={{ padding: "0 24px" }}>
        {!embedded && (
          <>
            {/* Back to home */}
            <Link
              href="/app/routine"
              className="no-underline"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#5A6259", marginBottom: 14 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Home
            </Link>

            {/* Headline */}
            <h1
              className="ouma-display"
              style={{ fontSize: 36, lineHeight: 1.05, margin: "14px 0 6px", color: "#17211A" }}
            >
              What&apos;s on your skin?
            </h1>
            <p style={{ fontSize: 15, color: "#2A342C", lineHeight: 1.5, margin: 0 }}>
              Paste any ingredient list, or snap a photo.
            </p>
          </>
        )}

        {/* Tabs — segmented control, matches Products screen's AM/PM track */}
        <div style={{ display: "flex", marginTop: embedded ? 0 : 20, background: "#E4EBE2", borderRadius: 12, padding: 4 }}>
          {([
            { id: "photo" as const, label: "PHOTO" },
            { id: "paste" as const, label: "PASTE" },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="ouma-display"
              style={{
                flex: 1,
                textAlign: "center",
                padding: 10,
                borderRadius: 9,
                fontSize: 13,
                letterSpacing: "0.1em",
                border: "none",
                cursor: "pointer",
                background: tab === t.id ? "#fff" : "transparent",
                color: tab === t.id ? "#17211A" : "#5A6259",
                boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Photo tab ─────────────────────────────────────────── */}
        {tab === "photo" && (
          <>
            <div
              style={{
                marginTop: 12,
                background: "#141A16",
                borderRadius: 16,
                height: 280,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "absolute", top: 32, left: 26, right: 26, bottom: 74, border: "1.5px dashed rgba(255,255,255,.55)", borderRadius: 10 }} />
              <div style={{ position: "absolute", top: "44%", left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,.85)", fontSize: 13 }}>
                Fit the ingredient list in the box
              </div>
              <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => { setTab("paste"); setTimeout(() => textareaRef.current?.focus(), 100) }}
                  style={{
                    width: 58, height: 58, borderRadius: 29,
                    border: "3px solid #fff",
                    background: "rgba(255,255,255,.25)",
                    cursor: "pointer",
                  }}
                  aria-label="Capture"
                />
              </div>
            </div>
            <p style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#5A6259" }}>
              Works offline — we&apos;ll queue the analysis if signal is bad.
            </p>
          </>
        )}

        {/* ── Paste tab ─────────────────────────────────────────── */}
        {tab === "paste" && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                background: "#FFFFFF", border: "1px solid #DDE3DA", borderRadius: 16,
                padding: 16, minHeight: 180, fontSize: 16, lineHeight: 1.5, color: "#2A342C",
                position: "relative",
              }}
            >
              <textarea
                ref={textareaRef}
                value={inci}
                onChange={(e) => setInci(e.target.value)}
                placeholder="Aqua, Niacinamide, Glycerin, Phenoxyethanol, Fragrance…"
                rows={6}
                style={{
                  width: "100%", resize: "none", background: "transparent",
                  border: "none", outline: "none", fontSize: 16, lineHeight: 1.5,
                  color: "#17211A", fontFamily: "var(--font-ouma-body, 'Instrument Sans', sans-serif)",
                }}
                spellCheck={false}
                aria-label="Ingredient list"
              />
              {!inci && (
                <span
                  style={{
                    display: "inline-block", width: 1.5, height: 14,
                    background: "#17211A", marginLeft: 1, verticalAlign: -2,
                    animation: "kb-blink 1s step-start infinite",
                  }}
                />
              )}
            </div>

            {!inci && (
              <button
                type="button"
                onClick={() => setInci(DEMO_INCI)}
                style={{
                  marginTop: 8, fontSize: 14, color: "#5A6259",
                  background: "none", border: "none", cursor: "pointer",
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}
              >
                Use a sample ingredient list →
              </button>
            )}

            {parsedChips.length > 0 && (
              <>
                <p className="ouma-mono" style={{ marginTop: 14, fontSize: 12, color: "#5A6259" }}>
                  We read {parsedChips.length} ingredient{parsedChips.length === 1 ? "" : "s"}
                </p>
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {parsedChips.map((c, i) => (
                    <span key={i} style={{ padding: "6px 11px", borderRadius: 8, background: "#fff", border: "1px solid rgba(23,33,26,.12)", fontSize: 12.5 }}>
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}

            <Link
              href={inci.trim() ? `${confirmPath}?inci=${encodeURIComponent(inci)}` : "#"}
              aria-disabled={!inci.trim()}
              className="no-underline"
              style={{
                display: "flex", width: "100%", marginTop: 14, padding: "16px 0", borderRadius: 99,
                border: "none", background: "#17211A", color: "#F3F5EF",
                alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 500, opacity: inci.trim() ? 1 : 0.4,
                pointerEvents: inci.trim() ? "auto" : "none",
              }}
            >
              {`Analyse ${parsedChips.length} ingredient${parsedChips.length === 1 ? "" : "s"}`}
            </Link>
          </div>
        )}

        {/* ── Recent scans ──────────────────────────────────────── */}
        {showRecentScans && recents && recents.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6259" }}>
              Recent scans
            </p>
            <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 8 }}>
              {recents.map((r) => {
                const risk = r.score != null ? riskFromScore(r.score) : null
                const pill = risk ? VERDICT_PILL[risk] : null
                const href = r.productId
                  ? `${resultBasePath}?productId=${r.productId}`
                  : r.rawIngredientText
                  ? `${resultBasePath}?inci=${encodeURIComponent(r.rawIngredientText)}`
                  : null
                const rowStyle: CSSProperties = {
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#fff", borderRadius: 12, padding: "12px 14px",
                  border: "1px solid rgba(23,33,26,.07)",
                  opacity: href ? 1 : 0.6,
                }
                const rowContent = (
                  <>
                    <span style={{ fontSize: 14, fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#17211A" }}>
                      {r.name}
                    </span>
                    {pill && (
                      <span
                        style={{
                          marginLeft: "auto", flex: "none", display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                          background: pill.bg, color: pill.fg,
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 12 12">
                          <path d={pill.icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {pill.label}
                      </span>
                    )}
                    <span className="ouma-mono" style={{ flex: "none", fontSize: 11, color: "#5A6259" }}>
                      {relativeDate(r.scannedAt)}
                    </span>
                  </>
                )
                return href ? (
                  <Link key={r.id} href={href} className="no-underline" style={rowStyle}>
                    {rowContent}
                  </Link>
                ) : (
                  <div key={r.id} style={rowStyle}>
                    {rowContent}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes kb-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
