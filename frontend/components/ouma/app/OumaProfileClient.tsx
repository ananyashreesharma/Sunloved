"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import {
  getMe,
  getNotificationPreferences,
  updateNotificationPreferences,
  getMyProducts,
  getRoutine,
  updateCountry,
  type MeResponse,
  type NotificationPreferences,
  type RoutineStepDto,
} from "@/lib/api"
import { COUNTRIES, DEFAULT_COUNTRY } from "@skinlens/shared"
import { useIsGuest } from "@/lib/use-guest"
import { loadGuestData, updateGuestData, getGuestRoutine, SKIN_TYPE_LABELS, CONCERN_LABELS } from "@/lib/guest-store"

const INK = "#17211A"
const MUTE = "#5A6259"
const ACCENT = "#1E4D3A"
const CARD = "#FFFFFF"
const LINE = "rgba(23,33,26,.07)"


const TONES: { v: NotificationPreferences["reminderTone"]; label: string }[] = [
  { v: "coach", label: "Coach" },
  { v: "plain", label: "Plain" },
  { v: "off", label: "Off" },
]

export function OumaProfileClient() {
  const isGuest = useIsGuest()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [productCount, setProductCount] = useState<number | null>(null)
  const [nightSteps, setNightSteps] = useState<RoutineStepDto[]>([])
  const [editingTimes, setEditingTimes] = useState(false)

  useEffect(() => {
    if (isGuest) {
      const data = loadGuestData()
      setMe({
        id: "guest",
        name: null,
        email: null,
        phone: null,
        avatarUrl: null,
        onboardingDone: true,
        country: data.country,
        skinType: data.skinType ? { code: data.skinType, label: SKIN_TYPE_LABELS[data.skinType] ?? data.skinType } : null,
        concerns: data.concerns.map((code) => ({ code, label: CONCERN_LABELS[code] ?? code })),
      })
      setPrefs({ morningTime: data.morningTime, nightTime: data.nightTime, channel: data.channel, reminderTone: data.reminderTone, muted: data.muted })
      setProductCount(data.steps.length)
      setNightSteps(getGuestRoutine("night").steps)
      return
    }
    getMe().then(setMe).catch(() => setMe(null))
    getNotificationPreferences().then(setPrefs).catch(() => setPrefs(null))
    getMyProducts().then((r) => setProductCount(r.products.length)).catch(() => setProductCount(null))
    getRoutine("night").then((r) => setNightSteps(r.steps)).catch(() => setNightSteps([]))
  }, [isGuest])

  async function changeCountry(code: string) {
    const previous = me
    setMe((m) => (m ? { ...m, country: code } : m)) // optimistic
    if (isGuest) {
      updateGuestData({ country: code })
      return
    }
    try {
      await updateCountry(code)
    } catch {
      setMe(previous) // revert
    }
  }

  async function patchPrefs(patch: Partial<NotificationPreferences>) {
    if (!prefs) return
    const next = { ...prefs, ...patch }
    setPrefs(next) // optimistic
    if (isGuest) {
      updateGuestData({
        ...patch,
        morningTime: patch.morningTime ?? undefined,
        nightTime: patch.nightTime ?? undefined,
      })
      return
    }
    try {
      const saved = await updateNotificationPreferences(patch)
      setPrefs(saved)
    } catch {
      setPrefs(prefs) // revert
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 pb-6" style={{ color: INK }}>
      <header className="flex items-center justify-between pt-1">
        <h1 className="ouma-display" style={{ fontSize: 28, textTransform: "uppercase" }}>
          Me
        </h1>
      </header>

      {/* ─── Skin profile ─────────────────────────────────────────── */}
      <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: 16 }}>
        <div className="flex items-baseline justify-between">
          <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
            Skin profile
          </p>
          <Link href="/onboarding" className="no-underline" style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>
            Edit
          </Link>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {me?.skinType && (
            <span style={{ padding: "6px 12px", borderRadius: 999, background: "#E4EBE2", fontSize: 13 }}>{me.skinType.label}</span>
          )}
          {me?.concerns.map((c) => (
            <span key={c.code} style={{ padding: "6px 12px", borderRadius: 999, background: "#E4EBE2", fontSize: 13 }}>
              {c.label}
            </span>
          ))}
          {!me?.skinType && me?.concerns.length === 0 && (
            <span style={{ fontSize: 13, color: MUTE, fontStyle: "italic" }}>Not set yet — tap Edit to add it.</span>
          )}
        </div>
        {productCount != null && productCount > 0 && (me?.skinType || me?.concerns.length) && (
          <p style={{ marginTop: 10, fontSize: 12.5, color: MUTE }}>
            Changing this updates the flags on {productCount} of your products.
          </p>
        )}
      </div>

      {/* ─── Country ──────────────────────────────────────────────── */}
      <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: 16 }}>
        <label
          htmlFor="profile-country"
          className="ouma-display"
          style={{ display: "block", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}
        >
          Country
        </label>
        <select
          id="profile-country"
          value={me?.country ?? DEFAULT_COUNTRY}
          onChange={(e) => changeCountry(e.target.value)}
          style={{ marginTop: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${LINE}`, background: CARD, color: INK, fontSize: 14.5 }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <p style={{ marginTop: 8, fontSize: 12.5, color: MUTE }}>Formulas, rules and prices are matched to where you live.</p>
      </div>

      {/* ─── Reminders ────────────────────────────────────────────── */}
      <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: 16 }}>
        <p className="ouma-display" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTE }}>
          Reminders
        </p>

        {editingTimes ? (
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: MUTE }}>Morning</span>
              <input
                type="time"
                value={prefs?.morningTime ?? ""}
                onChange={(e) => patchPrefs({ morningTime: e.target.value })}
                className="ouma-mono"
                style={{ display: "block", marginTop: 4, fontSize: 15, border: `1px solid ${LINE}`, borderRadius: 8, padding: "6px 8px", width: "100%" }}
              />
            </label>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: MUTE }}>Night</span>
              <input
                type="time"
                value={prefs?.nightTime ?? ""}
                onChange={(e) => patchPrefs({ nightTime: e.target.value })}
                className="ouma-mono"
                style={{ display: "block", marginTop: 4, fontSize: 15, border: `1px solid ${LINE}`, borderRadius: 8, padding: "6px 8px", width: "100%" }}
              />
            </label>
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="ouma-mono" style={{ fontSize: 14.5 }}>
              AM · {prefs?.morningTime ?? "–"} · PM · {prefs?.nightTime ?? "–"}
            </span>
            <button
              type="button"
              onClick={() => setEditingTimes(true)}
              style={{ fontSize: 13, fontWeight: 600, color: ACCENT, background: "none", border: "none", cursor: "pointer" }}
            >
              Change
            </button>
          </div>
        )}

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14.5 }}>Channel</span>
          <span style={{ fontSize: 13, color: MUTE }}>Push · WhatsApp soon</span>
        </div>

        <p style={{ marginTop: 14, fontSize: 13, color: MUTE }}>Tone</p>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          {TONES.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => patchPrefs({ reminderTone: t.v })}
              style={{
                flex: 1,
                textAlign: "center",
                padding: 10,
                borderRadius: 10,
                border: prefs?.reminderTone === t.v ? `1.5px solid ${ACCENT}` : `1px solid ${LINE}`,
                background: "#fff",
                fontSize: 13.5,
                fontWeight: prefs?.reminderTone === t.v ? 600 : 400,
                color: prefs?.reminderTone === t.v ? ACCENT : INK,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <NotificationPreview time={prefs?.nightTime ?? "21:30"} tone={prefs?.reminderTone ?? "coach"} steps={nightSteps} />

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14.5 }}>Mute all reminders</span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs?.muted ?? false}
            onClick={() => patchPrefs({ muted: !prefs?.muted })}
            style={{
              width: 42,
              height: 24,
              borderRadius: 12,
              background: prefs?.muted ? ACCENT : "#D2DAD1",
              position: "relative",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: prefs?.muted ? 20 : 2,
                width: 20,
                height: 20,
                borderRadius: 10,
                background: "#fff",
                boxShadow: "0 1px 2px rgba(0,0,0,.2)",
                transition: "left 150ms ease",
              }}
            />
          </button>
        </div>
      </div>

      {/* ─── Account ──────────────────────────────────────────────── */}
      {/* Referral programme removed: it showed the same hardcoded code to everyone, with no backend. */}
      <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 16px" }}>
          <span style={{ fontSize: 14.5 }}>Plan</span>
          <span style={{ fontSize: 13, color: MUTE }}>Free — scans stay free</span>
        </div>
      </div>

      <Link
        href="/app/discover"
        className="no-underline flex items-center justify-between"
        style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: "15px 16px", color: INK }}
      >
        <span style={{ fontSize: 14.5 }}>Learn — brand truths &amp; ingredient guides</span>
        <ChevronRight className="h-4 w-4" style={{ color: MUTE }} />
      </Link>
      <Link
        href="/app/insights"
        className="no-underline flex items-center justify-between"
        style={{ background: CARD, borderRadius: 16, border: `1px solid ${LINE}`, padding: "15px 16px", color: INK }}
      >
        <span style={{ fontSize: 14.5 }}>Insights — how your saved scans break down</span>
        <ChevronRight className="h-4 w-4" style={{ color: MUTE }} />
      </Link>

      <p style={{ textAlign: "center", fontSize: 11, color: MUTE }}>SkinLens</p>
    </div>
  )
}

function NotificationPreview({
  time,
  tone,
  steps,
}: {
  time: string
  tone: NotificationPreferences["reminderTone"]
  steps: RoutineStepDto[]
}) {
  const stepNames = steps.map((s) => s.name).join(" · ")
  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ fontSize: 13, color: MUTE }}>Tonight&apos;s message will look like:</p>
      <div style={{ marginTop: 8, background: "#F3F5EF", borderRadius: 12, padding: "13px 14px", border: `1px solid ${LINE}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: ACCENT, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>SL</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>SkinLens</span>
          <span className="ouma-mono" style={{ marginLeft: "auto", fontSize: 11, color: MUTE }}>
            {time}
          </span>
        </div>
        <div style={{ marginTop: 7, fontSize: 13, fontWeight: 600 }}>
          PM routine {steps.length > 0 && <span className="ouma-mono" style={{ fontWeight: 400, color: MUTE }}>· {steps.length} steps</span>}
        </div>
        <div style={{ fontSize: 12.5, color: "#2A342C", marginTop: 2 }}>
          {tone === "off" ? "Reminders are off." : stepNames || "A gentle nudge for your evening steps."}
        </div>
        {tone === "coach" && (
          <div style={{ fontSize: 12.5, color: MUTE, marginTop: 4, fontStyle: "italic" }}>
            &quot;Consistency beats intensity.&quot;
          </div>
        )}
        {tone !== "off" && (
          <div style={{ marginTop: 9, display: "flex", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, border: `1px solid rgba(30,77,58,.3)`, borderRadius: 7, padding: "4px 12px" }}>
              Done ✓
            </span>
            <span style={{ fontSize: 12, color: MUTE, border: `1px solid ${LINE}`, borderRadius: 7, padding: "4px 12px" }}>
              Open
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
