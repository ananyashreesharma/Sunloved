import type { Risk } from "@skinlens/shared"

const KEY = "ouma-recent-scans"
const MAX = 8

export type RecentScan = {
  productId?: string
  /** When the user analyzed a raw INCI string (no catalog product). */
  inci?: string
  name: string
  brand?: string
  at: string
  riskLabel: Risk
}

function load(): RecentScan[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as RecentScan[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function save(items: RecentScan[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
}

export function getRecentScans(): RecentScan[] {
  return load()
}

function sameScan(a: RecentScan, b: RecentScan) {
  if (a.productId && b.productId && a.productId === b.productId) return true
  if (a.inci && b.inci && a.inci === b.inci) return true
  return false
}

export function pushRecentScan(entry: RecentScan) {
  const next = [entry, ...load().filter((x) => !sameScan(x, entry))]
  save(next)
}

export { riskFromScore } from "@skinlens/shared"
