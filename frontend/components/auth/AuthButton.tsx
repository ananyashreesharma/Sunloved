"use client"

import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"

export function AuthButton({ className = "" }: { className?: string }) {
  const { status, data } = useSession()

  if (status === "loading") {
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold text-gray-500 ${className}`}>
        …
      </span>
    )
  }

  if (status === "authenticated") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link href="/app" className="hidden text-xs font-semibold text-gray-700 hover:text-gray-900 sm:inline">
          {data.user?.name ?? "Account"}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50"
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/app" })}
      className={`inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 ${className}`}
    >
      Log in
    </button>
  )
}

