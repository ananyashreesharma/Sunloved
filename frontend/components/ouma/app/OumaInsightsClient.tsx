"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Lock, Download, AlertTriangle, CheckCircle2 } from "lucide-react"
import { fetchInsightsSummary, type InsightsSummaryResponse } from "@/lib/api"

const MOCK_TREND = [42, 55, 48, 62, 58, 71, 67, 74, 68, 79, 82, 85]
const MOCK_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const CURRENT_MONTH = new Date().getMonth()

const TOP_RED_FLAGS = [
  { name: "Parfum / Fragrance", count: 8, note: "Found in 73% of your scanned products" },
  { name: "Alcohol Denat.", count: 5, note: "Drying alcohol in 5 of your scanned products" },
  { name: "Phenoxyethanol", count: 4, note: "Common preservative — watch concentration" },
]

const STAT_CARDS = [
  { label: "Products scanned", value: "23", change: "+5 this month", up: true },
  { label: "Safety score avg", value: "6.4", change: "+1.2 vs last month", up: true },
  { label: "Red flags found", value: "14", change: "-3 vs last month", up: true },
  { label: "Safer swaps made", value: "3", change: "Saved ~₹450", up: true },
]

export function OumaInsightsClient() {
  const [summary, setSummary] = useState<InsightsSummaryResponse | null>(null)
  const [period, setPeriod] = useState<"30d" | "90d">("30d")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await fetchInsightsSummary()
        if (!cancelled) setSummary(s)
      } catch {
        /* use mock data */
      }
    })()
    return () => { cancelled = true }
  }, [])

  const avgScore =
    summary?.avgProductScore != null ? Number(summary.avgProductScore).toFixed(1) : "6.4"

  const visibleMonths = MOCK_TREND.slice(0, CURRENT_MONTH + 1)
  const maxVal = Math.max(...visibleMonths)

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 pb-6">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <header className="flex items-center justify-between pt-1">
        <h1 className="ouma-display text-xl font-bold text-[#17211A]">Insights</h1>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-[#DDE3DA] bg-white">
            {(["30d", "90d"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  period === p ? "bg-[#1D5C3B] text-white" : "text-[#5A6259]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DDE3DA] bg-white text-[#5A6259]"
            aria-label="Download report"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─── Stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="rounded-2xl border border-[#DDE3DA] bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6259] mb-1">
              {card.label}
            </p>
            <p className="ouma-display text-3xl font-black text-[#17211A]">{card.value}</p>
            <div className="mt-1 flex items-center gap-1">
              {card.up ? (
                <TrendingUp className="h-3 w-3 text-[#1D5C3B]" />
              ) : (
                <TrendingDown className="h-3 w-3 text-[#8A2E22]" />
              )}
              <span className="text-[10px] font-semibold text-[#5A6259]">{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Safety score trend ───────────────────────────────────── */}
      <div className="rounded-2xl border border-[#DDE3DA] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6259]">Safety score</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="ouma-display text-3xl font-black text-[#1D5C3B]">{avgScore}</span>
              <span className="text-sm text-[#5A6259]">/10</span>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#DFF0E4] px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#1D5C3B]" />
            <span className="text-xs font-bold text-[#3a5030]">+1.2 this month</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1 h-24">
          {visibleMonths.map((val, i) => {
            const height = (val / maxVal) * 100
            const isLast = i === visibleMonths.length - 1
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${height}%`,
                    background: isLast ? "#1D5C3B" : "#DFF0E4",
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between px-1">
          {visibleMonths.map((_, i) => (
            <span key={i} className="text-[9px] font-semibold text-[#5A6259] flex-1 text-center">
              {i % 3 === 0 ? MOCK_MONTHS[i].slice(0, 1) : ""}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-center text-[#5A6259]">
          Your routine is getting safer every month. 💚
        </p>
      </div>

      {/* ─── Top red flags ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#DDE3DA] bg-white overflow-hidden">
        <div className="border-b border-[#DDE3DA] bg-[#FFFFFF] px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#8A2E22]" />
          <p className="text-sm font-bold text-[#17211A]">Your top red flags</p>
        </div>
        <div className="divide-y divide-[#DDE3DA]">
          {TOP_RED_FLAGS.map((flag) => (
            <div
              key={flag.name}
              className="flex items-start gap-3 px-4 py-3.5"
              style={{ borderLeft: "3px solid #8A2E22" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#17211A]">{flag.name}</p>
                <p className="text-xs text-[#5A6259] mt-0.5">{flag.note}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#8A2E22] px-2 py-0.5 text-[9px] font-black text-white">
                {flag.count}×
              </span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-[#DDE3DA]">
          <Link
            href="/app/scan"
            className="flex items-center gap-2 text-sm font-bold text-[#1D5C3B] no-underline hover:underline"
          >
            <CheckCircle2 className="h-4 w-4" />
            Scan products to improve your score
          </Link>
        </div>
      </div>

      {/* ─── Catalogue insights ───────────────────────────────────── */}
      {summary && (
        <div className="rounded-2xl border border-[#DDE3DA] bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6259] mb-3">
            SkinLens Catalog
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F3F5EF] p-3 text-center">
              <p className="ouma-display text-2xl font-black text-[#17211A]">
                {summary.catalogProducts?.toLocaleString() ?? "—"}
              </p>
              <p className="text-[10px] font-semibold text-[#5A6259]">Products analysed</p>
            </div>
            <div className="rounded-xl bg-[#F3F5EF] p-3 text-center">
              <p className="ouma-display text-2xl font-black text-[#17211A]">
                {summary.avgProductScore != null
                  ? Number(summary.avgProductScore).toFixed(1)
                  : "—"}
              </p>
              <p className="text-[10px] font-semibold text-[#5A6259]">Avg safety score</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Premium lock ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#3a5030] p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-white/60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Pro Insights</p>
        </div>
        <h3 className="ouma-display text-lg font-bold mb-1">Weekly skin safety report</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          Get a personalised PDF report every week with ingredient trends, routine conflicts, and swap recommendations — delivered to your WhatsApp.
        </p>
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-[#3a5030] no-underline hover:bg-[#f0faf6] transition"
        >
          Unlock Pro Insights
        </Link>
      </div>
    </div>
  )
}
