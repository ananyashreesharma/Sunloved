"use client"

// Tonight's moon and the morning sunrise: the routine's progress, drawn (same as the mobile app).
// The moon's shadow slides off one share per step due today; the sun rises from the horizon.
// Always paired with "2 of 4 done" text, so the picture is never the only signal.

import { celestial } from "@skinlens/shared"

const SIZE = 128

export function Moon({ progress }: { progress: number }) {
  const complete = progress >= 1
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        borderRadius: "50%",
        flex: "none",
        overflow: "hidden",
        // Faint rim so even a new moon has a visible edge.
        boxShadow: `inset 0 0 0 1px var(--line)${complete ? `, 0 0 48px 6px ${celestial.moonLight[1]}55` : ""}`,
        background: `radial-gradient(circle at 38% 32%, ${celestial.moonLight[0]} 0%, ${celestial.moonLight[1]} 55%, ${celestial.moonLight[2]} 100%)`,
        transition: "box-shadow 1400ms var(--standard)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "50%",
          background: "var(--moon-shadow, #24211B)",
          transform: `translateX(${progress * (SIZE + 8)}px)`,
          transition: "transform 760ms var(--settle)",
        }}
      />
    </div>
  )
}

export function Sunrise({ progress }: { progress: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        borderRadius: "50%",
        flex: "none",
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px var(--line)",
        background: `linear-gradient(${celestial.dawnSky[0]}, ${celestial.dawnSky[1]})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: SIZE * 0.5,
          width: 60,
          height: 60,
          marginLeft: -30,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 40%, ${celestial.sunLight[0]}, ${celestial.sunLight[1]})`,
          transform: `translateY(${(1 - progress) * 62}px)`,
          transition: "transform 760ms var(--settle)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: SIZE * 0.76, bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--line)" }} />
    </div>
  )
}
