"use client"

import Link from "next/link"
import { useState } from "react"

const G = "#1D5C3B"
const C = "#7C5410"
const U = "#A9B2A8"

const STRIP_GOOD = [G, G, C, G, G, G, G, G, U, G, G, G, G, G, G, G, G, G, C, G, G, G, U, G]
const STRIP_LOW = [G, U, U, G, U, C, G, U, U, G, U, U, G, G, U, U, G, U, U, G, G, U, U, G]

const INTRO_ROWS = [
  {
    title: "Build tonight's routine",
    body: "Type product names. We order them and remind you.",
    icon: "M4 6h10M4 12h14M4 18h10",
  },
  {
    title: "Read any label",
    body: "Photo or paste. A plain sentence per ingredient.",
    icon: "M4 8h3l2-2.5h6L17 8h3v10H4zM12 15.5a3 3 0 100-6 3 3 0 000 6",
  },
  {
    title: "Say what we don't know",
    body: "No verdict when we can't read enough of a label.",
    icon: "M12 3a9 9 0 100 18 9 9 0 000-18M9.5 9.5a2.6 2.6 0 114.1 2.2c-1 .75-1.6 1.2-1.6 2.4M12 17.5v.01",
  },
]

const PROMISES = [
  "Scans are free. We gate nothing that helps you decide.",
  "One reminder per routine, muted in a tap.",
  "No affiliate links, no sponsored verdicts.",
]

const CTA_LABELS = ["See the routine", "See a scan", "One more thing", "Get SkinLens — free"]
const FINEPRINT = [
  "Two features, no funnel. Neither needs the other.",
  "Tap a step — that's the whole interaction at 10pm.",
  "You don't have to own the bottle to read it.",
  "Free to start. No affiliate links, no sponsored verdicts.",
]

const INITIAL_STEPS = [
  { name: "Cleanser", brand: "CeraVe · Foaming", done: true },
  { name: "Serum", brand: "Minimalist · Niacinamide 10%", done: true },
  { name: "Retinol", brand: "d'you · in my defence", done: false },
  { name: "Moisturiser", brand: "Cetaphil · typed, not scanned", done: false },
]

function TickIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 12 12">
      <path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="#0E1411" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ValuePropCarousel() {
  const [page, setPage] = useState(0)
  const [steps, setSteps] = useState(INITIAL_STEPS)

  const dark = page === 1 || page === 3
  const bg = dark ? "#0E1411" : "#F3F5EF"
  const ink = dark ? "#E7ECE7" : "#17211A"
  const mute = dark ? "#9FB0A4" : "#5A6259"
  const accent = dark ? "#5C9977" : "#1E4D3A"

  function toggleStep(i: number) {
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, done: !s.done } : s)))
  }

  const doneCount = steps.filter((s) => s.done).length
  const tapHint = doneCount === steps.length ? "Done for tonight. See you at 7:30." : "Tap a step to check it off."

  return (
    <div style={{ minHeight: "100dvh", background: bg, color: ink, display: "flex", flexDirection: "column", transition: "background .35s, color .35s" }}>
      <Link
        href="/login?next=%2Fonboarding"
        className="no-underline"
        style={{ position: "absolute", top: 18, right: 22, fontSize: 12.5, color: mute, zIndex: 2 }}
      >
        Skip →
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-16 pb-4">
        {page === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "mkfade .35s ease-out" }}>
            <div
              className="ouma-mono"
              style={{
                alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8,
                background: "#E4EBE2", borderRadius: 999, padding: "6px 13px", fontSize: 12.5, color: "#2A342C",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 3, background: "#1D5C3B" }} />
              Scans free, always
            </div>
            <h1 className="ouma-display" style={{ fontSize: "clamp(2.1rem, 8vw, 3.1rem)", lineHeight: 0.98, textTransform: "uppercase", marginTop: 18 }}>
              Skincare that talks to you straight
            </h1>
            <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.58, color: "#2A342C" }}>
              Doesn&apos;t scare you. Doesn&apos;t sell to you. Keeps you consistent, and reads any label you point it at.
            </p>
            <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", flexDirection: "column", gap: 9 }}>
              {INTRO_ROWS.map((r) => (
                <div key={r.title} style={{ background: "#fff", border: "1px solid rgba(23,33,26,.08)", borderRadius: 15, padding: "15px 17px", display: "flex", gap: 13, alignItems: "center" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: "#DFF0E4", flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={17} height={17} viewBox="0 0 24 24">
                      <path d={r.icon} fill="none" stroke="#1D5C3B" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <span style={{ display: "block", fontSize: 15.5, fontWeight: 600 }}>{r.title}</span>
                    <span style={{ display: "block", fontSize: 13.5, color: "#5A6259", marginTop: 1 }}>{r.body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 1 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "mkfade .35s ease-out" }}>
            <p className="ouma-display" style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9FB0A4" }}>
              The routine · your evening
            </p>
            <h1 className="ouma-display" style={{ fontSize: "clamp(1.9rem, 7vw, 2.4rem)", lineHeight: 1, textTransform: "uppercase", marginTop: 8 }}>
              Three names is a working routine
            </h1>
            <p style={{ marginTop: 11, fontSize: 15, lineHeight: 1.55, color: "#C6D2C7" }}>
              Type what you use. We order it, explain why, and remind you once — with tonight&apos;s actual steps.
            </p>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => toggleStep(i)}
                  style={{
                    background: "#202B23", border: "1px solid rgba(231,236,231,.09)", borderRadius: 14, padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 11, cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span className="ouma-mono" style={{ fontSize: 12, color: "#9FB0A4" }}>{i + 1}</span>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "#2A362C", flex: "none" }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: s.done ? "#9FB0A4" : "#E7ECE7", textDecoration: s.done ? "line-through" : "none" }}>
                      {s.name}
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#9FB0A4" }}>{s.brand}</span>
                  </span>
                  <span
                    style={{
                      marginLeft: "auto", flex: "none", width: 24, height: 24, borderRadius: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: s.done ? "#5C9977" : "transparent",
                      border: s.done ? "1.5px solid #5C9977" : "1.5px solid rgba(231,236,231,.3)",
                    }}
                  >
                    {s.done && <TickIcon />}
                  </span>
                </button>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "#9FB0A4", textAlign: "center" }}>{tapHint}</p>
            <div style={{ marginTop: "auto", paddingTop: 16, background: "#202B23", border: "1px solid rgba(231,236,231,.09)", borderRadius: 15, padding: "15px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: "#5C9977", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="ouma-display" style={{ fontSize: 9, fontWeight: 700, color: "#0E1411" }}>SL</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>SkinLens</span>
                <span className="ouma-mono" style={{ marginLeft: "auto", fontSize: 11, color: "#9FB0A4" }}>21:30</span>
              </div>
              <div style={{ marginTop: 7, fontSize: 13.5, fontWeight: 600 }}>PM routine · 4 steps</div>
              <div style={{ fontSize: 13, color: "#C6D2C7", marginTop: 2 }}>CeraVe cleanser → Minimalist serum → retinol → Cetaphil</div>
              <div style={{ fontSize: 13, color: "#9FB0A4", marginTop: 4, fontStyle: "italic" }}>&quot;Consistency beats intensity.&quot;</div>
            </div>
            <p style={{ marginTop: 9, fontSize: 12.5, color: "#9FB0A4", textAlign: "center" }}>
              Miss a night and the streak pauses. It never breaks.
            </p>
          </div>
        )}

        {page === 2 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "mkfade .35s ease-out" }}>
            <p className="ouma-display" style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5A6259" }}>
              The scan · in the aisle
            </p>
            <h1 className="ouma-display" style={{ fontSize: "clamp(1.9rem, 7vw, 2.4rem)", lineHeight: 1, textTransform: "uppercase", marginTop: 8 }}>
              Read any label in ten seconds
            </h1>
            <p style={{ marginTop: 11, fontSize: 15, lineHeight: 1.55, color: "#2A342C" }}>
              Photograph the ingredient list on any bottle — you don&apos;t have to own it. You see what we read before you see what we think.
            </p>
            <div style={{ marginTop: 16, background: "#fff", border: "1px solid rgba(23,33,26,.08)", borderRadius: 18, padding: 17 }}>
              <div
                className="ouma-mono"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 999,
                  background: "#F7EDD8", color: "#7C5410", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
                }}
              >
                <svg width={14} height={14} viewBox="0 0 12 12">
                  <path d="M6 1.2 11 10.8H1zM6 4.8v2.4M6 9.2v.01" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                USE WITH CAUTION
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 2, height: 24, borderRadius: 6, overflow: "hidden" }}>
                {STRIP_GOOD.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#5A6259" }}>
                <span>Label order = concentration order</span>
                <span className="ouma-mono">27/29 read</span>
              </div>
              <div style={{ marginTop: 11, display: "flex", flexWrap: "wrap", gap: 9, fontSize: 11, color: "#5A6259" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#1D5C3B" }} />fine</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#7C5410" }} />caution</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#8A2E22" }} />not for you</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#A9B2A8" }} />no info</span>
              </div>
            </div>
            <div style={{ marginTop: 10, background: "#fff", border: "1px solid rgba(23,33,26,.08)", borderRadius: 16, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>Alcohol Denat.</span>
                <span className="ouma-mono" style={{ fontSize: 11, color: "#5A6259" }}>#4</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 13.5, color: "#2A342C" }}>Solvent — evaporates fast; can dry and sting.</div>
              <div style={{ marginTop: 3, fontSize: 13.5, color: "#7C5410" }}>Fourth on the label is high. On acne-prone skin, expect tightness.</div>
            </div>
            <p style={{ marginTop: "auto", paddingTop: 16, fontSize: 13, color: "#5A6259", textAlign: "center" }}>
              One plain sentence per ingredient. No chemistry lecture, no scare score.
            </p>
          </div>
        )}

        {page === 3 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "mkfade .35s ease-out" }}>
            <p className="ouma-display" style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9FB0A4" }}>
              Why you can trust the rest
            </p>
            <h1 className="ouma-display" style={{ fontSize: "clamp(1.9rem, 7vw, 2.4rem)", lineHeight: 1, textTransform: "uppercase", marginTop: 8 }}>
              We tell you when we don&apos;t know
            </h1>
            <p style={{ marginTop: 11, fontSize: 15, lineHeight: 1.55, color: "#C6D2C7" }}>
              Most scanners guess. If we can&apos;t read enough of a label, you get no verdict at all — an ingredient we missed must never quietly read as safe.
            </p>
            <div style={{ marginTop: 16, background: "#202B23", border: "1px solid rgba(231,236,231,.09)", borderRadius: 16, padding: 17 }}>
              <div style={{ display: "flex", gap: 2, height: 24, borderRadius: 6, overflow: "hidden" }}>
                {STRIP_LOW.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>
              <div className="ouma-mono" style={{ marginTop: 11, fontSize: 13 }}>18/31 read · 58%</div>
              <div style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5, color: "#C6D2C7" }}>
                We could only read 18 of 31 ingredients — not enough to judge this product. Try a clearer photo or type the missing ones in.
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {PROMISES.map((p) => (
                <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "#C6D2C7" }}>
                  <span style={{ width: 17, height: 17, borderRadius: 9, background: "rgba(92,153,119,.2)", flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <svg width={10} height={10} viewBox="0 0 12 12">
                      <path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="#5C9977" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {p}
                </div>
              ))}
            </div>
            <p style={{ marginTop: "auto", paddingTop: 16, fontSize: 13, color: "#9FB0A4", textAlign: "center" }}>
              Every verdict is colour, icon and words — readable if you don&apos;t see red and green.
            </p>
          </div>
        )}
      </div>

      <div style={{ flex: "none", padding: "14px 22px 26px", background: bg, borderTop: dark ? "1px solid rgba(231,236,231,.08)" : "1px solid rgba(23,33,26,.08)", transition: "background .35s" }}>
        <div className="mx-auto flex w-full max-w-md flex-col">
          <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 13 }}>
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`Go to page ${i + 1}`}
                style={{
                  width: i === page ? 22 : 6, height: 6, borderRadius: 3, cursor: "pointer", border: "none", padding: 0,
                  background: i === page ? accent : dark ? "rgba(231,236,231,.25)" : "rgba(23,33,26,.18)",
                  transition: "width .25s, background .25s",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {page > 0 && (
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{
                  flex: "none", width: 52, border: `1.5px solid ${dark ? "rgba(231,236,231,.25)" : "rgba(23,33,26,.2)"}`,
                  color: dark ? "#C6D2C7" : "#2A342C", borderRadius: 13, padding: "15px 0", textAlign: "center",
                  fontSize: 16, fontWeight: 600, cursor: "pointer", background: "none",
                }}
              >
                ←
              </button>
            )}
            {page < 3 ? (
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(3, p + 1))}
                style={{ flex: 1, background: accent, color: dark ? "#0E1411" : "#F3F5EF", borderRadius: 13, padding: 15, textAlign: "center", fontSize: 16, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                {CTA_LABELS[page]}
              </button>
            ) : (
              <Link
                href="/login?next=%2Fonboarding"
                className="no-underline"
                style={{ flex: 1, background: accent, color: "#0E1411", borderRadius: 13, padding: 15, textAlign: "center", fontSize: 16, fontWeight: 600 }}
              >
                {CTA_LABELS[3]}
              </Link>
            )}
          </div>
          <div style={{ marginTop: 10, textAlign: "center", fontSize: 12.5, color: mute }}>{FINEPRINT[page]}</div>
        </div>
      </div>

      <style>{`@keyframes mkfade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
