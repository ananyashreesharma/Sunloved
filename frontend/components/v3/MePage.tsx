"use client"

// V3 Me (web): the skin profile as an editable sentence, My products, Streak history, reminders
// (which live in the phone app; the web can't send them) and the account. Guests keep their
// profile in this browser; accounts save it to the server.

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { completeOnboarding, getMe, updateCountry } from "@/lib/api"
import { loadGuestData, updateGuestData } from "@/lib/guest-store"
import { useIsGuest } from "@/lib/use-guest"
import { ProfileEditor, ProfileSentence, type Profile } from "./Profile"

export function MePage() {
  const isGuest = useIsGuest()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<Profile>({ country: null, skinType: null, concerns: [] })
  const [editing, setEditing] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    if (isGuest) {
      const g = loadGuestData()
      setProfile({ country: g.country, skinType: g.skinType, concerns: g.concerns })
      return
    }
    getMe()
      .then((me) => setProfile({ country: me.country, skinType: me.skinType?.code ?? null, concerns: me.concerns.map((c) => c.code) }))
      .catch(() => {})
  }, [isGuest])

  async function done() {
    setEditing(false)
    setSaveError(false)
    if (isGuest) {
      updateGuestData({ country: profile.country, skinType: profile.skinType, concerns: profile.concerns })
      return
    }
    try {
      if (profile.skinType) await completeOnboarding({ skinType: profile.skinType, concerns: profile.concerns, country: profile.country ?? undefined })
      else if (profile.country) await updateCountry(profile.country)
    } catch {
      setSaveError(true)
    }
  }

  const rows: [string, string][] = [
    ["My products", "/app/products"],
    ["Streak history", "/app/routine/history"],
  ]

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 48, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.05 }}>Me</h1>
      <div style={{ marginTop: 16 }}>
        <ProfileSentence profile={profile} onEdit={() => setEditing(true)} />
      </div>
      {editing ? (
        <div style={{ marginTop: 12 }}>
          <ProfileEditor profile={profile} onChange={setProfile} onDone={done} />
        </div>
      ) : (
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink2)" }}>
          {saveError ? "That didn't save. Check your connection and try again." : "Click any part to change it."}
        </p>
      )}

      <nav aria-label="Me" style={{ marginTop: 24, borderTop: "1px solid var(--line)" }}>
        {rows.map(([label, href]) => (
          <Link key={href} href={href} style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)", textDecoration: "none", fontSize: 17 }}>
            {label}
            <span aria-hidden style={{ color: "var(--ink3)" }}>
              →
            </span>
          </Link>
        ))}
      </nav>

      <div className="v3-label" style={{ marginTop: 28, marginBottom: 8 }}>
        Reminders
      </div>
      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5 }}>
        Reminders come from the SkinLens app on your phone, at the times you choose there. The website can&apos;t send them.
      </p>

      <div className="v3-label" style={{ marginTop: 28, marginBottom: 8 }}>
        Account
      </div>
      {isGuest ? (
        <>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5 }}>Your routine and checks are saved in this browser only.</p>
          <Link href="/login?next=/app/profile" style={{ display: "inline-flex", minHeight: 48, alignItems: "center", fontSize: 15, fontWeight: 500 }}>
            Sign in to keep them in an account
          </Link>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 17 }}>Signed in{session?.user?.email ? ` as ${session.user.email}` : ""}.</p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ minHeight: 48, padding: 0, border: "none", background: "none", color: "var(--ink)", font: "inherit", fontSize: 15, fontWeight: 500, textDecoration: "underline", cursor: "pointer" }}
          >
            Sign out
          </button>
        </>
      )}

      <div className="v3-label" style={{ marginTop: 28, marginBottom: 8 }}>
        Plan
      </div>
      <p style={{ margin: 0, fontSize: 19, lineHeight: 1.45 }}>Free. Checking ingredients is always free.</p>
      <p style={{ margin: "20px 0 0", fontSize: 14 }}>
        <Link href="/how-we-rate">How we rate</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/terms">Terms</Link>
      </p>
    </div>
  )
}
