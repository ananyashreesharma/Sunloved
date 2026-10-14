import { SiteFooter, SiteHeader } from "./SiteChrome"

// Shared layout for the legal pages: readable column, plain headings.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <SiteHeader current="how" />
      <main className="v3-legal" style={{ flex: 1, width: "100%", maxWidth: 720, margin: "0 auto", padding: "40px 20px 72px", fontSize: 17, lineHeight: 1.6 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 600, letterSpacing: "-0.035em" }}>{title}</h1>
        <p style={{ margin: "8px 0 24px", fontSize: 14, color: "var(--ink2)" }}>Last updated {updated}</p>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
