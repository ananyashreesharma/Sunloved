"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

const TRUTH_ARTICLES = [
  {
    id: "a1",
    emoji: "🔴",
    tag: "EXPOSÉ",
    tagColor: "#8A2E22",
    title: "The bleach hiding in your 'tan removal' cream",
    body: "Major Indian brands use mercury compounds and high-strength hydroquinone in products marketed as Ayurvedic detan. Here's how to spot them.",
    readMin: 4,
  },
  {
    id: "a2",
    emoji: "⚠️",
    tag: "INGREDIENTS 101",
    tagColor: "#7C5410",
    title: "'Parfum' — the most dangerous word in skincare",
    body: "When you see Parfum or Fragrance on a label, it could mean any of 3,000+ chemicals. Brands aren't required to disclose them. Find out what's hiding in yours.",
    readMin: 3,
  },
  {
    id: "a3",
    emoji: "🌿",
    tag: "GUIDE",
    tagColor: "#1D5C3B",
    title: "Building a routine for Indian skin: humidity, pollution & UV",
    body: "Most skincare advice is written for Western climates. Here's a protocol built for Indian heat, monsoon humidity, and urban pollution.",
    readMin: 6,
  },
  {
    id: "a4",
    emoji: "💡",
    tag: "MYTH BUST",
    tagColor: "#1D5C3B",
    title: "'Natural' and 'chemical-free' mean nothing — here's why",
    body: "Water is a chemical. Every ingredient is a chemical. We break down the marketing language that's costing Indian women money and skin health.",
    readMin: 3,
  },
]

export function OumaDiscoverClient() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6 pb-6">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center pt-1">
        <h1 className="ouma-display text-xl font-bold text-[#17211A]">Learn</h1>
      </header>

      {/* ─── Brand truth articles ────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#8A2E22]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6259]">Brand Truth</p>
        </div>
        <div className="space-y-3">
          {TRUTH_ARTICLES.map((article) => (
            <div
              key={article.id}
              className="cursor-pointer rounded-2xl border border-[#DDE3DA] bg-white p-4 hover:border-[#1D5C3B]/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-xl">{article.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: article.tagColor }}
                  >
                    {article.tag}
                  </span>
                  <h3 className="mt-1 text-sm font-bold leading-snug text-[#17211A]">
                    {article.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#5A6259] line-clamp-2">
                    {article.body}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold text-[#5A6259]">
                    {article.readMin} min read
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Dermatologist CTA ───────────────────────────────────── */}
      <div className="rounded-2xl bg-[#3a5030] p-5 text-white">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Pro Feature</p>
        <h3 className="ouma-display text-lg font-bold mb-1">Talk to a dermatologist</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          Get a 15-min online consultation with a verified Indian dermatologist — from ₹299.
        </p>
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-[#3a5030] no-underline hover:bg-[#f0faf6] transition"
        >
          Upgrade to access
        </Link>
      </div>
    </div>
  )
}
