// Header and footer for the public V3 pages: the checker, How we rate.

import Link from "next/link"

const NAV = [
  { key: "check", href: "/", label: "Check a label" },
  { key: "how", href: "/how-we-rate", label: "How we rate" },
  { key: "routine", href: "/app/routine", label: "Your routine" },
] as const

export function SiteHeader({ current }: { current: (typeof NAV)[number]["key"] }) {
  return (
    <header className="v3-header">
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", textDecoration: "none" }}>
        <span aria-hidden style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid var(--ink)" }} />
        SkinLens
      </Link>
      <nav aria-label="Main" className="v3-nav">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            aria-current={n.key === current ? "page" : undefined}
            style={{
              textDecoration: "none",
              padding: "6px 0",
              ...(n.key === current ? { fontWeight: 600, boxShadow: "inset 0 -2px 0 var(--ink)" } : { color: "var(--ink2)" }),
            }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer
      style={{
        padding: "24px clamp(20px, 4vw, 48px)",
        borderTop: "1px solid var(--line)",
        fontSize: 13,
        color: "var(--ink2)",
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <span>No ads. No affiliate links. No sponsored verdicts.</span>
      <span>If we can rate less than 70% of a label, we don&apos;t give a verdict.</span>
      <Link href="/ingredients">Ingredients A–Z</Link>
      <Link href="/legal/privacy">Privacy</Link>
      <Link href="/legal/terms">Terms</Link>
      <Link href="/legal/disclaimer">Not medical advice</Link>
    </footer>
  )
}
