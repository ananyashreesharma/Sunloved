"use client"

// V3 My products (web): every step, grouped by when it's used, with whether its label has been
// checked (matched by name against checks saved in this browser). Click one to edit it.

import Link from "next/link"
import { useEffect, useState } from "react"
import { stepKind, type GuestScan, type StepFrequency, type StepKind } from "@skinlens/shared"
import { getRoutine } from "@/lib/api"
import { getGuestScans, loadGuestData } from "@/lib/guest-store"
import { useIsGuest } from "@/lib/use-guest"

type Item = { id: string; name: string; frequency: StepFrequency; kind: StepKind | null; when: "morning" | "night" | "both" }

const KIND: Record<StepKind, string> = {
  cleanse: "Cleanse",
  exfoliate: "Exfoliate",
  serum: "Serum",
  treat: "Treat",
  moisturise: "Moisturise",
  seal: "Seal",
  sunscreen: "Sunscreen",
}
const FREQ: Record<StepFrequency, string> = { daily: "Daily", alternate: "Every other day", twice_weekly: "Twice a week" }

export function ProductsPage() {
  const isGuest = useIsGuest()
  const [items, setItems] = useState<Item[] | null>(null)
  const [scans, setScans] = useState<GuestScan[]>([])

  useEffect(() => {
    setScans(getGuestScans())
    if (isGuest) {
      setItems(loadGuestData().steps.map((s) => ({ id: s.id, name: s.name, frequency: s.frequency, kind: s.kind ?? stepKind(s.name), when: s.when })))
      return
    }
    Promise.all([getRoutine("morning"), getRoutine("night")])
      .then(([m, n]) => {
        const toItem = (when: Item["when"]) => (s: (typeof m.steps)[number]) => ({ id: s.id, name: s.name, frequency: s.frequency, kind: stepKind(s.name), when })
        setItems([...m.steps.map(toItem("morning")), ...n.steps.map(toItem("night"))])
      })
      .catch(() => setItems([]))
  }, [isGuest])

  function status_(name: string): { text: string; color: string | null } {
    const scan = scans.find((s) => s.title.trim().toLowerCase() === name.trim().toLowerCase())
    if (!scan) return { text: "Not checked", color: null }
    if (scan.verdict === "GREEN") return { text: "Checked · looks fine", color: "var(--hi-fine)" }
    if (scan.verdict === "YELLOW") return { text: "Checked · caution", color: "var(--hi-caution)" }
    if (scan.verdict === "RED") return { text: "Checked · avoid", color: "var(--hi-avoid)" }
    return { text: "Checked · no verdict", color: "var(--ink3)" }
  }

  const groups = items
    ? ([
        ["Morning", items.filter((i) => i.when === "morning")],
        ["Night", items.filter((i) => i.when === "night")],
        ["Morning and night", items.filter((i) => i.when === "both")],
      ] as const).filter(([, list]) => list.length > 0)
    : []

  return (
    <div>
      <Link href="/app/profile" style={{ fontSize: 15, color: "var(--ink2)", textDecoration: "none" }}>
        ← Me
      </Link>
      <h1 style={{ margin: "12px 0 0", fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>My products</h1>
      {items && groups.length === 0 && <p style={{ fontSize: 17, color: "var(--ink2)" }}>Nothing in your routine yet.</p>}
      {groups.map(([label, list]) => (
        <section key={label} style={{ marginTop: 26 }}>
          <h2 className="v3-label" style={{ margin: 0 }}>
            {label}
          </h2>
          <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
            {list.map((it) => {
              const st = status_(it.name)
              return (
                <li key={it.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <Link href={`/app/routine/edit?id=${it.id}`} style={{ minHeight: 64, padding: "10px 0", display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 17, fontWeight: 500 }}>{it.name}</span>
                      <span style={{ display: "block", marginTop: 2, fontSize: 13, color: "var(--ink2)" }}>
                        {it.kind ? `${KIND[it.kind]} · ` : ""}
                        {FREQ[it.frequency]}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink2)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, ...(st.color ? { background: st.color } : { border: "1.5px solid var(--ink3)" }) }} />
                      {st.text}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <Link href="/app/routine/add" className="v3-btn" style={{ marginTop: 28, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
        Add a product
      </Link>
    </div>
  )
}
