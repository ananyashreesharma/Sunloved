import { ImageResponse } from "next/og"
import { readFile } from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const alt = "SkinLens: check any skincare label, free"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// The homepage's link preview.
export default async function Image() {
  const [regular, semibold] = await Promise.all(
    ["Rubik_400Regular.ttf", "Rubik_600SemiBold.ttf"].map((f) => readFile(path.join(process.cwd(), "assets/fonts", f))),
  )
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#F2ECE1", color: "#1A1A17", padding: "72px 80px", fontFamily: "Rubik" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 600 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, border: "4px solid #1A1A17" }} />
          SkinLens
        </div>
        <div style={{ marginTop: 70, fontSize: 92, fontWeight: 600, letterSpacing: -4, lineHeight: 1 }}>Check any skincare</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 600, letterSpacing: -4, lineHeight: 1.1 }}>
          <span style={{ background: "linear-gradient(to bottom, transparent 55%, rgba(242,190,70,.65) 55%)", padding: "0 6px" }}>label</span>, free.
        </div>
        <div style={{ marginTop: 34, fontSize: 32, color: "#615D55" }}>Plain words for your skin. Hidden steroids and mercury caught.</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Rubik", data: regular, weight: 400, style: "normal" }, { name: "Rubik", data: semibold, weight: 600, style: "normal" }] },
  )
}
