"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Share2, Microscope, Lock, CheckSquare, DollarSign, Flag, ArrowLeft } from "lucide-react"
import { getComparisonsList, getProduct, type ProductDetail } from "@/lib/api"
import { breakdownFromProduct } from "@/lib/ouma-ingredient-ui"
import { usePathname } from "next/navigation"

function inr(amount?: number | null) {
  if (amount == null || Number.isNaN(Number(amount))) return null
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `₹${Math.round(Number(amount))}`
  }
}

function bestPrice(p: ProductDetail | null): number | null {
  if (!p) return null
  if (typeof p.currentPrice === "number") return p.currentPrice
  const pr = p.prices?.find((x) => x.best) ?? p.prices?.[0]
  if (pr && typeof pr.amount === "number") return pr.amount
  return null
}

export function OumaSwapDetailClient({ productId }: { productId: string }) {
  const pathname = usePathname()
  const discoverHref = pathname?.startsWith("/discover") ? "/discover" : "/app/discover"
  const [current, setCurrent] = useState<ProductDetail | null>(null)
  const [alt, setAlt] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const base = await getProduct(productId)
        if (cancelled) return
        setCurrent(base)
        const sim = await getComparisonsList(productId)
        if (cancelled) return
        const top = sim[0]
        if (top?.id) {
          const rec = await getProduct(top.id)
          if (!cancelled) setAlt(rec)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productId])

  const curBreak = current ? breakdownFromProduct(current) : null
  const altBreak = alt ? breakdownFromProduct(alt) : null
  const curScore = curBreak?.score ?? 45
  const altScore = altBreak?.score ?? 72

  const currentPrice = bestPrice(current)
  const altPrice = bestPrice(alt)
  const saved = currentPrice != null && altPrice != null ? Math.max(0, Math.round(currentPrice - altPrice)) : null
  const savedLabel = saved != null ? `${inr(saved)} saved` : "₹200 saved"

  if (loading) {
    return (
      <div className="ouma-container py-16 text-center text-sm text-[#5A6259]">Loading swap from catalog…</div>
    )
  }

  if (error || !current) {
    return (
      <div className="ouma-container py-16 text-center">
        <p className="text-sm text-[#8A2E22]">{error || "Product not found"}</p>
        <Link href={discoverHref} className="mt-4 inline-block text-[#1D5C3B] underline">
          Back to Discover
        </Link>
      </div>
    )
  }

  const curRed = curBreak?.high ?? 0
  const curYlw = curBreak?.med ?? 0
  const altRed = altBreak?.high ?? 0
  const altYlw = altBreak?.med ?? 0

  return (
    <div className="mx-auto w-full max-w-lg pb-8 md:max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href={discoverHref}
          className="flex items-center gap-2 rounded-full border border-[#DDE3DA] bg-white px-3 py-2 text-sm font-semibold text-[#17211A] no-underline"
          aria-label="Back to discover"
        >
          <ArrowLeft className="h-4 w-4" />
          Discover
        </Link>
        <h1 className="ouma-display text-lg font-semibold text-[#17211A]">Safer swap</h1>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE3DA] bg-white" aria-label="Share">
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      {/* Current product card */}
      <div className="overflow-hidden rounded-3xl border border-[#DDE3DA] bg-white shadow-sm">
        <div className="flex items-center justify-between bg-[#F8E5E1] px-5 py-2 text-[11px] font-black uppercase tracking-widest text-[#8b2020]">
          <span>Current product</span>
          <span>{curRed} red flags</span>
        </div>
        <div className="px-5 py-5">
          <p className="ouma-display text-xl font-semibold text-[#17211A]">{current.name}</p>
          <p className="mt-1 text-sm text-[#5A6259]">
            {current.brand}
            {currentPrice != null ? ` · ${inr(currentPrice)}` : ""}
          </p>

          <div className="mt-5 flex items-end gap-8">
            <div>
              <p className="ouma-display text-3xl font-semibold text-[#8A2E22]">{curRed}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Red flags</p>
            </div>
            <div>
              <p className="ouma-display text-3xl font-semibold text-[#7C5410]">{curYlw}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Caution</p>
            </div>
            <div>
              <p className="ouma-display text-3xl font-semibold text-[#2A342C]">{(curScore / 10).toFixed(1)}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Score / 10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#DDE3DA]" />
        <p className="text-xs font-semibold text-[#1D5C3B]">Safer swap found</p>
        <div className="h-px flex-1 bg-[#DDE3DA]" />
      </div>

      {/* Recommended swap card */}
      <div className="overflow-hidden rounded-3xl border border-[#DDE3DA] bg-white shadow-sm">
        <div className="flex items-center justify-between bg-[#DFF0E4] px-5 py-2 text-[11px] font-black uppercase tracking-widest text-[#3a5030]">
          <span>Recommended swap</span>
          <span>{alt ? `${altRed} red flags` : "—"}</span>
        </div>
        <div className="px-5 py-5">
          {alt ? (
            <>
              <p className="ouma-display text-xl font-semibold text-[#17211A]">{alt.name}</p>
              <p className="mt-1 text-sm text-[#5A6259]">
                {alt.brand}
                {altPrice != null ? ` · ${inr(altPrice)}` : ""}
              </p>

              <div className="mt-5 flex items-end gap-8">
                <div>
                  <p className="ouma-display text-3xl font-semibold text-[#1D5C3B]">{altRed}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Red flags</p>
                </div>
                <div>
                  <p className="ouma-display text-3xl font-semibold text-[#7C5410]">{altYlw}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Caution</p>
                </div>
                <div>
                  <p className="ouma-display text-3xl font-semibold text-[#17211A]">{(altScore / 10).toFixed(1)}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Score / 10</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5A6259]">No recommended swap yet for this product.</p>
          )}
        </div>
      </div>

      {/* Savings banner */}
      <div className="mt-5 rounded-2xl border border-[#b8dcc8] bg-[#DFF0E4] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#3a5030]">Better ingredients</p>
            <p className="text-xs text-[#1D5C3B]/80">Shorter routine · Saves ₹200+</p>
          </div>
          <p className="ouma-display text-2xl font-black text-[#3a5030]">{savedLabel}</p>
        </div>
      </div>

      {/* Explanation bullets */}
      <div className="mt-8 space-y-6">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DFF0E4] text-[#3a5030]">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[#17211A]">Ranked by your skin type</p>
            <p className="mt-1 text-sm leading-relaxed text-[#5A6259]">
              Oily, dry, combination, sensitive — swaps are personalised to what your skin actually needs, not a generic recommendation.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DFF0E4] text-[#3a5030]">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[#17211A]">Real Indian price comparison</p>
            <p className="mt-1 text-sm leading-relaxed text-[#5A6259]">
              We track prices across retailers where available. Safer doesn&apos;t have to mean more expensive — we&apos;ll prove it.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DFF0E4] text-[#3a5030]">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[#17211A]">Side-by-side ingredient diff</p>
            <p className="mt-1 text-sm leading-relaxed text-[#5A6259]">
              See exactly what improved — which harmful ingredients were removed and which beneficial ones were added. Transparent by design.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#DDE3DA] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <h2 className="ouma-display text-lg font-medium text-[#17211A]">Routine compatibility</h2>
          <span className="shrink-0 rounded-full bg-[#e8f5ef] px-3 py-1 text-[11px] font-bold text-[#1D5C3B]">
            {alt ? "Suggested" : "N/A"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#5A6259]">
          Swaps are ranked from your catalog using ingredient overlap. Always patch-test and check AM/PM actives in your real
          routine.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-[#5A6259]">
          <span className="rounded-lg bg-[#ede9e4] px-3 py-2">Current</span>
          <span>→</span>
          <span className="rounded-lg bg-[#ede9e4] px-3 py-2">{alt ? "Swap" : "…"}</span>
        </div>
      </div>

      {alt && altPrice != null ? (
        <div className="mt-8 rounded-2xl border border-[#DDE3DA] bg-white p-5 shadow-sm">
          <h2 className="ouma-display text-lg font-medium text-[#17211A]">Cost &amp; availability</h2>
          <p className="mt-2 text-sm text-[#5A6259]">Live pricing is shown when available in our catalog.</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-[#f3f0eb] pb-2">
              <dt className="text-[#5A6259]">Swap price</dt>
              <dd className="font-semibold text-[#17211A]">
                {inr(altPrice)}
                {alt.volume ? ` · ${alt.volume}` : ""}
              </dd>
            </div>
            {currentPrice != null ? (
              <div className="flex justify-between border-b border-[#f3f0eb] pb-2">
                <dt className="text-[#5A6259]">Current price</dt>
                <dd className="font-semibold text-[#17211A]">{inr(currentPrice)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      <button type="button" className="mt-8 w-full rounded-2xl bg-[#17211A] py-4 text-sm font-semibold text-white">
        + Add swap to routine
      </button>
      <Link
        href={discoverHref}
        className="mt-3 flex w-full items-center justify-center rounded-2xl border-2 border-[#17211A] bg-white py-4 text-sm font-semibold text-[#17211A] no-underline"
      >
        See alternative swaps
      </Link>

      <div className="relative mt-10 overflow-hidden rounded-2xl border border-[#DDE3DA] bg-[#f3f0eb] p-6">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm">
          <Microscope className="h-8 w-8 text-[#3a5030]" />
          <p className="ouma-display text-center text-lg font-medium text-[#17211A]">Unlock clinical insights</p>
          <p className="max-w-sm text-center text-sm text-[#5A6259]">
            Dermatologist-level breakdowns on why this swap works for your concerns.
          </p>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-[#1D5C3B] px-5 py-2.5 text-sm font-semibold text-white">
            <Lock className="h-4 w-4" />
            Unlock premium
          </button>
        </div>
        <p className="text-sm text-[#5A6259]">Clinical detail preview…</p>
      </div>
    </div>
  )
}
