"use client"

// Header and footer for the public V3 pages: the checker, ingredient and product pages, How we
// rate, legal pages. Words follow the page's language (lib/copy-context), English by default.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LANGS } from "@/lib/checker-copy"
import { useCopy, useLang } from "@/lib/copy-context"

export function SiteHeader({ current }: { current: "check" | "how" | "routine" }) {
  const C = useCopy()
  const nav = [
    { key: "check", href: "/", label: C.nav.check },
    { key: "how", href: "/how-we-rate", label: C.nav.how },
    { key: "routine", href: "/app/routine", label: C.nav.routine },
  ] as const
  return (
    <header className="v3-header">
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", textDecoration: "none" }}>
        <span aria-hidden style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid var(--ink)" }} />
        SkinLens
      </Link>
      <nav aria-label="Main" className="v3-nav">
        {nav.map((n) => (
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
  const C = useCopy()
  const lang = useLang()
  const path = usePathname() ?? "/"
  return (
    <footer
      style={{
        padding: "24px clamp(20px, 4vw, 48px)",
        borderTop: "1px solid var(--line)",
        fontSize: 13,
        color: "var(--ink2)",
        display: "flex",
        gap: "12px 24px",
        flexWrap: "wrap",
      }}
    >
      <span>{C.footer.noAds}</span>
      <span>{C.footer.rule}</span>
      <Link href="/ingredients">{C.footer.ingredients}</Link>
      <Link href="/legal/privacy">{C.footer.privacy}</Link>
      <Link href="/legal/terms">{C.footer.terms}</Link>
      <Link href="/legal/disclaimer">{C.footer.medical}</Link>
      <span style={{ display: "flex", gap: 12 }} aria-label="Language">
        {LANGS.map((l) => (
          <a
            key={l.code}
            href={`/api/lang?l=${l.code}&next=${encodeURIComponent(path)}`}
            lang={l.code}
            aria-current={l.code === lang ? "true" : undefined}
            style={{ fontWeight: l.code === lang ? 600 : 400, color: l.code === lang ? "var(--ink)" : "var(--ink2)" }}
          >
            {l.name}
          </a>
        ))}
      </span>
    </footer>
  )
}
