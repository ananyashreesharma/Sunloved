import { howWeDecideItems } from "@/lib/data"

/** Intro copy is the same as HowWeDecide — split for scroll reveals only. */
const INTRO =
  "We don't do hype. Our recommendations are based on objective, transparent data points. No \"clean\" labels, just the facts."

export function HomeTextScrollSection() {
  const introBits = INTRO.split(/(?<=[.!?])\s+/).filter(Boolean)

  return (
    <section id="text" className="ss-section ss-section--text">
      <div className="ss-read" aria-hidden>
        <div className="ss-read-inner">Reading progress</div>
      </div>
      <div className="ss-text-block">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          Smooth appearance of text when scrolling
        </h2>
        {introBits.map((p, i) => (
          <p key={`intro-${i}`} className="ss-reveal-p text-gray-700 text-lg leading-relaxed mb-4">
            {p}
          </p>
        ))}
        {howWeDecideItems.map((item) => (
          <p key={item.id} className="ss-reveal-p text-gray-700 text-lg leading-relaxed mb-4">
            <span className="font-semibold text-gray-900">{item.title}. </span>
            {item.description}
          </p>
        ))}
      </div>
    </section>
  )
}
