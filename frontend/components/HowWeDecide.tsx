"use client"

import { howWeDecideItems, badges } from "@/lib/data"
import { Button } from "./ui/button"
import Link from "next/link"
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

export function HowWeDecide() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          How we decide.
        </h2>
        <p className="text-gray-600 text-lg mb-16 max-w-3xl">
          We don't do hype. Our recommendations are based on objective,
          transparent data points. No "clean" labels, just the facts.
        </p>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Methodology */}
          <div className="space-y-8">
            {howWeDecideItems.map((item) => {
              const IconComponent =
                iconMap[item.icon as keyof typeof iconMap]
              return (
                <div key={item.id} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-teal-100">
                      <IconComponent className="w-6 h-6 text-teal-700" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: Badges */}
          <div className="bg-white rounded-2xl p-8 lg:p-12 border border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">
              Our Badges, Explained
            </h3>
            <div className="space-y-6">
              {badges.map((badge) => {
                const IconComponent =
                  iconMap[badge.icon as keyof typeof iconMap]
                return (
                  <div key={badge.id} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {IconComponent ? (
                        <IconComponent className="w-5 h-5 text-teal-700" />
                      ) : (
                        <span className="text-teal-700">●</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {badge.title}
                      </h4>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Learn More Button */}
        <Link href="/how-we-decide">
          <Button className="bg-primary hover:bg-teal-800 text-white font-semibold">
            Learn More
          </Button>
        </Link>
      </div>
    </section>
  )
}

