"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createRoutineStep, getMyProducts, type MyProduct } from "@/lib/api"
import { useIsGuest } from "@/lib/use-guest"
import { addGuestStep } from "@/lib/guest-store"

const INK = "#17211A"
const MUTE = "#5A6259"
const ACCENT = "#1E4D3A"
const CARD = "#FFFFFF"
const LINE = "rgba(23,33,26,.12)"

type When = "morning" | "night" | "both"
type Frequency = "daily" | "alternate" | "twice_weekly"

export function OumaAddStepClient({
  initialType = "night",
  initialName = "",
}: {
  initialType?: "morning" | "night"
  initialName?: string
}) {
  const router = useRouter()
  const isGuest = useIsGuest()

  const [products, setProducts] = useState<MyProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [customName, setCustomName] = useState(initialName)
  const [when, setWhen] = useState<When>(initialType)
  const [frequency, setFrequency] = useState<Frequency>("daily")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isGuest) return
    getMyProducts()
      .then((r) => setProducts(r.products))
      .catch(() => setProducts([]))
  }, [isGuest])

  async function submit() {
    if (!selectedProductId && !customName.trim()) return
    setSaving(true)
    if (isGuest) {
      addGuestStep({ name: customName.trim(), when, frequency, productId: selectedProductId ?? undefined })
      router.replace(`/app/routine?added=1`)
      return
    }
    try {
      await createRoutineStep({
        type: when,
        productId: selectedProductId ?? undefined,
        customName: selectedProductId ? undefined : customName.trim(),
        frequency,
      })
      router.replace(`/app/routine?added=1`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg pb-6" style={{ color: INK }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{ fontSize: 13, color: MUTE, background: "none", border: "none", cursor: "pointer" }}
      >
        ← Routine
      </button>
      <h1 className="ouma-display" style={{ fontSize: 26, textTransform: "uppercase", marginTop: 12 }}>
        Add a step
      </h1>

      {products.length > 0 && (
        <>
          <p className="ouma-display" style={{ marginTop: 16, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
            From my products
          </p>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedProductId(p.id)
                  setCustomName("")
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: CARD,
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: selectedProductId === p.id ? `1.5px solid ${ACCENT}` : `1px solid ${LINE}`,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ width: 36, height: 36, borderRadius: 8, background: "#E4EBE2", flex: "none" }} />
                <span style={{ fontSize: 14.5, fontWeight: 500 }}>{p.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: MUTE }}>{p.usage.join(" + ") || "unused"}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="ouma-display" style={{ marginTop: 20, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
        Or type a new step
      </p>
      <input
        value={customName}
        onChange={(e) => {
          setCustomName(e.target.value)
          setSelectedProductId(null)
        }}
        placeholder="Product name…"
        style={{ marginTop: 10, width: "100%", background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px 16px", fontSize: 15 }}
      />

      <p className="ouma-display" style={{ marginTop: 20, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
        When
      </p>
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        {(["morning", "night", "both"] as When[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWhen(w)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: 11,
              borderRadius: 10,
              border: when === w ? `1.5px solid ${ACCENT}` : `1px solid ${LINE}`,
              background: CARD,
              fontSize: 14,
              fontWeight: when === w ? 600 : 400,
              color: when === w ? ACCENT : INK,
              cursor: "pointer",
            }}
          >
            {w === "morning" ? "AM" : w === "night" ? "PM" : "Both"}
          </button>
        ))}
      </div>

      <p className="ouma-display" style={{ marginTop: 20, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
        How often
      </p>
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        {([
          { v: "daily", label: "Daily" },
          { v: "alternate", label: "Alternate nights" },
          { v: "twice_weekly", label: "2× week" },
        ] as { v: Frequency; label: string }[]).map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFrequency(f.v)}
            style={{
              flex: f.v === "alternate" ? 1.3 : 1,
              textAlign: "center",
              padding: 11,
              borderRadius: 10,
              border: frequency === f.v ? `1.5px solid ${ACCENT}` : `1px solid ${LINE}`,
              background: CARD,
              fontSize: 13.5,
              fontWeight: frequency === f.v ? 600 : 400,
              color: frequency === f.v ? ACCENT : INK,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          background: "rgba(30,77,58,.07)",
          color: "#16382B",
          borderRadius: 12,
          padding: "13px 15px",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        Cleansers go first, treatments and serums after toner, moisturiser last — we&apos;ll place this step in the
        right spot automatically.
        {frequency === "alternate" && " Alternate nights suits stronger actives like retinoids and acids."}
      </div>

      <div style={{ marginTop: 22 }}>
        <button
          type="button"
          onClick={submit}
          disabled={saving || (!selectedProductId && !customName.trim())}
          style={{
            width: "100%",
            background: ACCENT,
            color: "#fff",
            borderRadius: 12,
            padding: 15,
            textAlign: "center",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Adding…" : `Add to ${when === "both" ? "AM + PM" : when === "night" ? "PM" : "AM"} routine`}
        </button>
      </div>
    </div>
  )
}
