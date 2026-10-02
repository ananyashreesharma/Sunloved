"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { riskFromScore, zoneFromRisk, type Zone } from "@skinlens/shared"
import { getRecentScans, type RecentScanEntry } from "@/lib/api"
import { getGuestScans } from "@/lib/guest-store"
import { useIsGuest } from "@/lib/use-guest"

// Built only from the scans this person actually saved. (This screen used to show hardcoded sample
// numbers — "23 products scanned", "Saved ~₹450" — to every user as if they were theirs.)

const ZONE_STYLE: Record<Zone, { label: string; fg: string; soft: string }> = {
  RED: { label: "Avoid", fg: "#8A2E22", soft: "#F8E5E1" },
  YELLOW: { label: "Caution", fg: "#7C5410", soft: "#F7EDD8" },
  GREEN: { label: "Fine", fg: "#1D5C3B", soft: "#DFF0E4" },
}

function zoneOfScan(s: RecentScanEntry): Zone | null {
  return s.score == null ? null : zoneFromRisk(riskFromScore(s.score))
}

export function OumaInsightsClient() {
  const isGuest = useIsGuest()
  const [scans, setScans] = useState<RecentScanEntry[] | null>(null)

  useEffect(() => {
    if (isGuest) {
      setScans(
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
      .then(setScans)
      .catch(() => setScans([]))
  }, [isGuest])

  if (scans === null) {
    return <div className="mx-auto w-full max-w-lg py-16 text-center text-sm text-[#5A6259]">Loading your scans…</div>
  }

  const judged = scans.filter((s) => zoneOfScan(s) !== null)
  const counts: Record<Zone, number> = { RED: 0, YELLOW: 0, GREEN: 0 }
  for (const s of judged) counts[zoneOfScan(s) as Zone]++

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 pb-6">
      <header className="pt-1">
        <h1 className="ouma-display text-xl font-bold text-[#17211A]">Insights</h1>
        <p className="mt-1 text-sm text-[#5A6259]">From the scans you&apos;ve saved{isGuest ? " on this device" : ""}.</p>
      </header>

      {judged.length === 0 ? (
        <div className="rounded-2xl border border-[#DDE3DA] bg-white p-6 text-center">
          <p className="text-sm text-[#2A342C]">
            Nothing to show yet. Save a scan and this page will show how the products you use break down.
          </p>
          <Link
            href="/app/scan"
            className="mt-4 inline-block rounded-full bg-[#1E4D3A] px-5 py-2.5 text-sm font-semibold text-white no-underline"
          >
            Scan a product
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {(["RED", "YELLOW", "GREEN"] as const).map((z) => (
              <div key={z} className="rounded-2xl border border-[#DDE3DA] bg-white p-4 text-center">
                <p className="ouma-display text-3xl font-black" style={{ color: ZONE_STYLE[z].fg }}>
                  {counts[z]}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#5A6259]">{ZONE_STYLE[z].label}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#DDE3DA] bg-white">
            <p className="border-b border-[#DDE3DA] px-4 py-3 text-sm font-bold text-[#17211A]">
              Your saved scans · {judged.length}
            </p>
            <ul className="m-0 list-none divide-y divide-[#DDE3DA] p-0">
              {judged.map((s) => {
                const z = zoneOfScan(s) as Zone
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#17211A]">{s.name}</p>
                      <p className="text-xs text-[#5A6259]">
                        {[s.brand, new Date(s.scannedAt).toLocaleDateString()].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: ZONE_STYLE[z].soft, color: ZONE_STYLE[z].fg }}
                    >
                      {ZONE_STYLE[z].label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
