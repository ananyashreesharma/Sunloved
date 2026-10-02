"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { Microscope, Sparkles } from "lucide-react"
import { analyzeDemoInci, DEMO_LIVE_MOCK_INCI } from "../demo-ingredients"
import { analyzeIngredients } from "@/lib/api"
import { mapApiAnalysisToDemo } from "@/lib/ouma-ingredient-ui"
import type { DemoAnalysis } from "../demo-ingredients"

export function OumaMkLiveAnalysis() {
  const [text, setText] = useState(DEMO_LIVE_MOCK_INCI)
  const [analysis, setAnalysis] = useState<DemoAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [usedApi, setUsedApi] = useState(false)

  const run = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const api = await analyzeIngredients(text)
      setAnalysis(mapApiAnalysisToDemo(api))
      setUsedApi(true)
    } catch {
      setUsedApi(false)
      setAnalysis(analyzeDemoInci(text))
      setErr("Backend not reachable — showing offline demo. Start the server for live data.")
    } finally {
      setLoading(false)
    }
  }, [text])

  const reds = analysis?.red.slice(0, 3) ?? []

  return (
    <section id="live-analysis" className="ouma-container scroll-mt-24 pb-14">
      {/* Section label */}
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DFF0E4]">
          <Microscope className="h-4 w-4 text-[#1D5C3B]" aria-hidden />
        </div>
        <h2 className="ouma-display text-xl font-semibold text-[#17211A]">Try it yourself</h2>
        <span className="ml-auto rounded-full bg-[#DFF0E4] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3a5030]">
          {usedApi ? "Live" : "Demo"}
        </span>
      </div>

      <div className="rounded-[24px] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
        <p className="mb-3 text-sm leading-relaxed text-[#5A6259]">
          Paste any ingredient list below — SkinLens flags every RED, YELLOW, and GREEN ingredient
          instantly.
        </p>

        <textarea
          className="mb-4 min-h-[130px] w-full resize-y rounded-2xl border-2 border-[#DDE3DA] bg-[#FFFFFF] p-4 text-[14px] leading-relaxed text-[#17211A] outline-none transition-colors placeholder:text-[#5A6259] focus:border-[#1D5C3B] focus:ring-1 focus:ring-[#1D5C3B]/30"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setAnalysis(null)
            setErr(null)
          }}
          spellCheck={false}
          aria-label="Paste ingredient list here"
          placeholder="e.g. Aqua, Glycerin, Niacinamide, Phenoxyethanol, Fragrance…"
        />

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#3a5030] py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#0A5038] active:scale-[0.98] disabled:opacity-60"
          onClick={run}
          disabled={loading}
        >
          <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
          {loading ? "Analysing…" : "Analyse Ingredients"}
        </button>

        {err ? (
          <p className="mt-3 rounded-xl bg-[#F7EDD8] px-4 py-2.5 text-xs text-[#b8872a]">{err}</p>
        ) : null}

        {/* Results area */}
        <div className="mt-5 min-h-[80px] rounded-2xl border-2 border-dashed border-[#DDE3DA] bg-[#FFFFFF] p-4">
          {!analysis ? (
            <p className="text-center text-sm text-[#5A6259]">
              Your results will appear here ✨
            </p>
          ) : analysis.ingredients.length === 0 ? (
            <p className="text-sm text-[#5A6259]">
              Try the sample list above or{" "}
              <Link href="/login" className="font-semibold text-[#1D5C3B] underline">
                create a free account
              </Link>{" "}
              for full analysis.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Score summary */}
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
                <span className="rounded-lg bg-[#F8E5E1] px-2.5 py-1.5 text-xs font-bold text-[#8A2E22]">
                  🔴 {analysis.red.length} RED
                </span>
                <span className="rounded-lg bg-[#F7EDD8] px-2.5 py-1.5 text-xs font-bold text-[#7C5410]">
                  🟡 {analysis.yellow} YELLOW
                </span>
                <span className="rounded-lg bg-[#DFF0E4] px-2.5 py-1.5 text-xs font-bold text-[#1D5C3B]">
                  🟢 {analysis.green} GREEN
                </span>
              </div>

              {/* RED ingredient cards */}
              <ul className="space-y-2">
                {reds.length === 0 ? (
                  <li className="rounded-xl bg-[#DFF0E4] p-3 text-sm font-medium text-[#3a5030]">
                    ✓ No high-risk ingredients found in this list.
                  </li>
                ) : null}
                {reds.map((row, i) => (
                  <li
                    key={row.name}
                    className="ouma-demo-card rounded-xl border-l-4 border-[#8A2E22] bg-[#F8E5E1] p-3"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-[#17211A]">{row.name}</span>
                      <span className="shrink-0 rounded-full bg-[#8A2E22] px-2 py-0.5 text-[10px] font-bold text-white">
                        RED
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[#5a3a3a]">{row.scaryLine}</p>
                  </li>
                ))}
              </ul>

              {/* Unlock CTA */}
              <div className="rounded-2xl bg-[#DFF0E4] p-4">
                <p className="text-sm font-semibold text-[#17211A]">
                  See all ingredients + safer swaps + save to routine
                </p>
                <p className="mt-1 text-xs text-[#5A6259]">Free account · No credit card · UPI accepted</p>
                <Link
                  href="/login"
                  className="ouma-btn-primary mt-3 w-full justify-center text-sm"
                >
                  Get full analysis free →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
