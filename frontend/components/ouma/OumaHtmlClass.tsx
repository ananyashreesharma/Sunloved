"use client"

import { useEffect } from "react"

/** Adds `ouma-site` on <html> for global cream background and legacy mesh hiding. */
export function OumaHtmlClass() {
  useEffect(() => {
    document.documentElement.classList.add("ouma-site")
    return () => document.documentElement.classList.remove("ouma-site")
  }, [])
  return null
}
