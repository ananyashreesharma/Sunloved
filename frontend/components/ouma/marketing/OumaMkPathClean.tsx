import { ScanLine, RefreshCw, Flame } from "lucide-react"

const steps = [
  {
    n: "01",
    title: "Scan & Reveal",
    body: "Paste or photo-scan any ingredient list. SkinLens instantly flags toxins, allergens, and hidden risks in plain English — no science degree needed.",
    icon: ScanLine,
    active: true,
  },
  {
    n: "02",
    title: "Swap Smart",
    body: "Get cleaner Indian alternatives ranked by ingredients, price, and your skin type. See exactly what improved — and save hundreds of rupees.",
    icon: RefreshCw,
    active: false,
  },
  {
    n: "03",
    title: "Build Your Routine",
    body: "Track morning and night routines, earn streaks, and receive personalised affirmation reminders. Consistency that feels good — every single day.",
    icon: Flame,
    active: false,
  },
]

export function OumaMkPathClean() {
  return (
    <section className="ouma-container py-14">
      <div className="mb-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#DFF0E4] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3a5030]">
          Why SkinLens
        </span>
      </div>
      <h2 className="ouma-display mb-10 text-center text-[1.75rem] font-semibold text-[#17211A]">
        Why do you really need SkinLens in your life?
      </h2>

      <div className="relative pl-2">
        {/* Vertical connector */}
        <div className="absolute bottom-8 left-[22px] top-8 w-px bg-gradient-to-b from-[#1D5C3B] via-[#1D5C3B]/40 to-[#DDE3DA]" aria-hidden />

        <ul className="relative space-y-6">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4">
              {/* Icon node */}
              <div className="relative z-[1] flex shrink-0 flex-col items-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ${
                    s.active
                      ? "bg-[#1D5C3B] ring-4 ring-[#1D5C3B]/15"
                      : "bg-white ring-2 ring-[#DDE3DA]"
                  }`}
                >
                  <s.icon
                    className={`h-5 w-5 ${s.active ? "text-white" : "text-[#5A6259]"}`}
                    strokeWidth={2}
                  />
                </div>
              </div>

              {/* Content card */}
              <div className="min-w-0 flex-1 rounded-[20px] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-black/4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1D5C3B]">
                  Step {s.n}
                </p>
                <h3 className="mt-1 text-base font-bold text-[#17211A]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5A6259]">{s.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
