"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  inci: string
  backHref: string
  resultBasePath: string
}

export function OumaScanConfirmClient({ inci, backHref, resultBasePath }: Props) {
  const router = useRouter()
  const [chips, setChips] = useState(() => inci.split(/[,\n]/).map((s) => s.trim()).filter(Boolean))
  const [addValue, setAddValue] = useState("")
  const addInputRef = useRef<HTMLInputElement>(null)

  function removeChip(i: number) {
    setChips((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addChip() {
    const v = addValue.trim()
    if (!v) return
    setChips((prev) => [...prev, v])
    setAddValue("")
  }

  function analyse() {
    const joined = chips.join(", ")
    router.push(`${resultBasePath}?inci=${encodeURIComponent(joined)}`)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ background: "#F3F5EF", color: "#17211A" }}>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pt-[18px] pb-4">
        <Link href={backHref} className="no-underline" style={{ fontSize: 13, color: "#5A6259" }}>
          ← Scan
        </Link>
        <h1 className="ouma-display" style={{ fontSize: 26, textTransform: "uppercase", marginTop: 12 }}>
          Check what we read
        </h1>
        <p style={{ marginTop: 6, fontSize: 13, color: "#5A6259" }}>
          Tap a chip to fix it. Nothing is judged yet.
        </p>
        <p className="ouma-mono" style={{ marginTop: 8, fontSize: 12 }}>
          {chips.length} ingredients found
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {chips.map((c, i) => (
            <span
              key={`${c}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 11px",
                borderRadius: 8,
                background: "#fff",
                border: "1px solid rgba(23,33,26,.12)",
                fontSize: 12.5,
              }}
            >
              {c}
              <button
                type="button"
                onClick={() => removeChip(i)}
                aria-label={`Remove ${c}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#5A6259", fontSize: 12, padding: 0 }}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => addInputRef.current?.focus()}
            style={{
              padding: "6px 11px",
              borderRadius: 8,
              border: "1px dashed rgba(23,33,26,.3)",
              background: "transparent",
              fontSize: 12.5,
              color: "#5A6259",
              cursor: "pointer",
            }}
          >
            + add missing
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            ref={addInputRef}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addChip()
            }}
            placeholder="Add missing ingredient…"
            style={{ flex: 1, background: "#fff", border: "1px dashed rgba(23,33,26,.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12.5 }}
          />
          <button
            type="button"
            onClick={addChip}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(23,33,26,.12)", background: "#fff", fontSize: 12.5, cursor: "pointer" }}
          >
            Add
          </button>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", gap: 10 }}>
          <Link
            href={backHref}
            className="no-underline"
            style={{ flex: 1, border: "1.5px solid rgba(23,33,26,.2)", borderRadius: 12, padding: 15, textAlign: "center", fontSize: 15, fontWeight: 600, color: "#2A342C" }}
          >
            Retake
          </Link>
          <button
            type="button"
            onClick={analyse}
            disabled={chips.length === 0}
            style={{
              flex: 1.6,
              background: "#1E4D3A",
              color: "#fff",
              borderRadius: 12,
              padding: 15,
              textAlign: "center",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: chips.length === 0 ? "default" : "pointer",
              opacity: chips.length === 0 ? 0.5 : 1,
            }}
          >
            Analyse
          </button>
        </div>
      </div>
    </div>
  )
}
