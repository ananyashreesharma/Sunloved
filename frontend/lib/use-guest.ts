"use client"

import { useSession } from "next-auth/react"

/**
 * True whenever we shouldn't call guarded endpoints — including the brief "loading" moment
 * before NextAuth resolves the session, so we never fire a doomed authenticated fetch.
 */
export function useIsGuest(): boolean {
  const { status } = useSession()
  return status !== "authenticated"
}
