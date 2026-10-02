import { NextRequest, NextResponse } from "next/server"
import { backendFetch, UnauthenticatedError } from "@/lib/server/backend-client"

export async function POST(req: NextRequest) {
  const body = await req.json()
  try {
    const data = await backendFetch("/ouma/scans", {
      method: "POST",
      body: JSON.stringify(body),
    })
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
