import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { PopularSwaps } from "@/components/PopularSwaps"
import { HowWeDecide } from "@/components/HowWeDecide"
import { Footer } from "@/components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <PopularSwaps />
      <HowWeDecide />
      <Footer />
    </main>
  )
}


