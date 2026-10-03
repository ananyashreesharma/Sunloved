"use client"

// V3 onboarding (web): where you live, your skin as a sentence, and what you use at night (sorted
// into order as you tap). No reminders step: the website can't send them; the phone app does.
// When someone signs in with a routine already built in this browser, it moves to their account
// automatically and they go straight to it.

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { CONCERNS, COUNTRIES, countryByCode, guessCountry, MAX_CONCERNS, SKIN_TYPES, stepSortKey, type StepKind } from "@skinlens/shared"
import { completeOnboarding, createRoutineStep } from "@/lib/api"
import { addGuestStep, clearGuestData, clearGuestScans, hasGuestData, loadGuestData, updateGuestData } from "@/lib/guest-store"
import { useIsGuest } from "@/lib/use-guest"
import { track } from "@/lib/analytics"
import { ProfileSentence } from "./Profile"

const SHORT = ["IN", "US", "GB", "AE", "SA", "MX", "ES", "NG", "ID"]
const PRODUCTS: { name: string; kind: StepKind; label: string }[] = [
  { name: "Cleanser", kind: "cleanse", label: "Cleanse" },
  { name: "Exfoliating toner", kind: "exfoliate", label: "Exfoliate" },
  { name: "Niacinamide serum", kind: "serum", label: "Serum" },
  { name: "Retinol serum", kind: "treat", label: "Treat" },
  { name: "Moisturiser", kind: "moisturise", label: "Moisturise" },
  { name: "Face oil", kind: "seal", label: "Seal" },
]

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? countryByCode(code)?.name ?? code
  } catch {
    return countryByCode(code)?.name ?? code
  }
}

export function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const isGuest = useIsGuest()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [country, setCountry] = useState<string | null>(null)
  const [skinType, setSkinType] = useState<string | null>(null)
  const [concerns, setConcerns] = useState<string[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The move runs once per page, even though React may start effects twice in development.
  const moving = useRef(false)

  useEffect(() => {
    const g = loadGuestData()
    setCountry(g.country ?? guessCountry(navigator.language))
    if (g.skinType) setSkinType(g.skinType)
    if (g.concerns.length) setConcerns(g.concerns)
  }, [])

  // Signed in with a routine built in this browser: move it all to the account in one go.
  useEffect(() => {
    if (isGuest || !hasGuestData() || moving.current) return
    const g = loadGuestData()
    if (!g.skinType) return
    moving.current = true
    setBusy(true)
    ;(async () => {
      try {
        await completeOnboarding({ skinType: g.skinType!, concerns: g.concerns, country: g.country ?? undefined })
        track("account_created")
        const ordered = [...g.steps].sort((a, b) => stepSortKey(a.name, a.kind) - stepSortKey(b.name, b.kind))
        for (const s of ordered) {
          await createRoutineStep({ type: s.when, productId: s.productId, customName: s.productId ? undefined : s.name, frequency: s.frequency })
        }
        await update({ trigger: "update" })
        clearGuestData()
        clearGuestScans()
        router.replace("/app/routine")
      } catch {
        setError("We couldn't move your routine to your account. Your answers are still here; try again.")
        moving.current = false
        setBusy(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest])

  function toggleConcern(code: string) {
    setConcerns((c) => (c.includes(code) ? c.filter((x) => x !== code) : c.length >= MAX_CONCERNS ? c : [...c, code]))
  }

  async function finish() {
    setBusy(true)
    setError(null)
    const chosen = PRODUCTS.filter((p) => picked.includes(p.name))
    if (isGuest) {
      updateGuestData({ country, skinType, concerns })
      for (const p of chosen) addGuestStep({ name: p.name, when: "night", frequency: "daily", kind: p.kind })
      router.replace("/app/routine")
      return
    }
    try {
      await completeOnboarding({ skinType: skinType!, concerns, country: country ?? undefined })
      // Onboarding runs once per account: this is a new account.
      track("account_created")
      for (const p of chosen) await createRoutineStep({ type: "night", customName: p.name })
      await update({ trigger: "update" })
      router.replace("/app/routine")
    } catch {
      setError("Something went wrong saving that. Check your connection and try again.")
      setBusy(false)
    }
  }

  const sorted = PRODUCTS.filter((p) => picked.includes(p.name))
  const canGo = step === 1 ? !!country : step === 2 ? !!skinType : true
  const h1: React.CSSProperties = { margin: 0, fontSize: "clamp(34px, 5vw, 44px)", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.05 }
  const sub: React.CSSProperties = { margin: "8px 0 0", fontSize: 17, lineHeight: 1.5, color: "var(--ink2)" }

  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, width: "100%", maxWidth: 560, margin: "0 auto", padding: "32px 24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <button
            onClick={() => (step === 1 ? router.back() : setStep((s) => (s - 1) as 1 | 2))}
            aria-label="Back"
            style={{ width: 44, height: 44, border: "none", background: "none", color: "var(--ink)", fontSize: 22, cursor: "pointer" }}
          >
            ←
          </button>
          <div role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label={`Step ${step} of 3`} style={{ flex: 1, display: "flex", gap: 6 }}>
            {[1, 2, 3].map((i) => (
              <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--ink)" : "var(--line)" }} />
            ))}
          </div>
        </div>

        {busy && !error && step === 1 && !isGuest && hasGuestData() ? (
          <p style={{ fontSize: 20 }}>Moving your routine to your account…</p>
        ) : (
          <div key={step} className="v3-fade">
            {step === 1 && (
              <>
                <h1 style={h1}>Where do you live?</h1>
                <p style={sub}>Formulas and rules differ by country, so this shapes your results.</p>
                <div role="radiogroup" aria-label="Country" style={{ marginTop: 16 }}>
                  {Array.from(new Set([...(country && !SHORT.includes(country) ? [country] : []), ...SHORT])).map((code) => (
                    <button
                      key={code}
                      role="radio"
                      aria-checked={country === code}
                      onClick={() => setCountry(code)}
                      style={{
                        width: "100%",
                        minHeight: 56,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "none",
                        borderBottom: "1px solid var(--line)",
                        background: "none",
                        color: "var(--ink)",
                        font: "inherit",
                        fontSize: 19,
                        fontWeight: country === code ? 600 : 300,
                        cursor: "pointer",
                        textAlign: "start",
                        padding: 0,
                      }}
                    >
                      {countryName(code)}
                      {country === code && <span aria-hidden>✓</span>}
                    </button>
                  ))}
                  <label style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, fontSize: 14, color: "var(--ink2)" }}>
                    Somewhere else
                    <select
                      value={country && !SHORT.includes(country) ? country : ""}
                      onChange={(e) => e.target.value && setCountry(e.target.value)}
                      style={{ minHeight: 48, padding: "0 12px", borderRadius: 12, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", font: "inherit", fontSize: 16 }}
                    >
                      <option value="">Choose a country</option>
                      {COUNTRIES.map((c) => ({ code: c.code, name: countryName(c.code) }))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="v3-label" style={{ color: "var(--ink2)" }}>
                  Your skin
                </div>
                <div style={{ marginTop: 12, minHeight: 130 }}>
                  <ProfileSentence profile={{ country, skinType, concerns }} />
                </div>
                <div style={{ margin: "20px 0 10px", fontSize: 14, fontWeight: 600, color: "var(--ink2)" }}>Skin type</div>
                <div role="radiogroup" aria-label="Skin type" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SKIN_TYPES.map((s) => (
                    <button key={s.code} role="radio" className="v3-chip" aria-checked={skinType === s.code} onClick={() => setSkinType(s.code)}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div style={{ margin: "24px 0 10px", fontSize: 14, fontWeight: 600, color: "var(--ink2)" }}>
                  Up to two concerns · {concerns.length}/{MAX_CONCERNS}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CONCERNS.map((c) => (
                    <button key={c.code} className="v3-chip" aria-pressed={concerns.includes(c.code)} onClick={() => toggleConcern(c.code)}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {concerns.length >= MAX_CONCERNS && <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--ink2)" }}>Two is plenty. Click one of them to change it.</p>}
              </>
            )}

            {step === 3 && (
              <>
                <h1 style={h1}>What do you use at night?</h1>
                <p style={sub}>Click what you have. We&apos;ll put it in order.</p>
                <ol style={{ listStyle: "none", margin: "20px 0", padding: 0 }}>
                  {sorted.length === 0 && (
                    <li style={{ minHeight: 60, borderRadius: 16, border: "1.5px dashed var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink2)", fontSize: 15 }}>
                      Your night routine appears here
                    </li>
                  )}
                  {sorted.map((p, i) => (
                    <li key={p.name} className="v3-fade" style={{ minHeight: 64, display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--line)" }}>
                      <span style={{ width: 44, fontSize: 28, fontWeight: 300, color: "var(--ink2)" }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: "block", fontSize: 17, fontWeight: 500 }}>{p.name}</span>
                        <span style={{ display: "block", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink2)" }}>{p.label}</span>
                      </span>
                      <button
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setPicked((l) => l.filter((x) => x !== p.name))}
                        style={{ width: 44, height: 44, border: "none", background: "none", color: "var(--ink2)", fontSize: 20, cursor: "pointer" }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ol>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {PRODUCTS.filter((p) => !picked.includes(p.name)).map((p) => (
                    <button key={p.name} className="v3-chip" onClick={() => setPicked((l) => [...l, p.name])}>
                      + {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && <p style={{ margin: "20px 0 0", fontSize: 15, color: "var(--t-avoid)" }}>{error}</p>}

            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 32 }}>
              <button className="v3-btn" disabled={!canGo || busy} onClick={() => (step === 3 ? finish() : setStep((s) => (s + 1) as 2 | 3))}>
                {step === 3 ? "Start my routine" : "Continue"}
              </button>
              {step === 3 && (
                <button className="v3-chip" style={{ border: "none" }} disabled={busy} onClick={finish}>
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
