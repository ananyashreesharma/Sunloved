import { NextRequest, NextResponse } from "next/server"

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api"

// Public: asks the backend to email a six-digit sign-in code.
export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string }
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })
  try {
    const res = await fetch(`${API}/auth/email-otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ error: body?.message ?? body?.error?.message ?? "We couldn't send a code." }, { status: res.status })
    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ error: "We couldn't reach the server. Try again." }, { status: 502 })
  }
}
