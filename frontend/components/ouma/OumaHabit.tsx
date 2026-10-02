import { Flame, MessageCircle, Zap } from "lucide-react"
import { OumaSection } from "./OumaSection"

const points = [
  {
    icon: Flame,
    title: "Build a streak. Keep your routine.",
    body: "Log your AM and PM routine daily. SkinLens tracks your streak, celebrates milestones, and gently nudges you back if you miss a day.",
  },
  {
    icon: MessageCircle,
    title: "Affirmations that actually mean something.",
    body: "Not generic wellness quotes. Messages tied to your specific actions — 'You just removed Parabens from your routine. Your skin noticed.'",
  },
  {
    icon: Zap,
    title: "Morning and night. Built into your day.",
    body: "Set reminder times for your AM and PM routine. Takes 15 seconds to log. Builds the habit automatically.",
  },
]

export function OumaHabit() {
  return (
    <OumaSection className="bg-[#2D5A1B] py-[var(--ouma-section-y)]">
      <div className="ouma-container grid items-center gap-12 md:grid-cols-2">
        <div className="relative flex justify-center gap-4 md:justify-start">
          <div
            className="relative z-[1] w-[min(100%,200px)] -rotate-6 overflow-hidden rounded-[1.75rem] border-[8px] border-[#1C1C1A] bg-[#F5F0E8] shadow-xl"
            style={{ aspectRatio: "9/18" }}
          >
            <div className="p-3">
              <p className="text-xs font-semibold text-[#1C1C1A]">Today · PM</p>
              <p className="mt-4 text-3xl font-bold text-[#E8895A]">12</p>
              <p className="text-xs text-[#888580]">day streak</p>
            </div>
          </div>
          <div
            className="relative z-[2] w-[min(100%,200px)] translate-y-6 rotate-[4deg] overflow-hidden rounded-[1.75rem] border-[8px] border-[#1C1C1A] bg-[#F5F0E8] shadow-xl"
            style={{ aspectRatio: "9/18" }}
          >
            <div className="p-3">
              <p className="text-xs font-semibold text-[#1C1C1A]">Routine</p>
              <ul className="mt-3 space-y-2 text-[11px] text-[#1C1C1A]">
                <li className="rounded-lg bg-white/80 px-2 py-1">Cleanser ✓</li>
                <li className="rounded-lg bg-white/80 px-2 py-1">Serum ✓</li>
                <li className="rounded-lg bg-white/60 px-2 py-1">Moisturiser</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <h2 className="ouma-display mb-10 text-[40px] font-medium leading-tight text-white md:text-[48px]">
            The app your skin will thank you for — every morning.
          </h2>
          <ul className="space-y-8">
            {points.map((p) => (
              <li key={p.title} className="flex gap-4">
                <p.icon className="mt-0.5 shrink-0 text-[#FFCA5A]" size={24} strokeWidth={1.75} />
                <div>
                  <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-1 text-[15px] text-white/70">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </OumaSection>
  )
}
