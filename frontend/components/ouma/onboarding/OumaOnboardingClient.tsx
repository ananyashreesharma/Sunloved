"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { completeOnboarding, createRoutineStep, updateNotificationPreferences } from "@/lib/api"
import { useIsGuest } from "@/lib/use-guest"
import { hasGuestData, loadGuestData, updateGuestData, clearGuestData, clearGuestScans, STEP_ORDER as GUEST_STEP_ORDER } from "@/lib/guest-store"

type OnboardingDraft = {
  skinType: string | null
  concerns: string[]
  steps: Step[]
  morningTime: string
  nightTime: string
  channel: "push" | "whatsapp"
}

const INK = "#17211A"
const MUTE = "#5A6259"
const ACCENT = "#1E4D3A"
const BONE = "#F3F5EF"
const CARD = "#FFFFFF"
const LINE = "rgba(23,33,26,.12)"

const SKIN_TYPES = [
  { code: "oily", label: "Oily" },
  { code: "dry", label: "Dry" },
  { code: "combination", label: "Combination" },
  { code: "sensitive", label: "Sensitive" },
]

const CONCERNS = [
  { code: "acne", label: "Acne" },
  { code: "pigmentation", label: "Pigmentation" },
  { code: "redness", label: "Redness" },
  { code: "texture", label: "Texture" },
  { code: "dullness", label: "Dullness" },
]

const QUICK_STEPS = ["Cleanser", "Toner", "Serum", "Moisturiser", "SPF"]
const STEP_ORDER = GUEST_STEP_ORDER

type Step = { name: string; kind: string }

function Chip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="ouma-mono"
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        border: selected ? `1.5px solid ${ACCENT}` : `1px solid ${LINE}`,
        background: selected ? ACCENT : disabled ? "transparent" : CARD,
        color: selected ? "#fff" : disabled ? "#AAB4AB" : INK,
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        letterSpacing: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !selected ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  )
}

function Continue({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <div style={{ marginTop: "auto", padding: "20px 0 26px" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          width: "100%",
          background: disabled ? "rgba(23,33,26,.2)" : ACCENT,
          color: "#fff",
          borderRadius: 12,
          padding: 16,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 600,
          border: "none",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {label}
      </button>
    </div>
  )
}

export function OumaOnboardingClient() {
  const router = useRouter()
  const { update } = useSession()
  const isGuest = useIsGuest()
  const [screen, setScreen] = useState<1 | 2 | 3 | 4>(1)
  const [skinType, setSkinType] = useState<string | null>(null)
  const [concerns, setConcerns] = useState<string[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [stepInput, setStepInput] = useState("")
  const [morningTime, setMorningTime] = useState("07:30")
  const [nightTime, setNightTime] = useState("21:30")
  const [channel, setChannel] = useState<"push" | "whatsapp">("push")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Signed in and there's local guest data waiting (they used the app as a guest and are now
  // signing in from some "sign in to save this" prompt) — push it all to the account automatically
  // instead of making them redo any of it.
  useEffect(() => {
    if (isGuest) return
    if (!hasGuestData()) return
    const data = loadGuestData()
    setSkinType(data.skinType)
    setConcerns(data.concerns)
    setSteps(data.steps.map((s) => ({ name: s.name, kind: GUEST_STEP_ORDER[s.name] !== undefined ? s.name : "custom" })))
    setMorningTime(data.morningTime)
    setNightTime(data.nightTime)
    setChannel(data.channel)
    setScreen(4)
    void migrateGuestData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest])

  const orderedSteps = [...steps].sort((a, b) => (STEP_ORDER[a.kind] ?? 99) - (STEP_ORDER[b.kind] ?? 99))

  function addStep(name: string, kind: string) {
    if (steps.some((s) => s.name.toLowerCase() === name.toLowerCase())) return
    setSteps((prev) => [...prev, { name, kind }])
  }

  function addTypedStep() {
    const name = stepInput.trim()
    if (!name) return
    addStep(name, "custom")
    setStepInput("")
  }

  function toggleConcern(code: string) {
    setConcerns((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= 2) return prev
      return [...prev, code]
    })
  }

  async function finishWith(draft: OnboardingDraft) {
    const draftOrderedSteps = [...draft.steps].sort((a, b) => (STEP_ORDER[a.kind] ?? 99) - (STEP_ORDER[b.kind] ?? 99))
    setSubmitting(true)
    setError(null)
    try {
      if (draft.skinType) {
        await completeOnboarding({ skinType: draft.skinType, concerns: draft.concerns })
      }
      await updateNotificationPreferences({ morningTime: draft.morningTime, nightTime: draft.nightTime, channel: draft.channel })
      for (const step of draftOrderedSteps) {
        await createRoutineStep({ type: "night", customName: step.name })
      }
      await update({ trigger: "update" })
      router.replace("/app/routine")
    } catch {
      setError("Something went wrong saving your profile. You can still continue — you can fix this later in Me.")
      setSubmitting(false)
    }
  }

  // Pushes everything a guest built up locally (onboarding answers, plus any routine steps added
  // later from Add Step or a scan result) to the now-authenticated account in one shot.
  async function migrateGuestData() {
    const data = loadGuestData()
    const orderedSteps = [...data.steps].sort((a, b) => (STEP_ORDER[a.name] ?? 99) - (STEP_ORDER[b.name] ?? 99))
    setSubmitting(true)
    setError(null)
    try {
      if (data.skinType) {
        await completeOnboarding({ skinType: data.skinType, concerns: data.concerns })
      }
      await updateNotificationPreferences({ morningTime: data.morningTime, nightTime: data.nightTime, channel: data.channel })
      for (const step of orderedSteps) {
        await createRoutineStep({
          type: step.when,
          productId: step.productId,
          customName: step.productId ? undefined : step.name,
          frequency: step.frequency,
        })
      }
      await update({ trigger: "update" })
      clearGuestData()
      clearGuestScans()
      router.replace("/app/routine")
    } catch {
      setError("Something went wrong saving your data. You can still continue — you can fix this later in Me.")
      setSubmitting(false)
    }
  }

  function finish() {
    if (isGuest) {
      // Keep everything on-device and let them straight into the app, same as everywhere else —
      // the Routine screen's own "sign in to save this" prompt is where login actually gets asked
      // for. If they sign in from there, they land back here with onboardingDone still false, the
      // resume effect above picks this up, and the save to their new account completes automatically.
      const existing = loadGuestData()
      const wizardSteps = steps
        .filter((s) => !existing.steps.some((e) => e.name.toLowerCase() === s.name.toLowerCase()))
        .map((s) => ({
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: s.name,
          brand: null,
          when: "night" as const,
          frequency: "daily" as const,
        }))
      updateGuestData({ skinType, concerns, steps: [...existing.steps, ...wizardSteps], morningTime, nightTime, channel })
      router.replace("/app/routine")
      return
    }
    void finishWith({ skinType, concerns, steps, morningTime, nightTime, channel })
  }

  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ background: BONE, color: INK }}>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pt-10 pb-6">
        {screen === 1 && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="ouma-mono" style={{ fontSize: 12, color: MUTE }}>
                1 / 3
              </span>
              <button
                type="button"
                onClick={() => router.replace("/app/routine")}
                style={{ fontSize: 13, fontWeight: 600, color: ACCENT, background: "none", border: "none", cursor: "pointer" }}
              >
                Skip
              </button>
            </div>
            <h1 className="ouma-display" style={{ fontSize: 30, lineHeight: 1.05, marginTop: 14, textTransform: "uppercase" }}>
              First, your skin
            </h1>
            <p style={{ marginTop: 8, fontSize: 14, color: MUTE }}>
              This shapes every flag and summary you&apos;ll see.
            </p>

            <p className="ouma-display" style={{ marginTop: 24, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
              Skin type
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {SKIN_TYPES.map((t) => (
                <Chip key={t.code} label={t.label} selected={skinType === t.code} onClick={() => setSkinType(t.code)} />
              ))}
            </div>

            <div style={{ marginTop: 24, display: "flex", alignItems: "baseline", gap: 8 }}>
              <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
                Concerns
              </p>
              <span className="ouma-mono" style={{ fontSize: 11, color: MUTE }}>
                {concerns.length} / 2 picked
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {CONCERNS.map((c) => (
                <Chip
                  key={c.code}
                  label={c.label}
                  selected={concerns.includes(c.code)}
                  disabled={!concerns.includes(c.code) && concerns.length >= 2}
                  onClick={() => toggleConcern(c.code)}
                />
              ))}
            </div>
            <p style={{ marginTop: 10, fontSize: 12, color: MUTE }}>
              Two keeps your summaries specific. Change them anytime in Me.
            </p>

            <Continue label="Continue" onClick={() => setScreen(2)} disabled={!skinType} />
          </>
        )}

        {screen === 2 && (
          <>
            <div className="flex items-baseline justify-between">
              <button
                type="button"
                onClick={() => setScreen(1)}
                className="ouma-mono"
                style={{ fontSize: 12, color: MUTE, background: "none", border: "none", cursor: "pointer" }}
              >
                ← 2 / 3
              </button>
              <button
                type="button"
                onClick={() => router.replace("/app/routine")}
                style={{ fontSize: 13, fontWeight: 600, color: ACCENT, background: "none", border: "none", cursor: "pointer" }}
              >
                Skip
              </button>
            </div>
            <h1 className="ouma-display" style={{ fontSize: 30, lineHeight: 1.05, marginTop: 14, textTransform: "uppercase" }}>
              What do you use at night?
            </h1>
            <p style={{ marginTop: 8, fontSize: 14, color: MUTE }}>
              Type the names, or tap a step. We&apos;ll put them in the right order. No scanning needed.
            </p>

            <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
              <input
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTypedStep()
                }}
                placeholder="Type a product name…"
                style={{
                  flex: 1,
                  background: CARD,
                  border: `1.5px solid ${ACCENT}`,
                  borderRadius: 12,
                  padding: "13px 16px",
                  fontSize: 15,
                  color: INK,
                }}
              />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {QUICK_STEPS.map((q) => {
                const added = steps.some((s) => s.name === q)
                return (
                  <Chip key={q} label={`+ ${q}`} selected={false} disabled={added} onClick={() => addStep(q, q)} />
                )
              })}
            </div>

            <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 8 }}>
              <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
                Tonight — ordered for you
              </p>
              <span className="ouma-mono" style={{ fontSize: 11, color: MUTE }}>
                {orderedSteps.length} steps
              </span>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {orderedSteps.map((s, i) => (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: CARD,
                    borderRadius: 12,
                    padding: "12px 14px",
                    border: `1px solid ${LINE}`,
                  }}
                >
                  <span className="ouma-mono" style={{ fontSize: 13, color: MUTE }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{s.name}</span>
                </div>
              ))}
              {orderedSteps.length === 0 && (
                <p style={{ fontSize: 13, color: MUTE, fontStyle: "italic" }}>Nothing added yet — that&apos;s fine, add steps anytime.</p>
              )}
            </div>
            {orderedSteps.length > 1 && (
              <p style={{ marginTop: 10, fontSize: 12, color: MUTE, fontStyle: "italic" }}>
                Serums go before moisturiser — thinnest first.
              </p>
            )}

            <Continue label="Continue" onClick={() => setScreen(3)} />
          </>
        )}

        {screen === 3 && (
          <>
            <button
              type="button"
              onClick={() => setScreen(2)}
              className="ouma-mono"
              style={{ fontSize: 12, color: MUTE, background: "none", border: "none", cursor: "pointer" }}
            >
              ← 3 / 3
            </button>
            <h1 className="ouma-display" style={{ fontSize: 30, lineHeight: 1.05, marginTop: 14, textTransform: "uppercase" }}>
              When should we nudge you?
            </h1>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <label style={{ flex: 1, background: CARD, borderRadius: 14, padding: 16, border: `1px solid ${LINE}` }}>
                <span className="ouma-display" style={{ display: "block", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
                  Morning
                </span>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="ouma-mono"
                  style={{ marginTop: 6, fontSize: 22, fontWeight: 500, border: "none", background: "transparent", width: "100%" }}
                />
              </label>
              <label style={{ flex: 1, background: CARD, borderRadius: 14, padding: 16, border: `1.5px solid ${ACCENT}` }}>
                <span className="ouma-display" style={{ display: "block", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT }}>
                  Night
                </span>
                <input
                  type="time"
                  value={nightTime}
                  onChange={(e) => setNightTime(e.target.value)}
                  className="ouma-mono"
                  style={{ marginTop: 6, fontSize: 22, fontWeight: 500, border: "none", background: "transparent", width: "100%" }}
                />
              </label>
            </div>

            <p className="ouma-display" style={{ marginTop: 24, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
              Where
            </p>
            <button
              type="button"
              onClick={() => setChannel("push")}
              style={{
                marginTop: 10,
                textAlign: "left",
                background: CARD,
                border: channel === "push" ? `1.5px solid ${ACCENT}` : `1px solid ${LINE}`,
                borderRadius: 14,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Push notification</span>
              <span style={{ display: "block", fontSize: 13, color: MUTE, marginTop: 2 }}>
                One message at each time you set, listing that routine&apos;s steps. Nothing else.
              </span>
            </button>
            <div
              style={{
                marginTop: 10,
                background: CARD,
                border: `1px solid ${LINE}`,
                borderRadius: 14,
                padding: 16,
                opacity: 0.6,
              }}
            >
              <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>
                WhatsApp{" "}
                <span className="ouma-mono" style={{ fontSize: 10, border: `1px solid ${LINE}`, borderRadius: 4, padding: "1px 5px" }}>
                  COMING SOON
                </span>
              </span>
              <span style={{ display: "block", fontSize: 13, color: MUTE, marginTop: 2 }}>
                Two messages a day, your steps only, never marketing.
              </span>
            </div>
            <p style={{ marginTop: 12, fontSize: 12, color: MUTE }}>Quiet hours are fixed: never before 6:00 or after 23:00.</p>

            <Continue label="Set reminders" onClick={() => setScreen(4)} />
          </>
        )}

        {screen === 4 && (
          <>
            <h1 className="ouma-display" style={{ fontSize: 34, lineHeight: 1.05, marginTop: 22, textTransform: "uppercase" }}>
              Your routine is set
            </h1>
            <p style={{ marginTop: 10, fontSize: 15, color: "#2A342C" }}>
              Your PM reminder arrives at <span className="ouma-mono" style={{ fontWeight: 600 }}>{nightTime}</span> tonight.
            </p>

            <div style={{ marginTop: 22, background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: 18 }}>
              <div className="flex items-baseline justify-between">
                <span className="ouma-display" style={{ fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Tonight · PM
                </span>
                <span className="ouma-mono" style={{ fontSize: 12, color: MUTE }}>
                  {orderedSteps.length} steps
                </span>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {orderedSteps.map((s, i) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="ouma-mono" style={{ fontSize: 13, color: MUTE, width: 14 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15 }}>{s.name}</span>
                    <span style={{ marginLeft: "auto", width: 22, height: 22, borderRadius: 11, border: `1.5px solid ${LINE}` }} />
                  </div>
                ))}
                {orderedSteps.length === 0 && (
                  <p style={{ fontSize: 13, color: MUTE, fontStyle: "italic" }}>You can add steps anytime from Routine.</p>
                )}
              </div>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: MUTE, lineHeight: 1.5 }}>
              You can also check any product&apos;s ingredients anytime — try it from the Scan tab.
            </p>
            {error && <p style={{ marginTop: 12, fontSize: 13, color: "#8A2E22" }}>{error}</p>}

            <Continue label={submitting ? "Saving…" : "Go to my routine"} onClick={finish} disabled={submitting} />
          </>
        )}
      </div>
    </div>
  )
}
