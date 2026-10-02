"use client"

import { useEffect, useState } from "react"

export function OumaScrollProgress() {
  const [p, setP] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onScroll = () => {
      const doc = document.documentElement
      const scrollTop = window.scrollY || doc.scrollTop
      const max = doc.scrollHeight - window.innerHeight
      setP(max > 0 ? Math.min(1, scrollTop / max) : 0)
    }
    onScroll()
    if (mq.matches) return
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div
      className="ouma-scroll-progress"
      style={{ transform: `scaleX(${p})` }}
      aria-hidden
    />
  )
}
