"use client"

// V3 sign-in (web): an email code (works in every country) or Google. Optional: everything works
// without an account; signing in keeps the routine in an account. New accounts go to onboarding,
// which also moves anything built in this browser into the account.

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { status } = useSession()
  const raw = params.get("next") ?? "/app/routine"
  // Only same-site paths, so the link can't send people elsewhere after signing in.
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app/routine"
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") router.replace(next)
  }, [status, next, router])

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (!emailOk) return
    setBusy(true)
    setError(null)
    const res = await fetch("/api/email-otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null)
    setBusy(false)
    if (!res?.ok) {
      const body = await res?.json().catch(() => null)
      setError(body?.error ?? "We couldn't send a code. Try again.")
      return
    }
    setStep("code")
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault()
    if (!/^\d{6}$/.test(code)) return
    setBusy(true)
    setError(null)
    const result = await signIn("email-otp", { email, code, redirect: false })
    if (!result || result.error) {
      setBusy(false)
      setError("That code didn't work. Check it, or ask for a new one.")
      return
    }
    // The app layout sends new accounts to onboarding on its own.
    router.replace(next)
  }

  const input: React.CSSProperties = {
    width: "100%",
    minHeight: 52,
    padding: "0 16px",
    borderRadius: 14,
    border: "1.5px solid var(--line)",
    background: "transparent",
    color: "var(--ink)",
    font: "inherit",
    fontSize: 17,
    outline: "none",
  }

  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, width: "100%", maxWidth: 440, margin: "0 auto", padding: "56px 24px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, textDecoration: "none" }}>
          <span aria-hidden style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid var(--ink)" }} />
          SkinLens
        </Link>
        <h1 style={{ margin: "32px 0 0", fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.05 }}>{step === "email" ? "Sign in" : "Check your email"}</h1>
        <p style={{ margin: "10px 0 0", fontSize: 17, lineHeight: 1.5, color: "var(--ink2)" }}>
          {step === "email" ? "Keep your routine in an account. Everything works without one, too." : `We sent a six-digit code to ${email.trim()}.`}
        </p>

        {step === "email" ? (
          <form onSubmit={send} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <label htmlFor="email" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink2)" }}>
              Email
            </label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={input} />
            <button className="v3-btn" type="submit" disabled={!emailOk || busy}>
              {busy ? "Sending…" : "Send me a code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <label htmlFor="code" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink2)" }}>
              Code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              style={{ ...input, fontSize: 24, letterSpacing: "0.3em", textAlign: "center" }}
            />
            <button className="v3-btn" type="submit" disabled={code.length !== 6 || busy}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            <div style={{ display: "flex", gap: 20, fontSize: 15 }}>
              <button type="button" onClick={() => setStep("email")} style={{ font: "inherit", color: "var(--ink2)", background: "none", border: "none", padding: 0, cursor: "pointer", minHeight: 44 }}>
                Use another email
              </button>
              <button type="button" onClick={() => send()} disabled={busy} style={{ font: "inherit", color: "var(--ink)", background: "none", border: "none", padding: 0, cursor: "pointer", minHeight: 44, textDecoration: "underline" }}>
                Send a new code
              </button>
            </div>
          </form>
        )}

        {error && (
          <p role="alert" style={{ margin: "14px 0 0", fontSize: 15, color: "var(--t-avoid)" }}>
            {error}
          </p>
        )}

        {step === "email" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0", fontSize: 13, color: "var(--ink2)" }}>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              or
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: next })}
              style={{ width: "100%", minHeight: 52, borderRadius: 14, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", font: "inherit", fontSize: 16, fontWeight: 500, cursor: "pointer" }}
            >
              Continue with Google
            </button>
          </>
        )}

        <p style={{ margin: "28px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--ink2)" }}>
          By signing in you agree to the <Link href="/legal/terms">Terms</Link> and <Link href="/legal/privacy">Privacy policy</Link>.
        </p>
        <Link href="/app/routine" style={{ display: "inline-flex", minHeight: 44, alignItems: "center", marginTop: 8, fontSize: 15 }}>
          Continue without an account
        </Link>
      </main>
    </div>
  )
}
