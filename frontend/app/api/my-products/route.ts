import { NextResponse } from "next/server"
import { backendFetch, UnauthenticatedError } from "@/lib/server/backend-client"

// Named "my-products" (not "products") to stay clearly distinct from the public, unauthenticated
// catalog-search endpoint at /api/products/search on the Nest backend.
export async function GET() {
  try {
    const data = await backendFetch("/ouma/products")
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
