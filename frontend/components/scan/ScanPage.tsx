"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  ChevronRight,
  Clipboard,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"

const ZONE_CONFIG = {
  green: {
    bg: "#DFF0E4",
    border: "#1D5C3B",
    text: "#3a5030",
    badgeBg: "#1D5C3B",
    label: "GRN",
    Icon: CheckCircle2,
  },
  yellow: {
    bg: "#F7EDD8",
    border: "#7C5410",
    text: "#8a5a1a",
    badgeBg: "#7C5410",
    label: "YLW",
    Icon: AlertTriangle,
  },
  red: {
    bg: "#F8E5E1",
    border: "#8A2E22",
    text: "#8b2020",
    badgeBg: "#8A2E22",
    label: "RED",
    Icon: XCircle,
  },
} as const

type Zone = keyof typeof ZONE_CONFIG

const DEMO_RESULT = {
  total: 14,
  ingredients: [
    { name: "Water", zone: "green" as Zone, note: "Universally safe solvent" },
    { name: "Niacinamide", zone: "green" as Zone, note: "Brightening, pore-minimizing — excellent for Indian skin" },
    { name: "Glycerin", zone: "green" as Zone, note: "Humectant, draws moisture in" },
    { name: "Sodium Hyaluronate", zone: "green" as Zone, note: "Low-MW hyaluronic acid, deep hydration" },
    { name: "Cetearyl Alcohol", zone: "green" as Zone, note: "Fatty alcohol — thickens, not drying" },
    { name: "Tocopherol", zone: "green" as Zone, note: "Vitamin E — antioxidant, stable form" },
    { name: "Dimethicone", zone: "yellow" as Zone, note: "Silicone — occlusive in humid climates, may trap bacteria" },
    { name: "Phenoxyethanol", zone: "yellow" as Zone, note: "Preservative — safe at <1%, watch for sensitivity" },
    { name: "Disodium EDTA", zone: "yellow" as Zone, note: "Chelating agent — mild environmental concern" },
    { name: "Parfum", zone: "red" as Zone, note: "Undisclosed fragrance mix — top contact allergen in India" },
    { name: "Alcohol Denat.", zone: "red" as Zone, note: "Drying alcohol — disrupts barrier with daily use" },
  ],
}

const SAFER_SWAP = {
  name: "Minimalist Niacinamide 10% + Zinc 1%",
  brand: "Minimalist",
  price: "₹599",
  saving: "₹200 cheaper",
  reason: "No fragrance, no alcohol, no silicones",
  affiliateUrl: "#",
}

const LOCKED_FEATURES = [
  { Icon: Sparkles, label: "Find cheaper dupes with ≥80% ingredient overlap" },
  { Icon: AlertTriangle, label: "Detect ingredient conflicts across your routine" },
  { Icon: ShieldCheck, label: "Personalised scoring for your skin type & climate" },
  { Icon: Lock, label: "Pregnancy-safe mode & hormone-disruptor flags" },
]

const EXAMPLE =
  "Water, Niacinamide, Glycerin, Dimethicone, Sodium Hyaluronate, Cetearyl Alcohol, Tocopherol, Phenoxyethanol, Disodium EDTA, Parfum, Alcohol Denat."

export function ScanPage() {
  const [text, setText] = useState("")
  const [hasResult, setHasResult] = useState(false)
  const [isPasting, setIsPasting] = useState(false)

  const handleAnalyse = () => {
    if (text.trim().length < 5) return
    setHasResult(true)
  }

  const handleReset = () => {
    setText("")
    setHasResult(false)
  }

  const handlePaste = async () => {
    try {
      setIsPasting(true)
      const t = await navigator.clipboard.readText()
      setText(t)
    } catch {
      /* clipboard denied */
    } finally {
      setIsPasting(false)
    }
  }

  const red = DEMO_RESULT.ingredients.filter((i) => i.zone === "red").length
  const yellow = DEMO_RESULT.ingredients.filter((i) => i.zone === "yellow").length
  const green = DEMO_RESULT.ingredients.filter((i) => i.zone === "green").length

  return (
    <div className="mx-auto w-full max-w-lg pb-6">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <header className="mb-5 flex items-center justify-between">
        <h1 className="ouma-display text-xl font-bold text-[#17211A]">Scan</h1>
        {hasResult && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-full border border-[#DDE3DA] bg-white px-3 py-1.5 text-xs font-semibold text-[#5A6259] hover:text-[#17211A] transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New scan
          </button>
        )}
      </header>

      {/* ─── Input area ───────────────────────────────────────────── */}
      {!hasResult && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[#DDE3DA] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#DDE3DA] bg-[#FFFFFF] px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-[#17211A]">
                <ScanLine className="h-4 w-4 text-[#1D5C3B]" />
                Ingredient list
              </span>
              <button
                onClick={handlePaste}
                disabled={isPasting}
                className="flex items-center gap-1.5 rounded-lg bg-[#DFF0E4] px-3 py-1.5 text-xs font-bold text-[#1D5C3B] hover:bg-[#E4EBE2] transition"
              >
                <Clipboard className="h-3.5 w-3.5" />
                {isPasting ? "Pasting…" : "Paste"}
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder={
                "Paste from the back of your bottle, Nykaa product page, or photo OCR.\n\nExample: Water, Niacinamide, Glycerin, Phenoxyethanol…"
              }
              className="w-full resize-none px-4 py-4 text-sm text-[#17211A] placeholder-[#5A6259] outline-none"
            />
            <div className="flex items-center justify-between border-t border-[#DDE3DA] bg-[#FFFFFF] px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setText(EXAMPLE)}
                  className="text-xs font-semibold text-[#1D5C3B] hover:underline"
                >
                  Load example
                </button>
                <span className="text-[11px] text-[#5A6259]">
                  {text.split(",").filter((s) => s.trim()).length || 0} detected
                </span>
              </div>
              <button
                onClick={handleAnalyse}
                disabled={text.trim().length < 5}
                className="flex items-center gap-2 rounded-full bg-[#1D5C3B] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#3a5030] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ScanLine className="h-4 w-4" />
                Analyse
              </button>
            </div>
          </div>

          {/* Tip card */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#DDE3DA] bg-white p-4">
            <span className="mt-0.5 shrink-0 text-lg">💡</span>
            <div>
              <p className="text-sm font-bold text-[#17211A]">Where to find ingredients</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#5A6259]">
                On the product bottle (INCI list), or open the product on Nykaa/Amazon and scroll to &ldquo;Ingredients&rdquo;. Copy and paste here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Results ──────────────────────────────────────────────── */}
      {hasResult && (
        <div className="space-y-4">
          {/* Zone summary */}
          <div className="rounded-2xl border border-[#DDE3DA] bg-white p-5">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[#5A6259]">
              Analysis complete — {DEMO_RESULT.total} ingredients
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { zone: "red" as Zone, count: red, label: "Avoid" },
                { zone: "yellow" as Zone, count: yellow, label: "Caution" },
                { zone: "green" as Zone, count: green, label: "Safe" },
              ]).map(({ zone, count, label }) => {
                const z = ZONE_CONFIG[zone]
                const Icon = z.Icon
                return (
                  <div
                    key={zone}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border py-4"
                    style={{ background: z.bg, borderColor: z.border + "40" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: z.border }} />
                    <span className="text-2xl font-black" style={{ color: z.border }}>
                      {count}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: z.text }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RED alert */}
          {red > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-[#F8E5E1] border border-[#8A2E22]/30 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8A2E22]" />
              <div>
                <p className="text-sm font-black text-[#8b2020]">
                  {red} harmful ingredient{red > 1 ? "s" : ""} flagged
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#8A2E22]/80">
                  These are often hidden in products marketed as &lsquo;natural&rsquo; or &lsquo;Ayurvedic&rsquo; in India.
                </p>
              </div>
            </div>
          )}

          {/* Ingredient list */}
          <div className="overflow-hidden rounded-2xl border border-[#DDE3DA] bg-white">
            <div className="border-b border-[#DDE3DA] bg-[#FFFFFF] px-4 py-3">
              <p className="text-sm font-bold text-[#17211A]">Ingredient breakdown</p>
            </div>
            <div className="divide-y divide-[#DDE3DA]">
              {DEMO_RESULT.ingredients.map((ing) => {
                const z = ZONE_CONFIG[ing.zone]
                return (
                  <div
                    key={ing.name}
                    className="flex items-start gap-3 px-4 py-3.5"
                    style={{ borderLeft: `3px solid ${z.border}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#17211A]">{ing.name}</p>
                      <p className="mt-0.5 text-xs leading-snug text-[#5A6259]">{ing.note}</p>
                    </div>
                    <span
                      className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-black text-white"
                      style={{ background: z.badgeBg }}
                    >
                      {z.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Safer swap (affiliate) */}
          {red > 0 && (
            <div className="rounded-2xl border border-[#1D5C3B]/20 bg-[#DFF0E4] p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#3a5030]">
                SkinLens Recommends
              </p>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1D5C3B]/15 text-2xl">
                  🌿
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#3a5030]">{SAFER_SWAP.name}</p>
                  <p className="text-[11px] text-[#1D5C3B] mt-0.5">{SAFER_SWAP.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-base font-black text-[#1D5C3B]">{SAFER_SWAP.price}</span>
                    <span className="rounded-full bg-[#1D5C3B] px-2 py-0.5 text-[9px] font-black text-white">
                      {SAFER_SWAP.saving}
                    </span>
                  </div>
                </div>
              </div>
              <a
                href={SAFER_SWAP.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#1D5C3B] py-3 text-sm font-bold text-white no-underline hover:bg-[#3a5030] transition"
              >
                <ExternalLink className="h-4 w-4" />
                Shop on Nykaa
              </a>
              <p className="mt-2 text-center text-[10px] text-[#1D5C3B]/60">
                Affiliate link · we earn a small commission
              </p>
            </div>
          )}

          {/* Premium paywall gate */}
          <div className="overflow-hidden rounded-2xl border border-[#DDE3DA] bg-white">
            <div className="bg-[#3a5030] px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-white/60" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                  Pro — unlock the full picture
                </p>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                Your scan is complete. Now find out what to <em>do</em> about it.
              </p>
            </div>
            <ul className="px-5 py-4 space-y-3">
              {LOCKED_FEATURES.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-[#2A342C]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DFF0E4]">
                    <Icon className="h-4 w-4 text-[#1D5C3B]" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
            <div className="px-5 pb-5 flex flex-col gap-2.5">
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 rounded-full bg-[#1D5C3B] py-3.5 text-sm font-black text-white no-underline shadow-sm hover:bg-[#3a5030] transition"
              >
                Start 7-day free trial
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="flex items-center justify-center rounded-full border border-[#DDE3DA] py-3 text-sm font-semibold text-[#5A6259] no-underline hover:bg-[#FFFFFF] transition"
              >
                See plans — from ₹79/mo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
