import { NextRequest, NextResponse } from "next/server"
import { backendFetch, UnauthenticatedError } from "@/lib/server/backend-client"

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7)
  try {
    const data = await backendFetch(`/ouma/streak/history?month=${month}`)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
