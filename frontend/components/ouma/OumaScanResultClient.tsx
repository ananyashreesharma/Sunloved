"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { analyzeIngredients, getProduct, saveScan, reportUnknownIngredient, getMe, createRoutineStep, type MeResponse } from "@/lib/api"
import { useIsGuest } from "@/lib/use-guest"
import { saveGuestScan, addGuestStep } from "@/lib/guest-store"
import { breakdownFromAnalyze, breakdownFromProduct, type IngredientBreakdown } from "@/lib/ouma-ingredient-ui"
import { pushRecentScan, riskFromScore } from "@/lib/ouma-recent-scans"
import { usePathname } from "next/navigation"

/** Below this fraction of ingredients read, we refuse to render a verdict at all (see Refusal below). */
const COVERAGE_THRESHOLD = 0.7

type Props = {
  productId?: string | null
  inci?: string | null
}

type Zone = "RED" | "YELLOW" | "GREEN"
type IngredientRow = { name: string; zone: Zone; note: string }

function zoneFromAny(z?: string | null): Zone {
  const v = (z || "").toLowerCase()
  if (v === "red" || v === "avoid") return "RED"
  if (v === "yellow" || v === "caution") return "YELLOW"
  return "GREEN"
}

const VERDICTS = {
  RED: {
    word: "Avoid.",
    sub: "We found ingredients we wouldn't put on our own skin.",
    hex: "#8A2E22",
    soft: "#F8E5E1",
    bloom: "rgba(138,46,34,0.4)",
    badge: "RED",
  },
  YELLOW: {
    word: "Use with care.",
    sub: "Mostly fine, but a few flags worth knowing about.",
    hex: "#7C5410",
    soft: "#F7EDD8",
    bloom: "rgba(124,84,16,0.35)",
    badge: "YELLOW",
  },
  GREEN: {
    word: "Skin-safe.",
    sub: "Clean ingredients. We'd happily put this on our face.",
    hex: "#1D5C3B",
    soft: "#DFF0E4",
    bloom: "rgba(29,92,59,0.3)",
    badge: "GREEN",
  },
}

const STRIP_HEX: Record<Zone | "NONE", string> = { RED: "#8A2E22", YELLOW: "#7C5410", GREEN: "#1D5C3B", NONE: "#AAB4AB" }

const CAPS_LABEL: Record<Zone, string> = {
  RED: "AVOID FOR YOU",
  YELLOW: "USE WITH CAUTION",
  GREEN: "LOOKS FINE FOR YOU",
}

function buildInShort(leadName: string | undefined, flagged: IngredientRow[], verdictKey: Zone, skinLabel: string | null) {
  const lead = leadName ? `Built around ${leadName.toLowerCase()}` : "A short ingredient list"
  if (flagged.length === 0) {
    return `${lead}, with nothing flagged in our reference${skinLabel ? ` for ${skinLabel}` : ""}. Generally fine to use.`
  }
  const top = flagged[0]
  const advice = verdictKey === "RED" ? "Worth avoiding, or patch-test heavily first." : "Fine to try; patch-test first."
  return `${lead}. The catch${skinLabel ? ` for ${skinLabel}` : ""}: ${top.name} is on the label — ${top.note} ${advice}`
}

export function OumaScanResultClient({ productId, inci }: Props) {
  const pathname = usePathname()
  const backHref = pathname?.startsWith("/scan") ? "/scan" : "/app/scan"

  const [phase, setPhase] = useState<"analyzing" | "reveal">("analyzing")
  const [err, setErr] = useState<string | null>(null)
  const [title, setTitle] = useState("Ingredient analysis")
  const [brand, setBrand] = useState("")
  const [bd, setBd] = useState<IngredientBreakdown>({ high: 0, med: 0, safe: 0, score: 0, warnings: [] })
  const [rows, setRows] = useState<IngredientRow[]>([])
  const [coverage, setCoverage] = useState(1)
  const [readCount, setReadCount] = useState(0)
  const [parsedCount, setParsedCount] = useState(0)
  const [rawText, setRawText] = useState("")
  const [unknownNames, setUnknownNames] = useState<string[]>([])
  const [reported, setReported] = useState<Set<string>>(new Set())
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const [addToRoutineState, setAddToRoutineState] = useState<"idle" | "saving" | "saved">("idle")
  const [me, setMe] = useState<MeResponse | null>(null)

  const isApp = !pathname?.startsWith("/scan")
  const isGuest = useIsGuest()

  useEffect(() => {
    if (!isApp || isGuest) return
    getMe().then(setMe).catch(() => setMe(null))
  }, [isApp, isGuest])

  const riskKey = riskFromScore(bd.score)
  const verdict =
    riskKey === "HIGH RISK" ? VERDICTS.RED : riskKey === "CAUTION" ? VERDICTS.YELLOW : VERDICTS.GREEN
  const verdictKey: Zone = riskKey === "HIGH RISK" ? "RED" : riskKey === "CAUTION" ? "YELLOW" : "GREEN"

  useEffect(() => {
    const pid = productId?.trim()
    const inc = inci?.trim()
    if (!pid && !inc) {
      setTimeout(() => setPhase("reveal"), 1100)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        if (pid) {
          const p = await getProduct(pid)
          if (cancelled) return
          const b = breakdownFromProduct(p)
          setTitle(p.name)
          setBrand(p.brand)
          setBd(b)
          const nextRows: IngredientRow[] = (p.ingredientRows || []).map((r) => ({
            name: r.displayName?.trim() || r.inciName,
            zone: zoneFromAny(r.zone || r.safetyRating || null),
            note: r.shortDescription ||
              (r.isParaben ? "Paraben — consider avoiding for daily leave-on use."
                : r.isFragrance ? "Fragrance — can trigger irritation for sensitive skin."
                : "In our ingredient reference."),
          }))
          setRows(nextRows)
          pushRecentScan({ productId: p.id, name: p.name, brand: p.brand, at: new Date().toISOString(), riskLabel: riskFromScore(b.score) })
        } else if (inc) {
          const api = await analyzeIngredients(inc)
          if (cancelled) return
          const b = breakdownFromAnalyze(api)
          setTitle("Ingredient analysis")
          setBrand("From your ingredient list")
          setBd(b)
          setCoverage(api.coverage)
          setReadCount(api.foundIngredients.length)
          setParsedCount(api.parsed.length)
          setRawText(inc)
          setUnknownNames(api.unknownIngredients)
          const nextRows: IngredientRow[] = [
            ...api.foundIngredients.map((fi) => ({
              name: fi.name,
              zone: fi.zone ? zoneFromAny(fi.zone) : fi.safetyRating === "avoid" ? "RED" as Zone : fi.safetyRating === "caution" ? "YELLOW" as Zone : "GREEN" as Zone,
              note: fi.shortDescription || fi.function || "In our ingredient reference.",
            })),
            ...api.unknownIngredients.map((u) => ({ name: u, zone: "YELLOW" as Zone, note: "Not yet in our database — verify on the product pack." })),
          ]
          setRows(nextRows)
          pushRecentScan({ inci: inc, name: "INCI analysis", at: new Date().toISOString(), riskLabel: riskFromScore(b.score) })
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Analysis failed.")
      } finally {
        if (!cancelled) setTimeout(() => setPhase("reveal"), 600)
      }
    })()

    return () => { cancelled = true }
  }, [productId, inci])

  // ── ANALYZING PHASE ────────────────────────────────────────────────────────
  if (phase === "analyzing") {
    return (
      <div
        style={{
          minHeight: "100dvh", background: "#17211A", color: "#F3F5EF",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 40, textAlign: "center",
        }}
      >
        {/* spinner */}
        <div
          style={{
            width: 72, height: 72, borderRadius: 99,
            border: "1px solid rgba(243,245,239,0.2)",
            borderTopColor: "#F3F5EF",
            animation: "kb-spin 1.4s linear infinite",
          }}
        />
        <p className="ouma-display" style={{ fontSize: 26, lineHeight: 1.2, marginTop: 30, fontStyle: "italic" }}>
          Reading every ingredient.
        </p>
        <p className="ouma-mono" style={{ fontSize: 11, letterSpacing: 1.6, opacity: 0.5, marginTop: 12 }}>
          {rows.length > 0 ? `${rows.length} OF ${rows.length} · 100%` : "SCANNING…"}
        </p>
        <style>{`@keyframes kb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── REFUSAL: too few ingredients read to responsibly show a verdict ────────
  if (coverage < COVERAGE_THRESHOLD) {
    const totalCount = parsedCount
    const pct = Math.round(coverage * 100)
    return (
      <div style={{ minHeight: "100dvh", background: "#F3F5EF", padding: "18px 24px 16px" }}>
        <Link href={backHref} className="no-underline" style={{ fontSize: 13, color: "#5A6259" }}>
          ← Scan
        </Link>
        {brand && (
          <p className="ouma-mono" style={{ marginTop: 12, fontSize: 13, color: "#5A6259" }}>
            {brand}
          </p>
        )}
        <h1 className="ouma-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2, textTransform: "uppercase", color: "#17211A" }}>
          We can&apos;t judge this one yet
        </h1>

        <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: "1px solid rgba(23,33,26,.07)", padding: 18 }}>
          <div style={{ display: "flex", gap: 2, height: 26, borderRadius: 6, overflow: "hidden" }}>
            {Array.from({ length: Math.max(totalCount, 10) }).map((_, i) => (
              <div key={i} style={{ flex: 1, background: i < readCount ? "#5A6259" : "#E4EBE2" }} />
            ))}
          </div>
          <p className="ouma-mono" style={{ marginTop: 10, fontSize: 13, color: "#17211A" }}>
            {readCount}/{totalCount || "?"} read · {pct}%
          </p>
          <p style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.55, color: "#2A342C" }}>
            We could only confidently read {readCount} of {totalCount || "an unknown number of"} ingredients — not
            enough to judge this product. Try a clearer photo or type the missing ones in.
          </p>
        </div>

        <p style={{ marginTop: 12, fontSize: 12.5, color: "#5A6259", lineHeight: 1.5 }}>
          A missing ingredient never silently reads as safe — below {Math.round(COVERAGE_THRESHOLD * 100)}% coverage
          there&apos;s no verdict at all.
        </p>

        <Link
          href="/app/contribute"
          className="no-underline"
          style={{ marginTop: 10, display: "inline-block", fontSize: 12.5, fontWeight: 600, color: "#1E4D3A" }}
        >
          Don&apos;t see your product listed at all? Add it →
        </Link>

        <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", gap: 10 }}>
          <Link
            href={backHref}
            className="no-underline"
            style={{ flex: 1, border: "1.5px dashed rgba(23,33,26,.3)", borderRadius: 12, padding: 15, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#2A342C" }}
          >
            Retake photo
          </Link>
          <Link
            href={`${backHref}/confirm?inci=${encodeURIComponent(rawText)}`}
            className="no-underline"
            style={{ flex: 1.4, background: "#1E4D3A", color: "#fff", borderRadius: 12, padding: 15, textAlign: "center", fontSize: 15, fontWeight: 600 }}
          >
            Type them instead
          </Link>
        </div>
      </div>
    )
  }

  // ── REVEAL PHASE ───────────────────────────────────────────────────────────
  const skinLabel = me ? [me.skinType?.label, me.concerns[0]?.label].filter(Boolean).join(", ") : null
  const totalIngredients = parsedCount || rows.length
  const readIngredients = readCount || rows.length
  const flaggedRows = rows.filter((r) => r.zone !== "GREEN" && !unknownNames.includes(r.name))
  const fineRows = rows.filter((r) => r.zone === "GREEN" && !unknownNames.includes(r.name))
  const inShortText = buildInShort(rows[0]?.name, flaggedRows, verdictKey, skinLabel)
  const stickyBottom = isApp ? "calc(5.5rem + env(safe-area-inset-bottom))" : "0px"

  return (
    <div style={{ minHeight: "100dvh", background: "#F3F5EF", animation: "kb-fade-in 400ms ease" }}>
      <style>{`@keyframes kb-fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>

      <div style={{ padding: `18px 24px calc(${stickyBottom} + 90px)` }}>
        {/* header: back + share */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href={backHref} className="no-underline" style={{ fontSize: 13, color: "#5A6259" }}>
            ← Scan
          </Link>
          <Link
            href={`${pathname?.startsWith("/scan") ? "/scan" : "/app/scan"}/result/share?verdict=${verdictKey}${inci ? `&inci=${encodeURIComponent(inci)}` : ""}`}
            className="no-underline"
            style={{
              padding: "6px 12px", borderRadius: 99, background: "rgba(23,33,26,0.08)",
              fontSize: 12, fontWeight: 500, color: "#17211A",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14">
              <path d="M7 1v9M3 5l4-4 4 4M2 11v2h10v-2" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share
          </Link>
        </div>

        {brand && (
          <p className="ouma-mono" style={{ marginTop: 12, fontSize: 13, color: "#5A6259" }}>
            {brand}
          </p>
        )}
        <h1 className="ouma-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2, textTransform: "uppercase", color: "#17211A" }}>
          {title}
        </h1>
        {err && <p style={{ marginTop: 8, fontSize: 12, color: "#8A2E22" }}>{err}</p>}

        {/* ── verdict card ── */}
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: "1px solid rgba(23,33,26,.07)", padding: 18 }}>
          <div
            className="ouma-mono"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99,
              background: verdict.soft, color: verdict.hex,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 12 12">
              <path
                d={verdictKey === "GREEN" ? "M2 6.5l2.5 2.5L10 3.5" : "M6 1.2 11 10.8H1zM6 4.8v2.4M6 9.2v.01"}
                fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>{CAPS_LABEL[verdictKey]}</span>
          </div>
          {skinLabel && (
            <p style={{ marginTop: 8, fontSize: 13, color: "#5A6259" }}>for {skinLabel} skin — your profile</p>
          )}

          {/* per-ingredient strip */}
          <div style={{ marginTop: 16, display: "flex", gap: 2, height: 26, borderRadius: 6, overflow: "hidden" }}>
            {(rows.length > 0 ? rows : Array.from({ length: Math.max(totalIngredients, 1) })).map((r, i) => (
              <div
                key={i}
                style={{ flex: 1, background: r ? STRIP_HEX[unknownNames.includes((r as IngredientRow).name) ? "NONE" : (r as IngredientRow).zone] : "#E4EBE2" }}
              />
            ))}
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "#5A6259" }}>Label order = concentration order.</span>
            <span className="ouma-mono" style={{ fontSize: 11.5 }}>{readIngredients}/{totalIngredients} read</span>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#5A6259" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: STRIP_HEX.GREEN }} />fine
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: STRIP_HEX.YELLOW }} />caution
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: STRIP_HEX.RED }} />avoid
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: STRIP_HEX.NONE }} />no info
            </span>
          </div>
        </div>

        {/* ── in short ── */}
        <div style={{ marginTop: 12, background: "#fff", borderRadius: 16, border: "1px solid rgba(23,33,26,.07)", padding: 18 }}>
          <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6259" }}>
            In short
          </p>
          <p style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.55, color: "#2A342C" }}>{inShortText}</p>
        </div>

        {/* ── flagged for you ── */}
        {flaggedRows.length > 0 && (
          <>
            <p className="ouma-display" style={{ marginTop: 16, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6259" }}>
              Flagged for you
            </p>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {flaggedRows.map((r) => {
                const pos = rows.indexOf(r) + 1
                const pillBg = r.zone === "RED" ? "#F8E5E1" : "#F7EDD8"
                const pillFg = r.zone === "RED" ? "#8A2E22" : "#7C5410"
                return (
                  <div key={r.name} style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(23,33,26,.07)", padding: "13px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{r.name}</span>
                      <span className="ouma-mono" style={{ fontSize: 11, color: "#5A6259" }}>#{pos}</span>
                      <span
                        style={{
                          marginLeft: "auto", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                          background: pillBg, color: pillFg,
                        }}
                      >
                        {r.zone === "RED" ? "avoid" : "caution"}
                      </span>
                    </div>
                    <p style={{ marginTop: 5, fontSize: 13, color: "#2A342C" }}>{r.note}</p>
                    {skinLabel && (
                      <p style={{ marginTop: 5, fontSize: 13, color: "#7C5410" }}>
                        Worth watching given your {skinLabel.toLowerCase()} profile.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            {verdictKey !== "GREEN" && (
              <Link
                href={`${pathname?.startsWith("/scan") ? "" : "/app"}/discover?query=${encodeURIComponent(title)}`}
                className="no-underline"
                style={{ marginTop: 10, display: "inline-block", fontSize: 12.5, fontWeight: 600, color: "#1E4D3A" }}
              >
                Browse safer swaps →
              </Link>
            )}
          </>
        )}

        {/* ── everything else ── */}
        {fineRows.length > 0 && (
          <>
            <p className="ouma-display" style={{ marginTop: 16, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6259" }}>
              Everything else
            </p>
            <div style={{ marginTop: 8, background: "#fff", borderRadius: 12, border: "1px solid rgba(23,33,26,.07)" }}>
              {fineRows.map((r, i) => {
                const pos = rows.indexOf(r) + 1
                return (
                  <div
                    key={r.name}
                    style={{
                      display: "flex", alignItems: "baseline", gap: 8, padding: "11px 14px",
                      borderBottom: i < fineRows.length - 1 ? "1px solid rgba(23,33,26,.06)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, flex: "none" }}>{r.name}</span>
                    <span className="ouma-mono" style={{ fontSize: 11, color: "#5A6259", flex: "none" }}>#{pos}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#5A6259", textAlign: "right" }}>{r.note}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── no info — crowdsourced report ── */}
        {unknownNames.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5A6259" }}>
              No info <span className="ouma-mono" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· {unknownNames.length}</span>
            </p>
            <div style={{ marginTop: 8, background: "#FFFFFF", borderRadius: 12, border: "1px solid #DDE3DA" }}>
              {unknownNames.map((name, i) => (
                <div
                  key={name}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "11px 14px",
                    borderBottom: i < unknownNames.length - 1 ? "1px solid rgba(23,33,26,.06)" : "none", color: "#5A6259",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{name}</span>
                  <button
                    type="button"
                    disabled={reported.has(name)}
                    onClick={() => {
                      reportUnknownIngredient(name, title).catch(() => {})
                      setReported((prev) => new Set(prev).add(name))
                    }}
                    style={{
                      marginLeft: "auto", fontSize: 12, fontWeight: 600, color: reported.has(name) ? "#5A6259" : "#1E4D3A",
                      background: "none", border: "none", cursor: reported.has(name) ? "default" : "pointer",
                    }}
                  >
                    {reported.has(name) ? "Reported ✓" : "Report"}
                  </button>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: "#5A6259" }}>Not in our database yet — reporting helps everyone.</p>
          </div>
        )}
      </div>

      {/* ── sticky bottom action bar ── */}
      <div
        style={{
          position: "sticky", bottom: stickyBottom, left: 0, right: 0, zIndex: 10,
          background: "rgba(243,245,239,.95)", backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(23,33,26,.08)", padding: "12px 24px 18px",
          display: "flex", gap: 10,
        }}
      >
        <button
          type="button"
          onClick={async () => {
            setSaveState("saving")
            if (isGuest) {
              saveGuestScan({
                title,
                brand,
                flagCount: bd.high + bd.med,
                coverage,
                score: bd.score,
                productId: productId ?? undefined,
                rawIngredientText: rawText || title,
              })
              setSaveState("saved")
              return
            }
            try {
              await saveScan({
                rawIngredientText: rawText || title,
                scanResult: { title, brand, bd, rows, coverage },
                flagCount: bd.high + bd.med,
                productId: productId ?? undefined,
              })
              setSaveState("saved")
            } catch {
              setSaveState("idle")
            }
          }}
          disabled={saveState !== "idle"}
          style={{
            flex: 1, padding: 15, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
            border: "1.5px solid #1E4D3A", background: "transparent", color: "#1E4D3A",
          }}
        >
          {saveState === "saved" ? "Saved ✓" : saveState === "saving" ? "Saving…" : "Save scan"}
        </button>
        {isApp && productId && (
          <button
            type="button"
            onClick={async () => {
              setAddToRoutineState("saving")
              if (isGuest) {
                addGuestStep({ name: title, when: "both", frequency: "daily", productId, brand })
                setAddToRoutineState("saved")
                return
              }
              try {
                await createRoutineStep({ type: "both", productId, frequency: "daily" })
                setAddToRoutineState("saved")
              } catch {
                setAddToRoutineState("idle")
              }
            }}
            disabled={addToRoutineState !== "idle"}
            style={{
              flex: 1, padding: 15, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
              border: "1.5px solid #1E4D3A", background: "transparent", color: "#1E4D3A",
            }}
          >
            {addToRoutineState === "saved" ? "Added ✓" : addToRoutineState === "saving" ? "Adding…" : "Add to routine"}
          </button>
        )}
      </div>
    </div>
  )
}
