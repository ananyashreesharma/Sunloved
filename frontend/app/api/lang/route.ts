import { NextRequest, NextResponse } from "next/server"

// Remember the chosen language (footer links), then go back to the page.
export function GET(req: NextRequest) {
  const l = req.nextUrl.searchParams.get("l")
  const next = req.nextUrl.searchParams.get("next") ?? "/"
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/"
  const res = NextResponse.redirect(new URL(safe, req.url))
  if (l === "en" || l === "es" || l === "ar") res.cookies.set("lang", l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
  return res
}
