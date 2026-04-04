"use client"

import { useEffect, useRef, useState } from "react"

/** Initial background width as a multiple of viewport width (CSS 250% → 2.5). */
const BG_ZOOM = 2.5
/** Pixels background “width” shrinks per pixel of scroll (demo: fromTop / 3). */
const ZOOM_SCROLL_DIVISOR = 3
/** Max blur in px (demo grows without cap; cap keeps it usable). */
const MAX_BLUR_PX = 28
function useWantsScrollOverlay() {
  const [wants, setWants] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const vendor = navigator.vendor ?? ""
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(vendor)
    const isSafari = /Safari/.test(ua) && /Apple Computer/.test(vendor)
    setWants(!isChrome && !isSafari)
  }, [])

  return wants
}

export function MeshParallaxBackground() {
  const featureRef = useRef<HTMLDivElement>(null)
  const opaqueRef = useRef<HTMLDivElement>(null)
  const wantsOverlay = useWantsScrollOverlay()

  useEffect(() => {
    const feature = featureRef.current
    if (!feature) return

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")

    let raf = 0

    const applyStatic = () => {
      feature.style.backgroundSize = `${BG_ZOOM * 100}% auto`
      feature.style.filter = "var(--sun-mesh-filter)"
      feature.style.opacity = "1"
      if (opaqueRef.current) {
        opaqueRef.current.style.opacity = "0"
      }
    }

    const tick = () => {
      raf = 0
      const y = window.scrollY
      const w = window.innerWidth
      const docH = Math.max(document.documentElement.scrollHeight, 1)

      const basePx = BG_ZOOM * w
      let newSizePx = basePx - y / ZOOM_SCROLL_DIVISOR
      if (newSizePx < w) newSizePx = w

      const blurPx = Math.min(y / 100, MAX_BLUR_PX)
      /* Keep mesh texture from washing out completely on long pages */
      const opacity = Math.max(0.32, Math.min(1, 1 - (y / docH) * 0.72))

      feature.style.backgroundSize = `${newSizePx}px auto`
      feature.style.filter =
        blurPx > 0 ? `var(--sun-mesh-filter) blur(${blurPx}px)` : "var(--sun-mesh-filter)"
      feature.style.opacity = String(opacity)

      const opaque = opaqueRef.current
      if (opaque) {
        opaque.style.opacity = String(Math.min(1, y / 5000))
      }
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      onScroll()
    }

    const bind = () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(raf)
      raf = 0

      if (mq.matches) {
        applyStatic()
        return
      }

      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onResize, { passive: true })
      tick()
    }

    bind()
    mq.addEventListener("change", bind)

    return () => {
      mq.removeEventListener("change", bind)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(raf)
    }
  }, [wantsOverlay])

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        ref={featureRef}
        className="absolute inset-0 min-h-[100dvh] bg-center bg-no-repeat will-change-[background-size,filter,opacity]"
        style={{
          backgroundImage: "url(/mesh-gradient-bg.png)",
          backgroundSize: `${BG_ZOOM * 100}% auto`,
          filter: "var(--sun-mesh-filter)",
          boxShadow: "var(--sun-mesh-inset-shadow)",
        }}
      />
      {wantsOverlay ? (
        <div
          ref={opaqueRef}
          className="absolute inset-0 min-h-[100dvh] opacity-0"
          style={{ backgroundColor: "var(--sun-overlay-nonwebkit, #d5e5d8)" }}
        />
      ) : null}
    </div>
  )
}
