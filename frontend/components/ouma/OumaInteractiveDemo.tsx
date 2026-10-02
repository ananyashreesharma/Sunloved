"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { analyzeDemoInci, DEMO_DEFAULT_INCI } from "./demo-ingredients"
import { OumaSection } from "./OumaSection"

export function OumaInteractiveDemo() {
  const [text, setText] = useState(DEMO_DEFAULT_INCI)
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeDemoInci> | null>(null)

  const run = useCallback(() => {
    setAnalysis(analyzeDemoInci(text))
  }, [text])

  const reds = analysis?.red.slice(0, 3) ?? []

  return (
    <OumaSection id="demo" className="scroll-mt-24 bg-white py-[var(--ouma-section-y)]">
      <div className="ouma-container">
        <h2 className="ouma-display mb-3 text-center text-[36px] font-medium leading-[1.15] text-[#1C1C1A] md:text-[40px]">
          Try it right now. No signup needed.
        </h2>
        <p className="mb-12 text-center text-lg text-[#888580]">Paste any ingredient list. See instant results.</p>

        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <label className="mb-2 block text-xs font-medium text-[#888580]" htmlFor="ouma-ingredients">
              Ingredient list
            </label>
            <textarea
              id="ouma-ingredients"
              className="min-h-[280px] w-full resize-y rounded-xl border-2 border-transparent bg-[#F5F0E8] p-4 text-[15px] leading-relaxed text-[#1C1C1A] outline-none transition-[border-color] focus:border-[#2D5A1B]"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setAnalysis(null)
              }}
              spellCheck={false}
            />
            <button type="button" className="ouma-btn-primary mt-6 min-h-[48px] w-full md:w-auto" onClick={run}>
              Analyze Ingredients →
            </button>
          </div>

          <div className="relative min-h-[280px] rounded-xl border border-dashed border-[#E0D9CE] bg-[#F5F0E8]/40 p-5 md:min-h-[320px] md:border-0 md:bg-transparent md:p-0">
            {!analysis ? (
              <p className="flex h-full min-h-[200px] items-center justify-center text-center text-[15px] text-[#888580]">
                Results will appear here
              </p>
            ) : analysis.ingredients.length === 0 ? (
              <p className="text-sm text-[#888580]">
                We couldn&apos;t match those ingredients in demo mode. Reset the sample list above, or{" "}
                <Link href="/login" className="font-semibold text-[#E8895A] underline">
                  log in
                </Link>{" "}
                for full analysis.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-base font-bold text-[#1C1C1A]">
                  <span className="mr-1" aria-hidden>
                    ⚠️
                  </span>
                  {analysis.red.length} RED ·{" "}
                  <span className="mx-0.5" aria-hidden>
                    ⚡
                  </span>
                  {analysis.yellow} YELLOW ·{" "}
                  <span className="mx-0.5" aria-hidden>
                    ✅
                  </span>
                  {analysis.green} GREEN
                </p>
                {analysis.unknownCount > 0 ? (
                  <p className="text-xs text-[#888580]">
                    {analysis.unknownCount} ingredient{analysis.unknownCount > 1 ? "s" : ""} not in demo database — full
                    app classifies everything.
                  </p>
                ) : null}

                <ul className="space-y-3">
                  {reds.length === 0 ? (
                    <li className="rounded-xl bg-[#FFFBF0] p-4 text-sm text-[#1C1C1A]">
                      No RED flags in this list — great news. Full app still checks yellow/green context for your skin.
                    </li>
                  ) : null}
                  {reds.map((row, i) => (
                    <li
                      key={row.name}
                      className="ouma-demo-card rounded-xl border-l-4 p-4 shadow-sm"
                      style={{
                        borderLeftColor: "var(--ouma-zone-red)",
                        background: "var(--ouma-red-bg)",
                        animationDelay: `${i * 100}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#1C1C1A]">{row.name}</span>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                          style={{ background: "var(--ouma-zone-red)" }}
                        >
                          RED
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-snug text-[#1C1C1A]/85">{row.scaryLine}</p>
                    </li>
                  ))}
                </ul>

                <div className="rounded-xl bg-[#F5F0E8] p-5">
                  <p className="text-[15px] leading-snug text-[#1C1C1A]">
                    See all {analysis.ingredients.length} ingredients + get safer swaps + save to routine
                  </p>
                  <Link
                    href="/login"
                    className="ouma-btn-primary mt-4 inline-flex w-full justify-center md:w-auto"
                  >
                    Start 7-day free trial →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </OumaSection>
  )
}
