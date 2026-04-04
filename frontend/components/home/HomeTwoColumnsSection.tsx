import Link from "next/link"
import { howWeDecideItems, badges } from "@/lib/data"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Leaf,
  Beaker,
  AlertCircle,
  Clock,
  Wind,
  Droplet,
  Shield,
  Sparkles,
  Heart,
} from "lucide-react"

const iconMap = {
  beaker: Beaker,
  leaf: Leaf,
  calculator: BarChart3,
  paw: Heart,
  wind: Wind,
  bottle: Droplet,
  wine: Droplet,
  "leaf-outline": Leaf,
  shield: Shield,
  sparkles: Sparkles,
  clock: Clock,
  question: AlertCircle,
}

export function HomeTwoColumnsSection() {
  return (
    <section id="two-columns" className="ss-section ss-section--two-columns">
      <div className="ss-two-columns">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center sm:text-left">
          How we decide — at a glance
        </h2>
        <div className="ss-content">
          <div className="ss-cards space-y-0">
            {howWeDecideItems.map((item) => {
              const Icon = iconMap[item.icon]
              return (
                <div key={item.id} className="ss-card rounded-xl">
                  <div className="flex gap-3 mb-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                      <Icon className="h-5 w-5 text-teal-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 m-0">{item.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm m-0">{item.description}</p>
                </div>
              )
            })}
          </div>
          <div>
            <div className="ss-preview">
              <div className="ss-preview-inner" />
            </div>
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Our badges, explained</h3>
              <ul className="space-y-4 list-none m-0 p-0">
                {badges.map((badge) => {
                  const Icon = iconMap[badge.icon as keyof typeof iconMap]
                  return (
                    <li key={badge.id} className="flex gap-3">
                      <span className="mt-0.5 text-teal-700">
                        {Icon ? <Icon className="h-4 w-4" /> : "●"}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 m-0 text-sm">{badge.title}</p>
                        <p className="text-gray-600 text-xs m-0 mt-0.5">{badge.description}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <Link href="/how-we-decide" className="mt-6 inline-block">
                <Button className="bg-primary hover:bg-teal-800 text-white font-semibold">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
