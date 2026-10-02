"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { usePathname } from "next/navigation"
import { breakdownFromProduct, formatPrice, verdictFor, type ProductComparison } from "@skinlens/shared"
import { createRoutineStep, getComparisonsList, getProduct, type ProductDetail } from "@/lib/api"
import { addGuestStep } from "@/lib/guest-store"
import { useIsGuest } from "@/lib/use-guest"

// Shows only what the catalogue actually knows. This screen used to fill gaps with invented
// numbers ("₹200 saved", scores of 4.5 vs 7.2), claim swaps were "ranked by your skin type", and
// tease a premium unlock — none of which existed.

function bestPrice(p: ProductDetail | null): number | null {
  if (!p) return null
  if (typeof p.currentPrice === "number") return p.currentPrice
  const pr = p.prices?.find((x) => x.best) ?? p.prices?.[0]
  return pr && typeof pr.amount === "number" ? pr.amount : null
}

function ProductCard({ product, label, tone }: { product: ProductDetail; label: string; tone: "current" | "swap" }) {
  const bd = breakdownFromProduct(product)
  const judged = verdictFor(bd) !== null
  const price = formatPrice(bestPrice(product), product.currency)
  const band = tone === "current" ? "bg-[#F8E5E1] text-[#8b2020]" : "bg-[#DFF0E4] text-[#3a5030]"
  return (
    <div className="overflow-hidden rounded-3xl border border-[#DDE3DA] bg-white shadow-sm">
      <div className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest ${band}`}>{label}</div>
      <div className="px-5 py-5">
        <p className="ouma-display text-xl font-semibold text-[#17211A]">{product.name}</p>
        <p className="mt-1 text-sm text-[#5A6259]">
          {product.brand}
          {price ? ` · ${price}` : ""}
          {product.volume ? ` · ${product.volume}` : ""}
        </p>
        {judged ? (
          <div className="mt-5 flex items-end gap-8">
            <div>
              <p className="ouma-display text-3xl font-semibold text-[#8A2E22]">{bd.high}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Avoid</p>
            </div>
            <div>
              <p className="ouma-display text-3xl font-semibold text-[#7C5410]">{bd.med}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Caution</p>
            </div>
            <div>
              <p className="ouma-display text-3xl font-semibold text-[#1D5C3B]">{bd.safe}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A6259]">Fine</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#5A6259]">We don&apos;t have this product&apos;s full ingredient list yet.</p>
        )}
      </div>
    </div>
  )
}

export function OumaSwapDetailClient({ productId }: { productId: string }) {
  const pathname = usePathname()
  const discoverHref = pathname?.startsWith("/discover") ? "/discover" : "/app/discover"
  const isGuest = useIsGuest()
  const [current, setCurrent] = useState<ProductDetail | null>(null)
  const [match, setMatch] = useState<ProductComparison | null>(null)
  const [alt, setAlt] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addState, setAddState] = useState<"idle" | "saving" | "saved" | "failed">("idle")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const base = await getProduct(productId)
        if (cancelled) return
        setCurrent(base)
        // Only a candidate the backend confirmed is safer counts as a "safer swap".
        // A product we can't compare (e.g. no ingredient list) just has no swap — not an error.
        const candidates = await getComparisonsList(productId).catch(() => [] as ProductComparison[])
        const top = candidates.find((c) => c.safer) ?? null
        if (cancelled) return
        setMatch(top)
        if (top) {
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

  async function addToRoutine() {
    if (!alt) return
    setAddState("saving")
    try {
      if (isGuest) addGuestStep({ name: alt.name, when: "both", frequency: "daily", productId: alt.id, brand: alt.brand })
      else await createRoutineStep({ type: "both", productId: alt.id, frequency: "daily" })
      setAddState("saved")
    } catch {
      setAddState("failed")
    }
  }

  if (loading) {
    return <div className="ouma-container py-16 text-center text-sm text-[#5A6259]">Looking for a safer swap…</div>
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

  const currentPrice = bestPrice(current)
  const altPrice = bestPrice(alt)
  const saved = currentPrice != null && altPrice != null && altPrice < currentPrice ? currentPrice - altPrice : null

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
        <span className="w-10" aria-hidden />
      </header>

      <ProductCard product={current} label="Current product" tone="current" />

      {alt && match ? (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#DDE3DA]" />
            <p className="text-xs font-semibold text-[#1D5C3B]">Safer swap found</p>
            <div className="h-px flex-1 bg-[#DDE3DA]" />
          </div>

          <ProductCard product={alt} label="Suggested swap" tone="swap" />

          <div className="mt-5 rounded-2xl border border-[#DDE3DA] bg-white px-5 py-4 text-sm leading-relaxed text-[#2A342C]">
            <p>
              Same category, fewer flagged ingredients
              {match.sharedActives?.length ? `, and it shares ${match.sharedActives.slice(0, 3).join(", ")}` : ""}.
              {saved != null ? ` It also costs ${formatPrice(saved, alt.currency)} less.` : ""}
            </p>
            <p className="mt-2 text-xs text-[#5A6259]">
              Matched on ingredients only — patch-test before switching, and check it fits your skin.
            </p>
          </div>

          <button
            type="button"
            onClick={addToRoutine}
            disabled={addState === "saving" || addState === "saved"}
            className="mt-8 w-full rounded-2xl bg-[#17211A] py-4 text-sm font-semibold text-white disabled:opacity-70"
          >
            {addState === "saved"
              ? "Added to your routine ✓"
              : addState === "saving"
                ? "Adding…"
                : addState === "failed"
                  ? "Couldn't add — try again"
                  : "+ Add swap to routine"}
          </button>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-[#DDE3DA] bg-white px-5 py-5 text-sm text-[#2A342C]">
          We haven&apos;t found a safer product in the same category yet. As the catalogue grows, swaps will show up here.
        </div>
      )}

      <Link
        href={discoverHref}
        className="mt-3 flex w-full items-center justify-center rounded-2xl border-2 border-[#17211A] bg-white py-4 text-sm font-semibold text-[#17211A] no-underline"
      >
        Back to Discover
      </Link>
    </div>
  )
}
