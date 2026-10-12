import { ImageResponse } from "next/og"
import { readFile } from "fs/promises"
import path from "path"
import { readLabel, resolveLabel, VERDICT_TEXT } from "@/lib/shared-check"

// Rubik (Open Font License), the app's typeface, bundled so previews match the product.
const fonts = Promise.all(
  ["Rubik_400Regular.ttf", "Rubik_600SemiBold.ttf"].map((f) => readFile(path.join(process.cwd(), "assets/fonts", f))),
)

export const runtime = "nodejs"

// Link preview for a shared check (WhatsApp, Instagram, X): the product, the verdict with its
// highlighter mark, and the main reason. 1200×630.
const MARK = { GREEN: "rgba(110,180,130,.55)", YELLOW: "rgba(242,190,70,.65)", RED: "rgba(232,130,100,.55)" } as const

export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams)
  const label = await resolveLabel(sp)
  const read = label ? await readLabel(label.inci) : null
  const verdict = read?.verdict ?? null
  const words = verdict ? VERDICT_TEXT[verdict] : "We can't judge this one yet."
  // The main reason (the full note is on the page).
  // Whole sentences only, as many as fit in about two lines.
  const first = (t: string) => {
    const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [t]
    let out = ""
    for (const x of sentences) if ((out + x).length <= 170 || !out) out += x
    return out.trim()
  }
  const reason = read?.flagged[0] ? `${read.flagged[0].name}: ${first(read.flagged[0].line)}` : first(read?.summary ?? "")
  const [regular, semibold] = await fonts
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#F2ECE1", color: "#1A1A17", padding: "64px 72px", fontFamily: "Rubik" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, border: "4px solid #1A1A17" }} />
          SkinLens
        </div>
        <div style={{ marginTop: 48, fontSize: 34, color: "#615D55" }}>{(label?.name ?? "A skincare label").slice(0, 60)}</div>
        <div style={{ marginTop: 14, display: "flex", fontSize: 96, fontWeight: 600, letterSpacing: -4 }}>
          <span style={verdict ? { background: `linear-gradient(to bottom, transparent 55%, ${MARK[verdict]} 55%)`, padding: "0 6px" } : {}}>{words}</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 30, lineHeight: 1.35, color: "#1A1A17", maxWidth: 1000 }}>{reason.slice(0, 160)}</div>
        <div style={{ marginTop: "auto", fontSize: 26, color: "#615D55" }}>Verdicts are personal. Check it for your own skin at skinlens.in</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Rubik", data: regular, weight: 400, style: "normal" },
        { name: "Rubik", data: semibold, weight: 600, style: "normal" },
      ],
    },
  )
}
