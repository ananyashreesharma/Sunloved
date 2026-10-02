"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { OumaSection } from "./OumaSection"

const slides = [
  {
    quote:
      "I've been using the same night cream for 2 years. SkinLens showed me it has parabens and formaldehyde. Switched immediately.",
    name: "Priya M.",
    tag: "Oily skin, Mumbai",
    stars: 5,
  },
  {
    quote:
      "The conflict detector saved my skin. I was layering Retinol with AHA every night — no wonder I had irritation.",
    name: "Arjun K.",
    tag: "Sensitive skin, Bangalore",
    stars: 5,
  },
  {
    quote:
      "Finally an app that actually covers Indian brands. Every other app I tried only had American products.",
    name: "Shreya D.",
    tag: "Combination skin, Delhi",
    stars: 5,
  },
]

export function OumaTestimonials() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const next = useCallback(() => setI((v) => (v + 1) % slides.length), [])
  const prev = useCallback(() => setI((v) => (v - 1 + slides.length) % slides.length), [])

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(next, 5000)
    return () => window.clearInterval(id)
  }, [next, paused])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.children[i] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
  }, [i])

  const starLabel = (n: number) => `${n} out of 5 stars`

  return (
    <OumaSection
      className="bg-[#E8895A] py-[var(--ouma-section-y)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ouma-container">
        <h2 className="ouma-display mb-10 text-center text-[36px] font-medium text-white md:text-[40px]">
          Trusted by 4,000+ Indians
        </h2>

        <div className="hidden md:block">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {slides.map((s, idx) => (
              <article
                key={idx}
                className="w-[min(380px,calc((100%-2.5rem)/2.5))] shrink-0 snap-start rounded-[20px] bg-[#F5F0E8] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:min-w-[300px]"
              >
                <div className="mb-4 flex gap-3">
                  <div
                    className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1C1C1A] shadow-sm"
                    aria-hidden
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1C1C1A]">{s.name}</p>
                    <span className="mt-1 inline-block rounded-full bg-[#2D5A1B]/12 px-2 py-0.5 text-xs font-medium text-[#2D5A1B]">
                      {s.tag}
                    </span>
                    <p className="mt-2 text-sm text-[#F4A261]" aria-label={starLabel(s.stars)}>
                      {"★".repeat(s.stars)}
                      {"☆".repeat(5 - s.stars)}
                    </p>
                  </div>
                </div>
                <p className="text-[15px] leading-relaxed text-[#1C1C1A]">&ldquo;{s.quote}&rdquo;</p>
              </article>
            ))}
          </div>
        </div>

        <div className="md:hidden">
          <article className="rounded-[20px] bg-[#F5F0E8] p-6">
            <div className="mb-4 flex gap-3">
              <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm">
                {slides[i].name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-[#1C1C1A]">{slides[i].name}</p>
                <span className="mt-1 inline-block rounded-full bg-[#2D5A1B]/12 px-2 py-0.5 text-xs font-medium text-[#2D5A1B]">
                  {slides[i].tag}
                </span>
                <p className="mt-2 text-sm text-[#F4A261]" aria-label={starLabel(slides[i].stars)}>
                  {"★".repeat(slides[i].stars)}
                  {"☆".repeat(5 - slides[i].stars)}
                </p>
              </div>
            </div>
            <p className="text-[15px] leading-relaxed text-[#1C1C1A]">&ldquo;{slides[i].quote}&rdquo;</p>
          </article>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex gap-3">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white transition hover:bg-white/10"
              aria-label="Previous testimonial"
              onClick={prev}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white transition hover:bg-white/10"
              aria-label="Next testimonial"
              onClick={next}
            >
              <ChevronRight size={22} />
            </button>
          </div>
          <div className="flex gap-2" role="tablist" aria-label="Testimonial slides">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`h-2 w-2 rounded-full ${idx === i ? "bg-white" : "bg-white/40"}`}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === i}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </OumaSection>
  )
}
