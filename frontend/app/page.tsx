import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { PopularSwaps } from "@/components/PopularSwaps"
import { Footer } from "@/components/Footer"
import { searchProducts } from "@/lib/api"
import { ScrollStorySectionNav } from "@/components/home/ScrollStorySectionNav"
import { HomeTextScrollSection } from "@/components/home/HomeTextScrollSection"
import { HomeTwoColumnsSection } from "@/components/home/HomeTwoColumnsSection"
import { HomeSubscribeSection } from "@/components/home/HomeSubscribeSection"
import { PopularSwapsPastelBackdrop } from "@/components/PopularSwapsPastelBackdrop"

/**
 * Home: server-fetches the first page of popular products so Popular Swaps paints quickly;
 * the client still uses React Query for cache and refetch (see usePopularProductsQuery).
 */
export default async function Home() {
  let initialPopular: unknown[] | undefined
  try {
    const r = await searchProducts("niacinamide", 1, 20)
    const arr = r.products || r.data || []
    initialPopular = Array.isArray(arr) && arr.length > 0 ? arr : undefined
  } catch {
    initialPopular = undefined
  }

  return (
    <main className="mesh-page">
      <Header />
      {/* Scroll-driven section UX lives in styles/scroll-story.css (feature-detected). */}
      <div className="sunloved-scroll-story">
        <ScrollStorySectionNav />
        <div className="ss-scroll-hint" aria-hidden>
          <span>scroll</span>
          <span className="ss-divider" />
          <span>down</span>
        </div>

        <section id="masthead" className="ss-section ss-section--masthead">
          <div className="ss-flying-squares" aria-hidden>
            <div className="ss-square ss-square--a" />
            <div className="ss-square ss-square--b" />
            <div className="ss-square ss-square--c" />
          </div>
          <div className="ss-masthead-inner">
            <Hero mastheadScrollTitle />
          </div>
        </section>

        {/* One pastel backdrop for #tiles → subscribe; see globals.css for top feathering. */}
        <div className="ss-pastel-stack">
          <PopularSwapsPastelBackdrop />
          <section id="tiles" className="ss-section ss-section--tiles relative">
            <PopularSwaps embedded initialProducts={initialPopular} />
          </section>
          <HomeTextScrollSection />
          <HomeTwoColumnsSection />
          <HomeSubscribeSection />
        </div>
      </div>
      <Footer />
    </main>
  )
}
