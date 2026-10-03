import { NextRequest, NextResponse } from "next/server"
import { backendFetch, UnauthenticatedError } from "@/lib/server/backend-client"

function fail(err: unknown) {
  if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  return NextResponse.json({ error: (err as Error).message }, { status: 502 })
}

/** Rename a step or change its frequency. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = await backendFetch(`/ouma/routine/steps/${params.id}`, { method: "PATCH", body: JSON.stringify(body) })
    return NextResponse.json(data)
  } catch (err) {
    return fail(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await backendFetch(`/ouma/routine/steps/${params.id}`, { method: "DELETE" })
    return NextResponse.json(data)
  } catch (err) {
    return fail(err)
  }
}
