"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function OumaMobileStickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const heroEnd = () => {
      const el = document.getElementById("try")
      if (!el) return 400
      return el.getBoundingClientRect().bottom + window.scrollY
    }
    const onScroll = () => {
      setVisible(window.innerWidth < 768 && window.scrollY > heroEnd() - 120)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[10020] p-4 md:hidden ${
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      } transition-all duration-300 ease-out`}
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/login"
        className="ouma-btn-primary flex w-full justify-center shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
      >
        Start free trial
      </Link>
    </div>
  )
}
