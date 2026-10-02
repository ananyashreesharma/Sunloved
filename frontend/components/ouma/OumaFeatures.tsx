import { User, GitBranch, Tag, Flame, MapPin, Leaf } from "lucide-react"
import { OumaSection } from "./OumaSection"

const items = [
  {
    icon: User,
    title: "Personalized for YOUR skin",
    body: "Not all ingredients work for all skin. SkinLens learns your skin type, concerns, and climate — then scores ingredients just for you.",
    premium: false,
  },
  {
    icon: GitBranch,
    title: "Conflict detector",
    body: "Using Vitamin C + Niacinamide? Retinol + AHA? SkinLens flags dangerous ingredient combos across your whole routine.",
    premium: true,
  },
  {
    icon: Tag,
    title: "Swap engine",
    body: "Found something harmful? Get instant recommendations for safer, cheaper alternatives from 200+ Indian brands.",
    premium: true,
  },
  {
    icon: Flame,
    title: "Daily routine tracker",
    body: "Build your AM/PM skincare routine. Get reminders. Track your streak. Never forget a step.",
    premium: false,
  },
  {
    icon: MapPin,
    title: "Climate-smart scoring",
    body: "Mumbai's humidity vs Delhi's dryness — SkinLens adjusts ingredient safety based on your city's weather.",
    premium: false,
  },
  {
    icon: Leaf,
    title: "Pregnancy-safe mode",
    body: "One tap to enable strict mode — automatically flags every ingredient risky during pregnancy or breastfeeding.",
    premium: false,
  },
]

export function OumaFeatures() {
  return (
    <OumaSection id="features" className="scroll-mt-24 bg-[#F5F0E8] py-[var(--ouma-section-y)]">
      <div className="ouma-container">
        <h2 className="ouma-display mb-12 text-center text-[36px] font-medium leading-[1.15] text-[#1C1C1A] md:text-[40px]">
          Built for Indian skin. Built for real life.
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((it, i) => (
            <div
              key={it.title}
              className={`rounded-2xl border border-[#E0D9CE]/70 p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] md:p-7 ${
                i % 2 === 0 ? "bg-[#F5F0E8]" : "bg-[rgba(232,137,90,0.1)]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <it.icon className="text-[#2D5A1B]" size={32} strokeWidth={1.75} />
                {it.premium ? (
                  <span className="shrink-0 rounded-full bg-[#1C1C1A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Premium
                  </span>
                ) : null}
              </div>
              <h3 className="mb-2 text-[17px] font-bold text-[#1C1C1A]">{it.title}</h3>
              <p className="text-sm leading-relaxed text-[#888580]">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </OumaSection>
  )
}
