"use client"

// "Search a product": most people know a product by name, not by its ingredient list. Type-ahead
// over products we have a label for (the user's country's formulation first); picking one reads
// its label exactly as if it had been pasted.

import { useEffect, useRef, useState } from "react"
import { getPublicApiBase } from "@/lib/api"

export type FoundProduct = { id: string; name: string; brand: string; country: string | null; ingredientCount: number }

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${getPublicApiBase()}${path}`)
  if (!res.ok) throw new Error(String(res.status))
  const body = await res.json()
  return (body?.data ?? body) as T
}

/** The product's name as people say it: brand once, then the product. */
export function productTitle(p: { name: string; brand: string }) {
  return p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`
}

export function ProductSearch({ country, onPick }: { country: string | null; onPick: (title: string, inci: string) => void }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<FoundProduct[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [searched, setSearched] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    timer.current = setTimeout(() => {
      api<FoundProduct[]>(`/products/find?q=${encodeURIComponent(q.trim())}${country ? `&country=${country}` : ""}`)
        .then((r) => {
          setResults(r)
          setActive(0)
          setSearched(true)
          setOpen(true)
        })
        .catch(() => setResults([]))
    }, 200)
  }, [q, country])

  async function pick(p: FoundProduct) {
    setOpen(false)
    setQ(productTitle(p))
    const label = await api<{ inci: string }>(`/products/${encodeURIComponent(p.id)}/label`).catch(() => null)
    if (label?.inci) onPick(productTitle(p), label.inci)
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !results.length) return
          if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)))
          if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)))
          if (e.key === "Enter") (e.preventDefault(), pick(results[active]))
        }}
        placeholder="Search a product, e.g. Himalaya neem face wash"
        aria-label="Search a product"
        role="combobox"
        aria-expanded={open}
        aria-controls="product-results"
        aria-autocomplete="list"
        style={{
          width: "100%",
          minHeight: 52,
          padding: "0 16px",
          borderRadius: 14,
          border: "1.5px solid var(--line)",
          background: "var(--surface)",
          color: "var(--ink)",
          font: "inherit",
          fontSize: 17,
          outline: "none",
        }}
      />
      {open && (results.length > 0 || searched) && (
        <ul
          id="product-results"
          role="listbox"
          style={{ position: "absolute", zIndex: 20, left: 0, right: 0, top: "calc(100% + 6px)", margin: 0, padding: 6, listStyle: "none", borderRadius: 14, background: "var(--surface)", boxShadow: "0 12px 32px rgba(0,0,0,.14)", border: "1px solid var(--line)" }}
        >
          {results.length === 0 && <li style={{ padding: "12px 10px", fontSize: 15, color: "var(--ink2)" }}>Not in our list yet. Paste its ingredients below instead.</li>}
          {results.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => (e.preventDefault(), pick(p))}
              onMouseEnter={() => setActive(i)}
              style={{ padding: "10px 10px", borderRadius: 10, cursor: "pointer", background: i === active ? "var(--line)" : "transparent" }}
            >
              <div style={{ fontSize: 16 }}>{productTitle(p)}</div>
              <div style={{ fontSize: 13, color: "var(--ink2)" }}>
                {p.ingredientCount} ingredients{p.country ? ` · ${p.country} formula` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
