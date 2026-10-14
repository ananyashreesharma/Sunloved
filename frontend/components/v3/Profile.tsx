"use client"

// The skin profile as a sentence ("Oily skin, with acne and dark spots, in India.") and its inline
// editor. Used by the checker and by Me on the web.

import { useMemo } from "react"
import { CONCERNS, COUNTRIES, countryByCode, MAX_CONCERNS, SKIN_TYPES } from "@skinlens/shared"
import { useCopy, useLang } from "@/lib/copy-context"

export type Profile = { country: string | null; skinType: string | null; concerns: string[] }

// English needs "the" before some country names ("in the United Kingdom").
const TAKES_THE = new Set(["US", "GB", "AE", "NL", "PH"])

/** Country name in the page's language ("the United Kingdom" in English sentences). */
export function countryLabel(code: string | null, lang = "en"): string | null {
  if (!code) return null
  let name = countryByCode(code)?.name ?? code
  try {
    name = new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? name
  } catch {
    /* fall back to our list */
  }
  return lang === "en" && TAKES_THE.has(code) ? `the ${name}` : name
}

/** "Oily skin, with acne and dark spots, in India." Each part opens the editor. */
/** Without `onEdit` the sentence is read-only and the answers are highlighted instead of linked. */
export function ProfileSentence({ profile, onEdit }: { profile: Profile; onEdit?: () => void }) {
  const C = useCopy()
  const lang = useLang()
  const type = profile.skinType ? C.skinTypes[profile.skinType] : null
  const concerns = profile.concerns.map((c) => (C.concernNames[c] ?? c).toLocaleLowerCase(lang))
  const link: React.CSSProperties = {
    font: "inherit",
    color: "inherit",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 5,
    textDecorationColor: "var(--ink3)",
  }
  const mark: React.CSSProperties = { background: "var(--done)", fontWeight: 400 }
  const part = (text: string) =>
    onEdit ? (
      <button style={link} onClick={onEdit}>
        {text}
      </button>
    ) : (
      <span style={mark}>{text}</span>
    )
  return (
    <p style={{ margin: 0, fontSize: 22, fontWeight: 300, lineHeight: 1.45 }}>
      {part(type && profile.skinType !== "unsure" ? C.skinOf(type) : C.anySkin)}
      {concerns.length > 0 && (
        <>
          {C.withC}
          {part(concerns.join(C.and))}
        </>
      )}
      {C.inC}
      {part(countryLabel(profile.country, lang) ?? "…")}.
    </p>
  )
}

export function ProfileEditor({ profile, onChange, onDone }: { profile: Profile; onChange: (p: Profile) => void; onDone: () => void }) {
  const C = useCopy()
  const lang = useLang()
  const countries = useMemo(
    () =>
      COUNTRIES.map((c) => {
        let name = c.name
        try {
          name = new Intl.DisplayNames([lang], { type: "region" }).of(c.code) ?? c.name
        } catch {
          /* keep */
        }
        return { code: c.code, name }
      }).sort((a, b) => a.name.localeCompare(b.name, lang)),
    [lang],
  )
  function toggleConcern(code: string) {
    const has = profile.concerns.includes(code)
    if (!has && profile.concerns.length >= MAX_CONCERNS) return
    onChange({ ...profile, concerns: has ? profile.concerns.filter((c) => c !== code) : [...profile.concerns, code] })
  }
  return (
    <div className="v3-fade" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, borderRadius: 18, background: "var(--surface)" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--ink2)" }}>
        {C.country}
        <select
          value={profile.country ?? ""}
          onChange={(e) => onChange({ ...profile, country: e.target.value })}
          style={{ minHeight: 44, padding: "0 12px", borderRadius: 12, border: "1.5px solid var(--line)", background: "transparent", color: "var(--ink)", font: "inherit", fontSize: 16, fontWeight: 400 }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div role="radiogroup" aria-label={C.skinType} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink2)" }}>{C.skinType}</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SKIN_TYPES.map((s) => (
            <button key={s.code} role="radio" className="v3-chip" aria-checked={profile.skinType === s.code} onClick={() => onChange({ ...profile, skinType: s.code })}>
              {C.skinTypes[s.code] ?? s.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink2)" }}>
          {C.concerns} · {profile.concerns.length}/{MAX_CONCERNS}
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CONCERNS.map((c) => (
            <button key={c.code} className="v3-chip" aria-pressed={profile.concerns.includes(c.code)} onClick={() => toggleConcern(c.code)}>
              {C.concernNames[c.code] ?? c.label}
            </button>
          ))}
        </div>
      </div>
      <button className="v3-btn" style={{ alignSelf: "flex-start", minHeight: 44, fontSize: 15 }} onClick={onDone}>
        {C.done}
      </button>
    </div>
  )
}

