"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getMyProducts, type MyProduct } from "@/lib/api"
import { useIsGuest } from "@/lib/use-guest"
import { loadGuestData } from "@/lib/guest-store"

const INK = "#17211A"
const MUTE = "#5A6259"
const CARD = "#FFFFFF"
const LINE = "rgba(23,33,26,.07)"

const VERDICT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  green: { bg: "#DFF0E4", fg: "#1D5C3B", label: "fine" },
  yellow: { bg: "#F7EDD8", fg: "#7C5410", label: "caution" },
  red: { bg: "#F8E5E1", fg: "#8A2E22", label: "avoid" },
}

export function OumaProductsClient() {
  const isGuest = useIsGuest()
  const [products, setProducts] = useState<MyProduct[] | null>(null)

  useEffect(() => {
    if (isGuest) {
      const data = loadGuestData()
      setProducts(
        data.steps.map((s) => ({
          id: s.id,
          name: s.name,
          brand: s.brand ?? "",
          usage: s.when === "both" ? ["AM", "PM"] : s.when === "morning" ? ["AM"] : ["PM"],
          scan: null,
        })),
      )
      return
    }
    getMyProducts()
      .then((r) => setProducts(r.products))
      .catch(() => setProducts([]))
  }, [isGuest])

  return (
    <div className="mx-auto w-full max-w-lg pb-6" style={{ color: INK }}>
      <Link href="/app/routine" className="no-underline" style={{ fontSize: 13, color: MUTE }}>
        ← Routine
      </Link>
      <div className="flex items-baseline justify-between" style={{ marginTop: 12 }}>
        <h1 className="ouma-display" style={{ fontSize: 26, textTransform: "uppercase" }}>
          My products
        </h1>
        <span className="ouma-mono" style={{ fontSize: 12, color: MUTE }}>
          {products?.length ?? 0}
        </span>
      </div>
      <p style={{ marginTop: 8, fontSize: 13, color: MUTE }}>
        Everything you&apos;ve added to a routine, scanned or typed.
      </p>
      <Link
        href="/app/contribute"
        className="no-underline"
        style={{ marginTop: 10, display: "inline-block", fontSize: 12.5, fontWeight: 600, color: "#1E4D3A" }}
      >
        Can&apos;t find your product? Contribute it →
      </Link>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(products ?? []).map((p) => {
          const zone = (p.scan as { foundIngredients?: { zone?: string }[] } | null)
          const verdictZone = zone?.foundIngredients?.find((i) => i.zone)?.zone
          const verdict = verdictZone ? VERDICT_STYLE[verdictZone] : null
          return (
            <div key={p.id} style={{ background: CARD, borderRadius: 14, border: `1px solid ${LINE}`, padding: 13 }}>
              <div style={{ height: 64, borderRadius: 9, background: "#E4EBE2" }} />
              <p style={{ marginTop: 9, fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{p.name}</p>
              <p style={{ fontSize: 11.5, color: MUTE, marginTop: 2 }}>{p.brand}</p>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 999, background: "#E4EBE2", color: MUTE }}>
                  {p.usage.join(" + ") || "unused"}
                </span>
                {verdict ? (
                  <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: verdict.bg, color: verdict.fg }}>
                    {verdict.label}
                  </span>
                ) : (
                  <Link
                    href="/app/scan"
                    className="no-underline"
                    style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 999, border: "1px dashed rgba(23,33,26,.25)", color: MUTE }}
                  >
                    scan to check
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {products?.length === 0 && (
        <p style={{ marginTop: 24, fontSize: 13, color: MUTE, textAlign: "center" }}>
          Nothing here yet — products you add to your routine will show up here.
        </p>
      )}
    </div>
  )
}
