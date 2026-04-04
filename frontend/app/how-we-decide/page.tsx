import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { howWeDecideItems, badges } from "@/lib/data"
import {
  BarChart3,
  Leaf,
  Beaker,
  AlertCircle,
  Clock,
  Wind,
  FlaskConical,
  Wine,
  Shield,
  Sparkles,
} from "lucide-react"

const iconMap = {
  beaker: Beaker,
  leaf: Leaf,
  calculator: BarChart3,
  paw: Leaf,
  wind: Wind,
  clock: Clock,
  question: AlertCircle,
  bottle: FlaskConical,
  wine: Wine,
  "leaf-outline": Leaf,
  shield: Shield,
  sparkles: Sparkles,
}

export const metadata = {
  title: "How We Decide - Sunloved",
  description: "Learn about our methodology for finding skincare alternatives",
}

export default function HowWeDecidePage() {
  return (
    <main className="mesh-page">
      <Header />
      
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
            How we decide.
          </h1>
          
          <p className="text-xl text-gray-600 mb-16">
            We don't do hype. Our recommendations are based on objective, transparent data points. No "clean" labels, just the facts.
          </p>

          <div className="space-y-16">
            {howWeDecideItems.map((item) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap]
              return (
                <div key={item.id} className="flex gap-8">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary">
                      <IconComponent className="w-8 h-8 text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      {item.title}
                    </h2>
                    <p className="text-gray-600 text-lg">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-20 bg-white rounded-2xl p-12 border border-gray-200">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8">
              Our Badges, Explained
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {badges.map((badge) => {
                const IconComponent = iconMap[badge.icon as keyof typeof iconMap]
                return (
                  <div key={badge.id} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {badge.title}
                      </h4>
                      <p className="text-gray-600">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}


