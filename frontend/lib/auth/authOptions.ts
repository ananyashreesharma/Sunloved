import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    }),

    // Email code sign-in: works in every country (the phone flow below was India-only).
    CredentialsProvider({
      id: "email-otp",
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null
        try {
          const res = await fetch(`${API}/auth/email-otp/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email.trim().toLowerCase(), code: credentials.code }),
          })
          if (!res.ok) return null
          const json = await res.json()
          const { userId, isNew } = json.data ?? json
          return { id: userId, email: credentials.email.trim().toLowerCase(), isNew: !!isNew }
        } catch {
          return null
        }
      },
    }),

    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null
        try {
          const res = await fetch(`${API}/auth/otp/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: credentials.phone, code: credentials.code }),
          })
          if (!res.ok) return null
          const json = await res.json()
          const { userId, isNew } = json.data ?? json
          return { id: userId, phone: credentials.phone, isNew: !!isNew }
        } catch {
          return null
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "apple") {
        try {
          await fetch(`${API}/auth/oauth/upsert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: account.provider,
              providerId: account.providerAccountId,
              name: user.name,
              email: user.email,
              avatarUrl: user.image,
            }),
          })
        } catch { /* non-fatal */ }
      }
      return true
    },

    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "email-otp" && user) {
        token.userId = user.id
        const u = user as unknown as { email?: unknown; isNew?: unknown }
        if (typeof u.email === "string") token.email = u.email
        if (typeof u.isNew === "boolean") token.isNew = u.isNew
      }

      if (account?.provider === "phone-otp" && user) {
        token.userId = user.id
        const u = user as unknown as { phone?: unknown; isNew?: unknown }
        if (typeof u.phone === "string") token.phone = u.phone
        if (typeof u.isNew === "boolean") token.isNew = u.isNew
      }

      if (account?.provider === "google" || account?.provider === "apple") {
        try {
          const res = await fetch(`${API}/auth/oauth/upsert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: account.provider,
              providerId: account.providerAccountId,
              name: token.name,
              email: token.email,
              avatarUrl: token.picture,
            }),
          })
          if (res.ok) {
            const json = await res.json()
            const { userId, isNew } = json.data ?? json
            token.userId = userId
            token.isNew = isNew
          }
        } catch { /* keep going */ }
      }

      // onboardingDone isn't known yet on first sign-in, and can change later (wizard finishing,
      // or a manual profile edit) — refetch whenever it's unknown or the client asks for a refresh
      // via useSession().update() at the end of the onboarding wizard.
      if (token.userId && (token.onboardingDone === undefined || trigger === "update")) {
        try {
          const res = await fetch(`${API}/auth/me`, {
            headers: {
              "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
              "x-user-id": String(token.userId),
            },
          })
          if (res.ok) {
            const json = await res.json()
            const me = json.data ?? json
            token.onboardingDone = Boolean(me?.onboardingDone)
          }
        } catch { /* keep previous value */ }
      }

      return token
    },

    async session({ session, token }) {
      const u = session.user as typeof session.user & {
        userId?: string
        phone?: string
        isNew?: boolean
        onboardingDone?: boolean
      }
      if (token.userId) u.userId = String(token.userId)
      if (typeof token.phone === "string") u.phone = token.phone
      if (typeof token.isNew === "boolean") u.isNew = token.isNew
      if (typeof token.onboardingDone === "boolean") u.onboardingDone = token.onboardingDone
      return session
    },
  },
}
