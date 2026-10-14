// Web side of the five anonymous success events (see backend analytics module). A random id per
// browser, no ingredient text, no names. Fire-and-forget.

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api").replace(/\/+$/, "")
const KEY = "skinlens_install_id"

type EventType = "app_first_open" | "label_checked" | "routine_step_ticked" | "routine_completed" | "account_created"

function installId(): string | null {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
      send("app_first_open", id)
    }
    return id
  } catch {
    return null
  }
}

function send(type: EventType, id: string, detail?: string, country?: string | null) {
  fetch(`${API_BASE}/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, installId: id, platform: "web", ...(detail ? { detail } : {}), ...(country ? { country } : {}) }),
    keepalive: true,
  }).catch(() => {})
}

/** Call once on load so the first open is recorded before anything else. */
export function initAnalytics() {
  installId()
}

export function track(type: EventType, detail?: string, country?: string | null) {
  const id = installId()
  if (id) send(type, id, detail, country)
}
