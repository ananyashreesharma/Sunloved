import type { Metadata, Viewport } from "next"
import { Archivo_Narrow, Instrument_Sans, JetBrains_Mono, Rubik } from "next/font/google"
import "../globals.css"
import "@/styles/ouma.css"
import "@/styles/v3.css"
import { AppProviders } from "@/components/providers/AppProviders"
import { OumaHtmlClass } from "@/components/ouma/OumaHtmlClass"
import { OumaRoot } from "@/components/ouma/OumaRoot"

const display = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ouma-display",
  display: "swap",
})

const body = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-ouma-body",
  display: "swap",
})

// V3 type (styles/v3.css). Light 300 for display, 400–600 for text.
const rubik = Rubik({
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ouma-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SkinLens: check any skincare label, free",
  description:
    "Paste an ingredient list and get a plain-language reading for your skin. Keep a routine you'll actually stick to. No ads, no affiliate links, no sponsored verdicts.",
  metadataBase: new URL("https://skinlens.in"),
  alternates: { canonical: "https://skinlens.in" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkinLens",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/icons/icon-512.png" }],
  },
  openGraph: {
    title: "SkinLens: check any skincare label, free",
    description: "Every label, in plain words, for your skin. And a routine you'll actually stick to.",
    url: "https://skinlens.in",
    siteName: "SkinLens",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2ECE1",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <OumaHtmlClass />
          <OumaRoot className={`${display.variable} ${body.variable} ${mono.variable} ${rubik.variable}`}>{children}</OumaRoot>
        </AppProviders>
      </body>
    </html>
  )
}
