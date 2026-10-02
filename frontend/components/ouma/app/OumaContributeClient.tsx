"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { contributeProduct } from "@/lib/api"
import { useIsGuest } from "@/lib/use-guest"
import { GuestActionPrompt } from "@/components/ouma/GuestGate"

const INK = "#17211A"
const MUTE = "#5A6259"
const ACCENT = "#1E4D3A"
const CARD = "#FFFFFF"
const LINE = "rgba(23,33,26,.12)"

const COUNTRIES: { code: string; label: string }[] = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
]

export function OumaContributeClient() {
  const router = useRouter()
  const isGuest = useIsGuest()

  const [productName, setProductName] = useState("")
  const [brandName, setBrandName] = useState("")
  const [country, setCountry] = useState<string>("IN")
  const [rawIngredientText, setRawIngredientText] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ matched: number; aiEnriched: number } | null>(null)

  const canSubmit = productName.trim() && brandName.trim() && rawIngredientText.trim() && !saving

  async function submit() {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const res = await contributeProduct({
        productName: productName.trim(),
        brandName: brandName.trim(),
        country,
        rawIngredientText: rawIngredientText.trim(),
      })
      setResult({ matched: res.matched, aiEnriched: res.aiEnriched })
    } catch {
      setError("Couldn't submit that — check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto w-full max-w-lg pb-6" style={{ color: INK }}>
        <div
          style={{
            marginTop: 40,
            background: CARD,
            border: `1px solid ${LINE}`,
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 className="ouma-display" style={{ fontSize: 22, textTransform: "uppercase" }}>
            Thanks for contributing
          </h1>
          <p style={{ marginTop: 10, fontSize: 14.5, color: MUTE, lineHeight: 1.5 }}>
            Matched {result.matched} known ingredient{result.matched === 1 ? "" : "s"}
            {result.aiEnriched > 0 ? ` and looked up ${result.aiEnriched} new one${result.aiEnriched === 1 ? "" : "s"}` : ""}.
            Live within 24 hours, sooner if reviewed.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/app/routine")}
            style={{
              marginTop: 20,
              width: "100%",
              background: ACCENT,
              color: "#fff",
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to routine
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg pb-6" style={{ color: INK }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{ fontSize: 13, color: MUTE, background: "none", border: "none", cursor: "pointer" }}
      >
        ← Back
      </button>
      <h1 className="ouma-display" style={{ fontSize: 26, textTransform: "uppercase", marginTop: 12 }}>
        Contribute a product
      </h1>
      <p style={{ marginTop: 8, fontSize: 14, color: MUTE, lineHeight: 1.5 }}>
        Can't find your product? Add it — the same product can have a different ingredient list
        depending on where it's sold, so tell us which country's version you're pasting from.
      </p>

      <p className="ouma-display" style={{ marginTop: 22, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
        Product name
      </p>
      <input
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="e.g. Nivea Soft Light Moisturizer"
        style={{ marginTop: 10, width: "100%", background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px 16px", fontSize: 15 }}
      />

      <p className="ouma-display" style={{ marginTop: 20, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
        Brand
      </p>
      <input
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
        placeholder="e.g. Nivea"
        style={{ marginTop: 10, width: "100%", background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px 16px", fontSize: 15 }}
      />

      <p className="ouma-display" style={{ marginTop: 20, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
        Country of this formulation
      </p>
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCountry(c.code)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: 11,
              borderRadius: 10,
              border: country === c.code ? `1.5px solid ${ACCENT}` : `1px solid ${LINE}`,
              background: CARD,
              fontSize: 13.5,
              fontWeight: country === c.code ? 600 : 400,
              color: country === c.code ? ACCENT : INK,
              cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="ouma-display" style={{ marginTop: 20, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
        Ingredient list
      </p>
      <textarea
        value={rawIngredientText}
        onChange={(e) => setRawIngredientText(e.target.value)}
        placeholder="Paste from the back of the bottle — Aqua, Glycerin, Niacinamide…"
        rows={6}
        style={{ marginTop: 10, width: "100%", background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px 16px", fontSize: 14.5, resize: "vertical" }}
      />

      {error && (
        <p style={{ marginTop: 12, fontSize: 13, color: "#8A2E22" }}>{error}</p>
      )}

      <div style={{ marginTop: 22, display: "flex" }}>
        {isGuest ? (
          <GuestActionPrompt label="Sign in to submit this" next="/app/contribute" style={{ width: "100%" }} />
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
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
              cursor: canSubmit ? "pointer" : "default",
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            {saving ? "Submitting…" : "Submit"}
          </button>
        )}
      </div>
    </div>
  )
}
