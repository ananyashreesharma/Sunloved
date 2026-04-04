import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
/* Home scroll-story animations (scoped to .sunloved-scroll-story); safe to load globally. */
import "@/styles/scroll-story.css"
import { AppProviders } from "@/components/providers/AppProviders"
import { MeshParallaxBackground } from "@/components/MeshParallaxBackground"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sunloved - Find Effective Skincare Alternatives",
  description: "Evidence-backed swaps, verified ethics, and real value. Find effective skincare alternatives backed by data.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <MeshParallaxBackground />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}


