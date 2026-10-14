import { NextRequest, NextResponse } from "next/server"
import { backendFetch, UnauthenticatedError } from "@/lib/server/backend-client"

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "morning"
  try {
    const data = await backendFetch(`/ouma/routine?type=${type}`)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
