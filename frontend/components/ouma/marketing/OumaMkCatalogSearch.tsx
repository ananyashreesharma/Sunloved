"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, Loader2, Search } from "lucide-react"
import { browseProducts, checkApiReachable, searchProducts, type ProductDetail } from "@/lib/api"

const DEBOUNCE_MS = 320

function previewLine(p: ProductDetail): string[] {
  if (p.matchedIngredients?.length) return p.matchedIngredients.slice(0, 5)
  if (p.ingredientPreview?.length) return p.ingredientPreview.slice(0, 5)
  if (p.actives?.length) return p.actives.slice(0, 5)
  return []
}

export function OumaMkCatalogSearch() {
  const [q, setQ] = useState("")
  const [debounced, setDebounced] = useState("")
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [rows, setRows] = useState<ProductDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [searchErr, setSearchErr] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const ok = await checkApiReachable()
      if (!cancelled) setApiOk(ok)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (debounced.length === 0) {
      setLoading(true)
      ;(async () => {
        try {
          const r = await browseProducts(1, 8, "", undefined)
          if (!cancelled) {
            setRows((r.products || []) as ProductDetail[])
            setSearchErr(null)
          }
        } catch (e) {
          if (!cancelled) {
            setRows([])
            setSearchErr(e instanceof Error ? e.message : "Could not load catalog")
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
      return () => {
        cancelled = true
      }
    }

    if (debounced.length === 1) {
      return () => {}
    }

    setLoading(true)
    ;(async () => {
      try {
        const r = await searchProducts(debounced, 1, 12)
        if (!cancelled) {
          setRows((r.products || []) as ProductDetail[])
          setSearchErr(null)
        }
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setSearchErr(e instanceof Error ? e.message : "Search failed")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debounced])

  return (
    <section
      id="catalog-search"
      className="ouma-container border-t border-[#ede9e4] pb-14 pt-12"
      aria-labelledby="catalog-search-heading"
    >
      <div className="mx-auto max-w-lg text-center md:max-w-2xl">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#DFF0E4] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3a5030]">
          Browse catalog · Free
        </div>
        <h2
          id="catalog-search-heading"
          className="ouma-display text-xl font-semibold text-[#17211A] sm:text-2xl"
        >
          Search 500+ Indian products
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5A6259]">
          Search by product name, brand, or ingredient. Full ingredient analysis requires a free account.
        </p>

        {apiOk === false ? (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#5A6259]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#7C5410]" aria-hidden />
            Catalog unavailable — backend is offline. Try the live demo above.
          </div>
        ) : null}

        <div className="relative mx-auto mt-8 max-w-xl">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5A6259]"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. niacinamide, cleanser, glycerin…"
            className="w-full rounded-2xl border-2 border-[#DDE3DA] bg-white py-3.5 pl-12 pr-12 text-[15px] text-[#17211A] shadow-sm outline-none transition-colors placeholder:text-[#5A6259] focus:border-[#1D5C3B]"
            autoComplete="off"
            aria-label="Search products and ingredients"
          />
          {loading ? (
            <Loader2
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#1D5C3B]"
              aria-hidden
            />
          ) : null}
        </div>

        {debounced.length === 1 ? (
          <p className="mt-3 text-xs text-[#5A6259]">Type at least 2 characters to search.</p>
        ) : null}

        {searchErr ? (
          <p className="mt-4 text-sm text-[#8A2E22]">{searchErr}</p>
        ) : null}

        {rows.length > 0 && debounced.length >= 2 ? (
          <p className="mt-3 text-xs text-[#5A6259]">
            {rows.length} result{rows.length !== 1 ? "s" : ""} · Sorted by relevance
          </p>
        ) : null}
      </div>

      <ul className="mx-auto mt-8 grid max-w-lg list-none gap-3 md:max-w-2xl">
        {rows.map((p) => {
          const prev = previewLine(p)
          return (
            <li
              key={p.id}
              className="rounded-2xl border border-[#DDE3DA] bg-[#FFFFFF] p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex gap-3">
                <div
                  className="h-16 w-16 shrink-0 rounded-xl bg-[#ede9e4] bg-cover bg-center"
                  style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#17211A]">{p.name}</p>
                      <p className="text-sm text-[#5A6259]">{p.brand}</p>
                    </div>
                    {p.matchScore != null ? (
                      <span className="shrink-0 rounded-full bg-[#e8f5ef] px-2.5 py-0.5 text-xs font-bold text-[#1D5C3B]">
                        {p.matchScore}% match
                      </span>
                    ) : null}
                  </div>
                  {p.category ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#1D5C3B]">{p.category}</p>
                  ) : null}
                  {prev.length > 0 ? (
                    <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-relaxed text-[#2A342C]">
                      {prev.join(" · ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-[#5A6259]">No ingredient list in catalog yet.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/login?next=/app/scan/result?productId=${encodeURIComponent(p.id)}`}
                      className="rounded-lg bg-[#1D5C3B] px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-[#3a5030]"
                    >
                      Full analysis (free →)
                    </Link>
                    <Link
                      href={`/login?next=/app/discover/swap/${encodeURIComponent(p.id)}`}
                      className="rounded-lg border border-[#DDE3DA] bg-white px-3 py-1.5 text-xs font-semibold text-[#2A342C] no-underline hover:border-[#1D5C3B] hover:text-[#1D5C3B]"
                    >
                      Safer swaps
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {debounced.length >= 2 && !loading && rows.length === 0 && !searchErr ? (
        <p className="mt-6 text-center text-sm text-[#5A6259]">No products matched — try another spelling or INCI.</p>
      ) : null}
    </section>
  )
}
