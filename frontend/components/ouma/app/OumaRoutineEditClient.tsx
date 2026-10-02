"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, GripVertical, MoreVertical, Camera, Droplets, AlertTriangle } from "lucide-react"

const initialSteps = [
  { id: "1", role: "Cleanser", name: "Gentle Gel Cleanser", brand: "CeraVe", conflict: false },
  { id: "2", role: "Toner", name: "Hydrating Milky Toner", brand: "Laneige", conflict: false },
  { id: "3", role: "Treatment", name: "AHA/BHA Exfoliant", brand: "Paula's Choice", conflict: true },
  { id: "4", role: "Treatment", name: "Vitamin C 15% Serum", brand: "Paula's Choice", conflict: true },
] as const

export function OumaRoutineEditClient() {
  const [ampm, setAmpm] = useState<"am" | "pm">("am")
  const [reminder, setReminder] = useState(true)

  return (
    <div className="mx-auto w-full max-w-lg pb-36 md:max-w-2xl">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/app/routine"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DDE3DA] bg-white text-[#17211A] no-underline"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="ouma-display flex-1 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#17211A]">
          Edit routine
        </h1>
        <button type="button" className="text-sm font-bold text-[#1D5C3B]">
          Save
        </button>
      </header>

      <div className="flex rounded-full bg-[#ede9e4] p-1">
        <button
          type="button"
          onClick={() => setAmpm("am")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            ampm === "am" ? "bg-white text-[#17211A] shadow-sm" : "text-[#5A6259]"
          }`}
        >
          AM routine
        </button>
        <button
          type="button"
          onClick={() => setAmpm("pm")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            ampm === "pm" ? "bg-white text-[#17211A] shadow-sm" : "text-[#5A6259]"
          }`}
        >
          PM routine
        </button>
      </div>

      <p className="mt-4 text-sm text-[#5A6259]">Drag to reorder your morning steps.</p>

      <ul className="mt-4 space-y-3">
        {initialSteps.map((s) => (
          <li
            key={s.id}
            className={`flex gap-2 rounded-2xl border-2 bg-white p-3 shadow-sm ${
              s.conflict ? "border-[#e07070]" : "border-[#DDE3DA]"
            }`}
          >
            <button type="button" className="flex h-10 w-8 shrink-0 items-center justify-center text-[#5A6259]" aria-label="Reorder">
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                {s.conflict ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8A2E22]" aria-hidden /> : null}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1D5C3B]">{s.role}</p>
                  <p className="font-semibold text-[#17211A]">{s.name}</p>
                  <p className="text-sm text-[#5A6259]">{s.brand}</p>
                  {s.conflict ? (
                    <p className="mt-1 text-xs font-medium text-[#8A2E22]">Conflict with vitamin C in AM…</p>
                  ) : null}
                </div>
              </div>
            </div>
            <button type="button" className="flex h-10 w-8 shrink-0 items-center justify-center text-[#17211A]" aria-label="Step options">
              <MoreVertical className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-6 w-full rounded-2xl border-2 border-dashed border-[#DDE3DA] py-4 text-sm font-bold text-[#5A6259]"
      >
        + Add new step
      </button>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2">
        <Link
          href="/app/scan"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#DDE3DA] bg-white p-6 text-center no-underline shadow-sm"
        >
          <Camera className="h-8 w-8 text-[#1D5C3B]" />
          <span className="text-sm font-semibold text-[#17211A]">Scan to add</span>
        </Link>
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#DDE3DA] bg-white p-6 shadow-sm"
        >
          <Droplets className="h-8 w-8 text-[#1D5C3B]" />
          <span className="text-sm font-semibold text-[#17211A]">Daily moisture</span>
        </button>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-[#DDE3DA] bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#5A6259]">Routine settings</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[#17211A]">AM reminder</p>
            <p className="text-sm text-[#5A6259]">07:30 AM</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminder}
            onClick={() => setReminder(!reminder)}
            className={`relative h-7 w-12 shrink-0 rounded-full ${reminder ? "bg-[#1D5C3B]" : "bg-[#d4d2cd]"}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${reminder ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
        <div>
          <p className="font-semibold text-[#17211A]">Rest days</p>
          <p className="text-sm text-[#5A6259]">Pick days to skip strong actives.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Mon", "Wed", "Fri"].map((d) => (
              <span key={d} className="rounded-full border border-[#DDE3DA] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#5A6259]">
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 border-t border-[#f0c4c4] bg-[#b91c1c] px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] md:bottom-0 md:left-auto md:right-auto md:mx-auto md:max-w-lg md:rounded-t-2xl md:border-x">
        <p className="text-center text-xs font-medium text-white/95">
          Conflict: AHA/BHA and vitamin C shouldn&apos;t share the same routine.
        </p>
        <button
          type="button"
          className="mt-2 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-[#b91c1c]"
        >
          Auto-resolve (move to PM)
        </button>
      </div>
    </div>
  )
}
