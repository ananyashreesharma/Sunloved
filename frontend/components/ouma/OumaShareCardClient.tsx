"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

const VERDICTS = {
  RED: {
    word: "Avoid.",
    sub: "We found ingredients we wouldn't put on our own skin.",
    hex: "#8A2E22",
    soft: "#F8E5E1",
    bloom: "rgba(138,42,34,0.45)",
    badge: "RED",
    count: { red: 3, amber: 4, green: 18 },
  },
  YELLOW: {
    word: "Use with care.",
    sub: "Mostly fine, but a few flags worth knowing about.",
    hex: "#7C5410",
    soft: "#F7EDD8",
    bloom: "rgba(181,118,42,0.4)",
    badge: "YELLOW",
    count: { red: 0, amber: 5, green: 17 },
  },
  GREEN: {
    word: "Skin-safe.",
    sub: "Clean ingredients. We'd happily put this on our face.",
    hex: "#1D5C3B",
    soft: "#DFF0E4",
    bloom: "rgba(79,107,61,0.35)",
    badge: "GREEN",
    count: { red: 0, amber: 1, green: 21 },
  },
}

const SHARE_BUTTONS = [
  { l: "Instagram", i: "◍" },
  { l: "WhatsApp", i: "✉" },
  { l: "Save", i: "↓" },
  { l: "Copy", i: "⎘" },
]

export function OumaShareCardClient() {
  const params = useSearchParams()
  const verdictParam = params.get("verdict")?.toUpperCase() as keyof typeof VERDICTS | null
  const inci = params.get("inci")
  const backHref = inci
    ? `/app/scan/result?inci=${encodeURIComponent(inci)}`
    : "/app/scan/result"

  const verdictKey: keyof typeof VERDICTS =
    verdictParam && verdictParam in VERDICTS ? verdictParam : "YELLOW"
  const v = VERDICTS[verdictKey]

  return (
    <div
      style={{
        minHeight: "100dvh",
        paddingBottom: 60,
        color: "#F3F5EF",
        background: "#17211A",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "60px 24px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href={backHref}
          className="no-underline"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 13,
            color: "rgba(243,245,239,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
        <p
          className="ouma-mono"
          style={{ fontSize: 10, letterSpacing: 2, opacity: 0.5 }}
        >
          SHARE
        </p>
        <div style={{ width: 14 }} />
      </div>

      {/* subtitle */}
      <div style={{ padding: "8px 28px 0", textAlign: "center" }}>
        <p
          className="ouma-display"
          style={{ fontSize: 24, lineHeight: 1.2, fontStyle: "italic" }}
        >
          This is what they&apos;ll see.
        </p>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
          9:16 — perfect for Instagram Stories.
        </p>
      </div>

      {/* story card */}
      <div style={{ padding: "20px 28px 0" }}>
        <div
          style={{
            aspectRatio: "9/16",
            borderRadius: 16,
            position: "relative",
            overflow: "hidden",
            background: v.soft,
            color: "#17211A",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* bloom */}
          <div
            style={{
              position: "absolute",
              top: -60,
              left: "-30%",
              width: "160%",
              height: 350,
              background: `radial-gradient(ellipse at center, ${v.bloom} 0%, transparent 65%)`,
              pointerEvents: "none",
            }}
          />

          {/* top: brand + product */}
          <div style={{ position: "relative", padding: "28px 24px 0" }}>
            <p
              className="ouma-mono"
              style={{ fontSize: 9, letterSpacing: 2, color: "#5A6259" }}
            >
              SCANNED ON KNOW BETTER
            </p>
            <p
              className="ouma-display"
              style={{ fontSize: 18, marginTop: 6, lineHeight: 1.2, color: "#17211A" }}
            >
              SkinLens<br />
              <em style={{ fontStyle: "italic" }}>Ingredient Analysis</em>
            </p>
          </div>

          {/* verdict */}
          <div
            style={{
              position: "relative",
              padding: "0 24px",
              textAlign: "center",
              marginTop: 36,
            }}
          >
            <div
              className="ouma-mono"
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 99,
                background: v.hex,
                color: "#F3F5EF",
                fontSize: 9,
                letterSpacing: 2,
              }}
            >
              {v.badge}
            </div>
            <p
              className="ouma-display"
              style={{
                fontSize: 64,
                lineHeight: 0.95,
                marginTop: 12,
                color: v.hex,
                letterSpacing: -1.5,
                fontStyle: "italic",
              }}
            >
              {v.word}
            </p>
            <p
              style={{
                fontSize: 11,
                marginTop: 14,
                color: "#2A342C",
                maxWidth: 240,
                margin: "14px auto 0",
                lineHeight: 1.5,
              }}
            >
              {v.sub}
            </p>
          </div>

          {/* bottom: bar + branding */}
          <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
            <div
              style={{
                display: "flex",
                borderRadius: 99,
                overflow: "hidden",
                height: 4,
                background: "rgba(23,33,26,0.1)",
              }}
            >
              <div style={{ flex: v.count.red, background: "#8A2E22" }} />
              <div style={{ flex: v.count.amber, background: "#7C5410" }} />
              <div style={{ flex: v.count.green, background: "#1D5C3B" }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
                alignItems: "center",
              }}
            >
              <p
                className="ouma-display"
                style={{ fontSize: 16, fontStyle: "italic", color: "#17211A" }}
              >
                know better
              </p>
              <p
                className="ouma-mono"
                style={{ fontSize: 8, letterSpacing: 1.6, color: "#5A6259" }}
              >
                KNOW WHAT&apos;S ON YOUR SKIN
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* share buttons */}
      <div style={{ display: "flex", gap: 8, padding: "20px 16px 0" }}>
        {SHARE_BUTTONS.map((b) => (
          <button
            key={b.l}
            type="button"
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 12,
              background: "rgba(243,245,239,0.08)",
              border: "1px solid rgba(243,245,239,0.12)",
              color: "#F3F5EF",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{b.i}</div>
            {b.l}
          </button>
        ))}
      </div>
    </div>
  )
}
