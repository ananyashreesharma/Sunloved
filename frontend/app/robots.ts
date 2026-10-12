import type { MetadataRoute } from "next"
import { SITE } from "@/lib/shared-check"

export default function robots(): MetadataRoute.Robots {
  return {
    // Personal pages (routine, Me) and API routes have nothing for search engines.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/api/", "/login", "/onboarding", "/c"] }],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
