"use client"

// "Talk to me" form: a message and an optional reply address, sent to the SkinLens server.

import { useState } from "react"
import { getPublicApiBase } from "@/lib/api"

export const FOUNDER_EMAIL = "anannyashree1425@gmail.com"

export function TalkForm() {
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canSend = message.trim().length >= 2 && emailOk && state !== "sending"

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return
    setState("sending")
    const res = await fetch(`${getPublicApiBase()}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim(), ...(email.trim() ? { replyTo: email.trim() } : {}), platform: "web" }),
    }).catch(() => null)
    setState(res?.ok ? "sent" : "error")
  }

  const field: React.CSSProperties = { width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid var(--line)", background: "var(--surface)", color: "var(--ink)", font: "inherit", fontSize: 17, outline: "none" }

  return (
    <div style={{ marginTop: 28 }}>
      {state === "sent" ? (
        <div style={{ padding: 20, borderRadius: 18, background: "var(--surface)" }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>Thank you.</div>
          <p style={{ margin: "6px 0 0", fontSize: 16, lineHeight: 1.5, color: "var(--ink2)" }}>I read every message. If you left your email, I&apos;ll write back.</p>
          <button type="button" onClick={() => (setMessage(""), setState("idle"))} style={{ marginTop: 10, minHeight: 44, background: "none", border: "none", padding: 0, font: "inherit", fontSize: 16, textDecoration: "underline", color: "var(--ink)", cursor: "pointer" }}>
            Write another
          </button>
        </div>
      ) : (
        <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write anything…" aria-label="Your message" dir="auto" style={{ ...field, minHeight: 170, resize: "vertical", lineHeight: 1.5 }} />
          <label style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: "var(--ink2)" }} htmlFor="reply">
            Your email (optional)
          </label>
          <input id="reply" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...field, borderColor: emailOk ? "var(--line)" : "var(--t-avoid)" }} />
          <span style={{ fontSize: 13, color: "var(--ink2)" }}>Only if you&apos;d like a reply. Used for nothing else.</span>
          {state === "error" && <span style={{ fontSize: 15, color: "var(--t-avoid)" }}>That didn&apos;t send. Check your connection and try again, or email me directly.</span>}
          <button className="v3-btn" type="submit" disabled={!canSend} style={{ marginTop: 8, maxWidth: 240 }}>
            {state === "sending" ? "Sending…" : "Send"}
          </button>
        </form>
      )}
      <p style={{ marginTop: 28, fontSize: 15, color: "var(--ink2)" }}>
        Prefer email? Write to me at <a href={`mailto:${FOUNDER_EMAIL}?subject=SkinLens`}>{FOUNDER_EMAIL}</a>
      </p>
    </div>
  )
}
