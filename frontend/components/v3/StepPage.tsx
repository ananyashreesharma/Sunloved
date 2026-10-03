"use client"

// V3 step page (web): add a step or edit one, with a live line saying where it lands. Same fields
// as the mobile sheet. Guests keep everything in this browser; accounts save to the server (where
// a step's morning/night can't change after it's made, so that choice only shows when adding).

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { STEP_KINDS, stepKind, stepNeighbours, type GuestData, type StepFrequency, type StepKind } from "@skinlens/shared"
import { createRoutineStep, deleteRoutineStep, getRoutine, updateRoutineStep } from "@/lib/api"
import { addGuestStep, loadGuestData, removeGuestStep, updateGuestStep } from "@/lib/guest-store"
import { useIsGuest } from "@/lib/use-guest"

type When = "morning" | "night" | "both"
const KIND: Record<StepKind, string> = {
  cleanse: "Cleanse",
  exfoliate: "Exfoliate",
  serum: "Serum",
  treat: "Treat",
  moisturise: "Moisturise",
  seal: "Seal",
  sunscreen: "Sunscreen",
}

function Segmented<V extends string>({ value, onChange, options, label }: { value: V; onChange: (v: V) => void; options: [V, string][]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "flex", gap: 4, padding: 3, borderRadius: 16, background: "var(--line)" }}>
      {options.map(([v, text]) => (
        <button
          key={v}
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 13,
            border: "none",
            background: v === value ? "var(--bg)" : "transparent",
            color: "var(--ink)",
            font: "inherit",
            fontSize: 15,
            fontWeight: v === value ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

export function StepPage({ id, initialType, initialName }: { id?: string; initialType?: string; initialName?: string }) {
  const router = useRouter()
  const isGuest = useIsGuest()
  const editing = !!id
  const [guest, setGuest] = useState<GuestData | null>(null)
  const [name, setName] = useState(initialName ?? "")
  const [kind, setKind] = useState<StepKind | null>(null)
  const [kindPicked, setKindPicked] = useState(false)
  const [when, setWhen] = useState<When>(initialType === "morning" ? "morning" : "night")
  const [frequency, setFrequency] = useState<StepFrequency>("daily")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isGuest) {
      const g = loadGuestData()
      setGuest(g)
      if (!id) return
      const s = g.steps.find((x) => x.id === id)
      if (!s) return setNotFound(true)
      setName(s.name)
      setWhen(s.when)
      setFrequency(s.frequency)
      if (s.kind) {
        setKind(s.kind)
        setKindPicked(true)
      }
      return
    }
    if (!id) return
    // Accounts: find the step in either routine.
    Promise.all([getRoutine("morning"), getRoutine("night")])
      .then(([m, n]) => {
        const hit = m.steps.find((s) => s.id === id) ?? n.steps.find((s) => s.id === id)
        if (!hit) return setNotFound(true)
        setName(hit.name)
        setFrequency(hit.frequency)
        setWhen(m.steps.some((s) => s.id === id) ? "morning" : "night")
      })
      .catch(() => setNotFound(true))
  }, [id, isGuest])

  const effectiveKind = kindPicked ? kind : stepKind(name)

  const goes = useMemo(() => {
    if (!guest || !name.trim()) return ""
    const n = stepNeighbours(guest, when === "morning" ? "morning" : "night", { name: name.trim(), kind: effectiveKind ?? undefined }, id)
    if (n.after && n.before) return `Goes after ${n.after}, before ${n.before}.`
    if (n.after) return `Goes last, after ${n.after}.`
    if (n.before) return `Goes first, before ${n.before}.`
    return "The only step."
  }, [guest, name, when, effectiveKind, id])

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      if (isGuest) {
        const g = loadGuestData()
        if (g.steps.some((s) => s.id !== id && s.name.toLowerCase() === trimmed.toLowerCase())) {
          setError(`${trimmed} is already in your routine.`)
          setBusy(false)
          return
        }
        if (id) updateGuestStep(id, { name: trimmed, when, frequency, kind: effectiveKind ?? undefined })
        else addGuestStep({ name: trimmed, when, frequency, kind: effectiveKind ?? undefined })
      } else if (id) {
        await updateRoutineStep(id, { customName: trimmed, frequency })
      } else {
        await createRoutineStep({ type: when, customName: trimmed, frequency })
      }
      router.push("/app/routine")
    } catch {
      setError("That didn't save. Check your connection and try again.")
      setBusy(false)
    }
  }

  async function remove() {
    if (!id || !window.confirm(`Remove ${name.trim()} from your routine? Your streak stays as it is.`)) return
    setBusy(true)
    try {
      if (isGuest) removeGuestStep(id)
      else await deleteRoutineStep(id)
      router.push("/app/routine")
    } catch {
      setError("That didn't save. Check your connection and try again.")
      setBusy(false)
    }
  }

  const label: React.CSSProperties = { display: "block", margin: "26px 0 10px", fontSize: 14, fontWeight: 600, color: "var(--ink2)" }

  if (notFound) {
    return (
      <div>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em" }}>That step isn&apos;t in your routine.</h1>
        <p>
          <Link href="/app/routine">Back to your routine</Link>
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/app/routine" style={{ fontSize: 15, color: "var(--ink2)", textDecoration: "none" }}>
        ← Routine
      </Link>
      <h1 style={{ margin: "12px 0 0", fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>{editing ? "Edit step" : "Add a step"}</h1>

      <label htmlFor="step-name" style={label}>
        Product name
      </label>
      <input
        id="step-name"
        value={name}
        autoFocus={!editing && !initialName}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        placeholder="e.g. Vitamin C serum"
        style={{
          width: "100%",
          minHeight: 52,
          padding: "0 16px",
          borderRadius: 14,
          border: `1.5px solid ${name ? "var(--ink)" : "var(--line)"}`,
          background: "transparent",
          color: "var(--ink)",
          font: "inherit",
          fontSize: 17,
          outline: "none",
        }}
      />
      {error && <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--t-avoid)" }}>{error}</p>}

      {isGuest && (
        <>
          <span style={label}>Step</span>
          <div role="radiogroup" aria-label="Step" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STEP_KINDS.map((k) => (
              <button
                key={k}
                role="radio"
                className="v3-chip"
                aria-checked={effectiveKind === k}
                onClick={() => {
                  setKind(k)
                  setKindPicked(true)
                }}
              >
                {KIND[k]}
              </button>
            ))}
          </div>
        </>
      )}

      {(isGuest || !editing) && (
        <>
          <span style={label}>When</span>
          <Segmented
            label="When"
            value={when}
            onChange={setWhen}
            options={[
              ["morning", "Morning"],
              ["night", "Night"],
              ["both", "Both"],
            ]}
          />
        </>
      )}

      <span style={label}>How often</span>
      <Segmented
        label="How often"
        value={frequency}
        onChange={setFrequency}
        options={[
          ["daily", "Daily"],
          ["alternate", "Every other day"],
          ["twice_weekly", "Twice a week"],
        ]}
      />

      {goes && <p style={{ margin: "20px 0 0", fontSize: 16, color: "var(--ink2)" }}>{goes}</p>}

      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginTop: 28 }}>
        <button className="v3-btn" onClick={save} disabled={!name.trim() || busy}>
          {editing ? "Save" : "Add to routine"}
        </button>
        {editing && (
          <button onClick={remove} disabled={busy} style={{ font: "inherit", fontSize: 16, fontWeight: 500, color: "var(--t-avoid)", background: "none", border: "none", cursor: "pointer", minHeight: 44 }}>
            Remove from routine
          </button>
        )}
      </div>
    </div>
  )
}
