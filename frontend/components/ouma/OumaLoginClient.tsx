"use client"

import Link from "next/link"
import { useState, useRef, useEffect, FormEvent } from "react"
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

// ─── helpers ────────────────────────────────────────────────────────────────

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}

function isValidIndian(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone)
}

// ─── types ──────────────────────────────────────────────────────────────────

type Step = "entry" | "otp" | "done"
type Mode = "login" | "signup"

// ─── component ──────────────────────────────────────────────────────────────

export function OumaLoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const next = searchParams.get("next") || "/app"

  const [mode, setMode] = useState<Mode>("login")
  const [step, setStep] = useState<Step>("entry")

  // Phone flow state
  const [rawPhone, setRawPhone] = useState("")
  const [agree, setAgree] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  // Status
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") router.replace(next)
  }, [status, router])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const phone = toE164(rawPhone)
  const phoneValid = isValidIndian(phone)

  // ── OTP input handlers ───────────────────────────────────────────────────

  function handleOtpKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  function handleOtpChange(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...otp]
    next[i] = digit
    setOtp(next)
    if (digit && i < 5) otpRefs.current[i + 1]?.focus()
    // Auto-submit when all 6 filled
    if (digit && i === 5 && next.every(Boolean)) {
      handleVerify(next.join(""))
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (text.length === 6) {
      const arr = text.split("")
      setOtp(arr)
      otpRefs.current[5]?.focus()
      handleVerify(text)
    }
  }

  // ── Send OTP ─────────────────────────────────────────────────────────────

  async function handleSendOtp(e?: FormEvent) {
    e?.preventDefault()
    if (!phoneValid || !agree || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.message ?? json?.error ?? "Could not send OTP. Try again.")
        return
      }
      setStep("otp")
      setResendCountdown(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch {
      setError("Network error. Check your connection.")
    } finally {
      setLoading(false)
    }
  }

  // ── Verify OTP ───────────────────────────────────────────────────────────

  async function handleVerify(code: string) {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await signIn("phone-otp", {
        phone,
        code,
        redirect: false,
      })
      if (result?.ok) {
        setStep("done")
        setTimeout(() => router.replace(next), 800)
      } else {
        setError("Incorrect code. Please try again.")
        setOtp(["", "", "", "", "", ""])
        otpRefs.current[0]?.focus()
      }
    } catch {
      setError("Verification failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── OAuth ────────────────────────────────────────────────────────────────

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    await signIn("google", { callbackUrl: next })
  }

  async function handleApple() {
    setLoading(true)
    setError(null)
    await signIn("apple", { callbackUrl: next })
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F3F5EF] px-5 pb-8 pt-12">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">

        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#17211A]">
            <span
              className="ouma-display"
              style={{ fontSize: 36, color: "#F3F5EF", fontStyle: "italic" }}
            >
              K
            </span>
          </div>
          <p
            className="ouma-display text-2xl"
            style={{ color: "#17211A", fontStyle: "italic" }}
          >
            SkinLens
          </p>
          <p className="mt-1 text-sm" style={{ color: "#5A6259" }}>
            Know what&apos;s on your skin.
          </p>
        </div>

        {/* Card */}
        <div className="mt-auto rounded-t-[28px] bg-white px-6 pb-10 pt-8 shadow-[0_-8px_40px_rgba(0,0,0,0.06)]">

          {/* ── Step: entry ─────────────────────────────────────────── */}
          {step === "entry" && (
            <>
              {/* Mode toggle */}
              <div className="mb-6 flex rounded-xl border border-[#DDE3DA] p-1">
                {(["login", "signup"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null) }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      mode === m
                        ? "bg-[#17211A] text-white shadow-sm"
                        : "text-[#5A6259] hover:text-[#17211A]"
                    }`}
                  >
                    {m === "login" ? "Log in" : "Sign up"}
                  </button>
                ))}
              </div>

              <h1 className="ouma-display text-center text-2xl font-semibold text-[#17211A]">
                {mode === "login" ? "Welcome back." : "Start for free."}
              </h1>
              <p className="mt-1 text-center text-sm text-[#5A6259]">
                {mode === "login"
                  ? "Sign in to continue your skin journey."
                  : "Join 12,000+ Indian women who know what's in their skincare."}
              </p>

              {/* Phone form */}
              <form onSubmit={handleSendOtp} className="mt-7">
                <label className="block text-sm font-bold text-[#17211A]" htmlFor="phone">
                  Phone Number
                </label>
                <div className="mt-2 flex gap-2">
                  <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[#DDE3DA] bg-[#FFFFFF] px-3 py-3 text-sm font-medium text-[#17211A]">
                    🇮🇳 +91
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    value={rawPhone}
                    onChange={(e) => { setRawPhone(e.target.value); setError(null) }}
                    className="min-w-0 flex-1 rounded-xl border border-[#DDE3DA] bg-white px-4 py-3 text-[#17211A] outline-none focus:border-[#17211A] focus:ring-2 focus:ring-[#17211A]/10 transition"
                  />
                </div>

                <label className="mt-5 flex cursor-pointer gap-3 text-left">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[#DDE3DA] accent-[#1D5C3B]"
                  />
                  <span className="text-xs leading-relaxed text-[#5A6259]">
                    I agree to receive a WhatsApp OTP for authentication.{" "}
                    <Link href="/legal/terms" className="font-bold text-[#17211A] underline">Terms</Link>
                    {" "}and{" "}
                    <Link href="/legal/privacy" className="font-bold text-[#17211A] underline">Privacy</Link>.
                  </span>
                </label>

                {error && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!phoneValid || !agree || loading}
                  className="ouma-btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Sending…" : "Send code on WhatsApp"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-[#DDE3DA]" />
                <span className="text-xs text-[#5A6259]">OR</span>
                <span className="h-px flex-1 bg-[#DDE3DA]" />
              </div>

              {/* OAuth buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#DDE3DA] py-3 text-sm font-semibold text-[#17211A] transition hover:bg-[#FFFFFF] disabled:opacity-50"
                >
                  {/* Google SVG icon */}
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.185l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={handleApple}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#DDE3DA] py-3 text-sm font-semibold text-[#17211A] transition hover:bg-[#FFFFFF] disabled:opacity-50"
                >
                  {/* Apple icon */}
                  <svg width="17" height="20" viewBox="0 0 17 20" fill="currentColor" aria-hidden>
                    <path d="M13.9 10.6c0-2.8 2.3-4.2 2.4-4.3-1.3-1.9-3.3-2.1-4-2.2-1.7-.2-3.3 1-4.1 1-.9 0-2.2-1-3.6-.9-1.8 0-3.5 1.1-4.4 2.7-1.9 3.3-.5 8.1 1.3 10.8.9 1.3 1.9 2.8 3.3 2.7 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8 2.3-1.3 3.2-2.6c1-1.5 1.4-3 1.4-3-.1-.1-2.3-.9-2.3-3.2z"/>
                    <path d="M11.4 2.6C12.2 1.6 12.7.3 12.5-.9c-1.2.1-2.6.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.6 1.4.1 2.8-.7 3.7-1.9z"/>
                  </svg>
                  Continue with Apple
                </button>
              </div>
            </>
          )}

          {/* ── Step: OTP ───────────────────────────────────────────── */}
          {step === "otp" && (
            <>
              <button
                onClick={() => { setStep("entry"); setOtp(["","","","","",""]); setError(null) }}
                className="mb-4 flex items-center gap-1.5 text-sm text-[#5A6259] hover:text-[#17211A] transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="ouma-display text-center text-2xl font-medium text-[#17211A]">
                Check WhatsApp
              </h1>
              <p className="mt-2 text-center text-sm text-[#5A6259]">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-[#17211A]">{phone}</span>{" "}
                on WhatsApp.
              </p>

              {/* 6-box OTP input */}
              <div
                className="mt-8 flex justify-center gap-2"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    className={`h-14 w-11 rounded-xl border-2 text-center text-xl font-bold text-[#17211A] outline-none transition ${
                      digit
                        ? "border-[#17211A] bg-[#E4EBE2]"
                        : "border-[#DDE3DA] bg-white focus:border-[#17211A]"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={otp.some((d) => !d) || loading}
                onClick={() => handleVerify(otp.join(""))}
                className="ouma-btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Verifying…" : "Verify code"}
              </button>

              {/* Resend */}
              <div className="mt-5 text-center">
                {resendCountdown > 0 ? (
                  <p className="text-xs text-[#5A6259]">
                    Resend in <span className="font-semibold text-[#5A6259]">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-[#17211A] hover:opacity-70 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend code
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Step: done ──────────────────────────────────────────── */}
          {step === "done" && (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-14 w-14 text-[#1D5C3B] mb-4" />
              <h2 className="ouma-display text-2xl font-medium text-[#17211A]">You&apos;re in!</h2>
              <p className="mt-2 text-sm text-[#5A6259]">Redirecting to the app…</p>
            </div>
          )}

        </div>

        {step === "entry" && (
          <Link
            href={next}
            className="mt-6 block text-center text-sm font-semibold text-[#5A6259] underline underline-offset-4 hover:text-[#17211A]"
          >
            Just looking? Browse without an account →
          </Link>
        )}
      </div>
    </div>
  )
}
