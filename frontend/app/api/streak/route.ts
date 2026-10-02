import { NextResponse } from "next/server"
import { backendFetch, UnauthenticatedError } from "@/lib/server/backend-client"

export async function GET() {
  try {
    const data = await backendFetch("/ouma/streak")
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
