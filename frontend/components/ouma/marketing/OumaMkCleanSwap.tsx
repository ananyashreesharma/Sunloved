"use client"

import { useRef } from "react"

const slides = [
  {
    quote:
      "I scanned Mamaearth's moisturizer and found 2 endocrine disruptors I'd never heard of. SkinLens recommended a Minimalist swap that cleared my PIH in 3 weeks — and cost ₹150 less.",
    name: "Priya S.",
    city: "Mumbai",
    initial: "P",
    stars: 5,
  },
  {
    quote:
      "I always thought Himalaya was safe because it's 'natural'. SkinLens showed me 3 RED ingredients and found me a Plum alternative. I feel like I wasted years on the wrong products.",
    name: "Ananya R.",
    city: "Bangalore",
    initial: "A",
    stars: 5,
  },
  {
    quote:
      "The habit tracker changed everything. I've had a 30-day streak and my skin is genuinely different. The affirmation notifications are the sweetest thing — I look forward to them.",
    name: "Kavya M.",
    city: "Hyderabad",
    initial: "K",
    stars: 5,
  },
]

export function OumaMkCleanSwap() {
  const scroller = useRef<HTMLDivElement>(null)

  return (
    <section className="py-14">
      <div className="ouma-container mb-6">
        <div className="mb-2 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#DFF0E4] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3a5030]">
            Real users · Real results
          </span>
        </div>
        <h2 className="ouma-display text-center text-[1.75rem] font-semibold text-[#17211A]">
          What Indian women are saying.
        </h2>
        <p className="mt-2 text-center text-[15px] text-[#7C5410]" aria-hidden>
          ★★★★★
        </p>
      </div>

      <div
        ref={scroller}
        className="ouma-snap-x px-[var(--ouma-pad-x)]"
        role="list"
        aria-label="User testimonials"
      >
        {slides.map((s, i) => (
          <article
            key={i}
            role="listitem"
            className="ouma-snap-item w-[min(85vw,320px)] rounded-[24px] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.07)] ring-1 ring-black/4"
          >
            {/* Stars */}
            <p className="mb-3 text-sm text-[#7C5410]" aria-label="5 stars">
              ★★★★★
            </p>

            {/* Quote */}
            <p className="text-[14px] italic leading-relaxed text-[#3d3d3a]">
              &ldquo;{s.quote}&rdquo;
            </p>

            {/* Author */}
            <div className="mt-5 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DFF0E4] text-sm font-bold text-[#1D5C3B]"
                aria-hidden
              >
                {s.initial}
              </div>
              <div>
                <p className="text-sm font-bold text-[#17211A]">{s.name}</p>
                <p className="text-xs text-[#8a8a85]">{s.city} · SkinLens user</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
