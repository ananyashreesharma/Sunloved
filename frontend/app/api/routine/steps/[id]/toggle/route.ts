import { NextRequest, NextResponse } from "next/server"
import { backendFetch, UnauthenticatedError } from "@/lib/server/backend-client"

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await backendFetch(`/ouma/routine/steps/${params.id}/toggle`, { method: "PATCH" })
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
