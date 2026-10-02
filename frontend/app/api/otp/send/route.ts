import { NextRequest, NextResponse } from "next/server"

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 })
  }

  try {
    const res = await fetch(`${API}/auth/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: body.phone }),
    })
    const json = await res.json()
    return NextResponse.json(json, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 })
  }
}
