"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

export function OumaRoot({ className, children }: { className: string; children: ReactNode }) {
  const pathname = usePathname()
  const appMode = pathname?.startsWith("/app") ?? false
  return <div className={`${className} ouma-root${appMode ? " ouma-app-mode" : ""}`}>{children}</div>
}
