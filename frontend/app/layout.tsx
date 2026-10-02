import type { Metadata, Viewport } from "next"
import { Archivo_Narrow, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import "../globals.css"
import "@/styles/ouma.css"
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

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ouma-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SkinLens — Know What's Really On Your Skin",
  description:
    "India's first skincare ingredient intelligence app. Scan ingredients, flag hidden toxins, find safer Indian alternatives, and build daily routines that stick.",
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
    title: "SkinLens — Know What's Really On Your Skin",
    description: "Scan · Flag toxins · Find safer swaps · Build habits. Made for Indian skin.",
    url: "https://skinlens.in",
    siteName: "SkinLens",
    locale: "en_IN",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E4D3A",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <OumaHtmlClass />
          <OumaRoot className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</OumaRoot>
        </AppProviders>
      </body>
    </html>
  )
}
