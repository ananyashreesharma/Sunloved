"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { Check, ChevronDown, Flame, Shield, Zap } from "lucide-react"

const PLANS = [
  {
    id: "free",
    name: "Free",
    tag: null,
    priceMonthly: 0,
    priceAnnual: 0,
    suffix: "forever",
    trial: null,
    cta: "Start for free",
    ctaStyle: "ghost" as const,
    color: "#5A6259",
    features: [
      "Unlimited ingredient scans",
      "RED · YELLOW · GREEN zone breakdown",
      "3 full ingredient write-ups per scan",
      "Basic routine tracker",
      "Daily streak counter",
    ],
    missing: [
      "Full ingredient breakdown",
      "Conflict detector",
      "Swap engine",
      "Climate-smart scoring",
      "Pregnancy-safe mode",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tag: "Most popular",
    priceMonthly: 99,
    priceAnnual: 599,
    suffix: null,
    trial: "7-day free trial included",
    cta: "Start 7-day free trial",
    ctaStyle: "primary" as const,
    color: "#1D5C3B",
    features: [
      "Everything in Free",
      "Full ingredient breakdown on every scan",
      "Ingredient conflict detector",
      "Smart swap engine — find safer Indian alternatives",
      "Climate-aware scoring (your city's humidity + UV)",
      "Pregnancy-safe mode",
      "1 streak freeze per month",
      "Weekly WhatsApp skin report",
      "No ads",
    ],
    missing: [],
  },
  {
    id: "student",
    name: "Student",
    tag: "Verify with .edu email",
    priceMonthly: 49,
    priceAnnual: 379,
    suffix: null,
    trial: null,
    cta: "Verify student status",
    ctaStyle: "ghost" as const,
    color: "#5A6259",
    features: [
      "Everything in Pro",
      "Student-verified discount",
    ],
    missing: [],
  },
]

const COMPARE = [
  { f: "Ingredient scans", free: "Unlimited", pro: "Unlimited", stu: "Unlimited" },
  { f: "Zone breakdown (RED/YLW/GRN)", free: "✓", pro: "✓", stu: "✓" },
  { f: "Full ingredient write-ups", free: "3 per scan", pro: "All", stu: "All" },
  { f: "Conflict detector", free: "—", pro: "✓", stu: "✓" },
  { f: "Swap engine", free: "—", pro: "✓", stu: "✓" },
  { f: "Climate-smart scoring", free: "—", pro: "✓", stu: "✓" },
  { f: "Pregnancy-safe mode", free: "—", pro: "✓", stu: "✓" },
  { f: "Streak tracker", free: "✓", pro: "✓ + freeze", stu: "✓ + freeze" },
  { f: "Weekly skin report", free: "—", pro: "✓", stu: "✓" },
  { f: "Ads", free: "Yes", pro: "No", stu: "No" },
]

const FAQS = [
  {
    q: "Which Indian brands are covered?",
    a: "200+ and growing — Mamaearth, Minimalist, Dot&Key, Himalaya, Plum, WOW, mCaffeine, Re'equil, Pilgrim, and many more. Missing a brand? Paste ingredients directly.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, one tap in Account settings. No questions asked. You keep access until the end of your billing period.",
  },
  {
    q: "Is my ingredient data stored?",
    a: "We store your scan history so you can reference it later. You can delete it at any time from your profile. We never sell your data.",
  },
  {
    q: "What's the pregnancy-safe mode?",
    a: "We flag ingredients with safety concerns during pregnancy (retinoids, salicylic acid at high %, certain essential oils) based on published clinical guidance.",
  },
  {
    q: "Does the web app work on mobile?",
    a: "Yes — skinlens.in is fully mobile-optimised. Native iOS/Android apps add offline mode, camera OCR, and push streak reminders.",
  },
]

const TESTIMONIALS = [
  {
    name: "Priya M.",
    city: "Mumbai",
    text: "I used to think 'natural' meant safe. SkinLens showed me my ₹800 Mamaearth face wash had Alcohol Denat. first on the list. Switched to Minimalist, skin is so much better.",
    stars: 5,
  },
  {
    name: "Riya S.",
    city: "Bangalore",
    text: "The conflict detector is insane — I was mixing Vitamin C and retinol every morning and wondered why my skin was red. Fixed in one scan.",
    stars: 5,
  },
  {
    name: "Anika D.",
    city: "Delhi",
    text: "Literally wept when I saw what was in the 'tan removal' cream I'd been using since college. Mercury. In a cream sold at Big Bazaar.",
    stars: 5,
  },
]

export function OumaPricing() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const headId = useId()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      {/* ─── Headline ────────────────────────────────────────────── */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1D5C3B]/25 bg-[#DFF0E4] px-4 py-2">
          <Flame className="h-4 w-4 text-[#f59e0b]" />
          <span className="text-xs font-bold text-[#3a5030]">12,000+ users protecting their skin</span>
        </div>
        <h1 className="ouma-display text-4xl font-bold text-[#17211A] md:text-5xl">
          Start free.<br />
          <span className="text-[#1D5C3B]">Upgrade when you&apos;re ready.</span>
        </h1>
        <p className="mt-4 text-lg text-[#5A6259]">No credit card required. Cancel anytime.</p>
      </div>

      {/* ─── Billing toggle ──────────────────────────────────────── */}
      <div className="mb-10 flex items-center justify-center gap-4">
        <span className={`text-sm font-semibold ${!annual ? "text-[#17211A]" : "text-[#5A6259]"}`}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-labelledby={headId}
          onClick={() => setAnnual((a) => !a)}
          className="relative h-7 w-14 rounded-full bg-[#e0d9ce] transition-colors"
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              annual ? "translate-x-[28px]" : "translate-x-0.5"
            }`}
          />
        </button>
        <span
          id={headId}
          className={`flex items-center gap-2 text-sm font-semibold ${annual ? "text-[#17211A]" : "text-[#5A6259]"}`}
        >
          Annual
          {annual && (
            <span className="rounded-full bg-[#DFF0E4] px-2 py-0.5 text-xs font-black text-[#1D5C3B]">
              Save 40%
            </span>
          )}
        </span>
      </div>

      {/* ─── Plan cards ──────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = annual ? plan.priceAnnual : plan.priceMonthly
          const isPro = plan.id === "pro"
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                isPro
                  ? "border-[#1D5C3B] shadow-[0_8px_40px_rgba(29,158,117,0.2)] md:scale-[1.03]"
                  : "border-[#DDE3DA] bg-white hover:shadow-md"
              }`}
              style={isPro ? { background: "#ffffff" } : {}}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1D5C3B] px-4 py-1 text-xs font-black text-white shadow">
                  Most popular
                </div>
              )}
              {isPro && (
                <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-[#1D5C3B]" />
              )}

              <div className="mb-4">
                <h3 className="text-lg font-black text-[#17211A]">{plan.name}</h3>
                {plan.tag && !isPro && (
                  <p className="mt-0.5 text-xs text-[#5A6259]">{plan.tag}</p>
                )}
              </div>

              <div className="mb-1">
                {price === 0 ? (
                  <p className="ouma-display text-4xl font-black text-[#17211A]">₹0</p>
                ) : annual ? (
                  <>
                    <p className="ouma-display text-4xl font-black text-[#17211A]">₹{price}</p>
                    <p className="mt-0.5 text-sm text-[#5A6259]">
                      <span className="line-through">₹{plan.priceMonthly}/mo</span>
                      {" · "}
                      <span className="font-bold text-[#17211A]">
                        ₹{Math.round(price / 12)}/mo
                      </span>{" "}
                      billed annually
                    </p>
                  </>
                ) : (
                  <>
                    <p className="ouma-display text-4xl font-black text-[#17211A]">₹{price}</p>
                    <p className="mt-0.5 text-sm text-[#5A6259]">per month</p>
                  </>
                )}
              </div>

              {plan.trial && (
                <p className="mb-4 text-xs font-bold text-[#1D5C3B]">{plan.trial}</p>
              )}

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#17211A]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1D5C3B]" />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#5A6259] line-through">
                    <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-[#d4d0cc]">○</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`flex items-center justify-center rounded-full py-3.5 text-sm font-black no-underline transition ${
                  plan.ctaStyle === "primary"
                    ? "bg-[#1D5C3B] text-white shadow-[0_4px_16px_rgba(29,158,117,0.3)] hover:bg-[#3a5030]"
                    : "border-2 border-[#DDE3DA] text-[#5A6259] hover:border-[#17211A]/20 hover:text-[#17211A]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          )
        })}
      </div>

      {/* ─── Trust badges ──────────────────────────────────────────── */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[#5A6259]">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#1D5C3B]" />
          UPI autopay via Razorpay
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#1D5C3B]" />
          Cancel anytime, no questions
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-[#1D5C3B]" />
          7-day money-back guarantee
        </div>
      </div>

      {/* ─── Feature comparison table ─────────────────────────────── */}
      <div className="mt-16 border-t border-[#DDE3DA] pt-12">
        <h2 className="ouma-display mb-6 text-center text-2xl font-bold text-[#17211A]">
          Compare plans
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[#DDE3DA]">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#FFFFFF]">
                <th className="border-b border-[#DDE3DA] p-4 text-left font-bold text-[#17211A]">
                  Feature
                </th>
                <th className="border-b border-[#DDE3DA] p-4 text-center font-bold text-[#5A6259]">
                  Free
                </th>
                <th className="border-b border-[#DDE3DA] bg-[#f0faf6] p-4 text-center font-black text-[#1D5C3B]">
                  Pro
                </th>
                <th className="border-b border-[#DDE3DA] p-4 text-center font-bold text-[#5A6259]">
                  Student
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr
                  key={row.f}
                  className={i % 2 === 0 ? "bg-white" : "bg-[#FFFFFF]"}
                >
                  <td className="border-b border-[#DDE3DA] p-4 font-medium text-[#17211A]">
                    {row.f}
                  </td>
                  <td className="border-b border-[#DDE3DA] p-4 text-center text-[#5A6259]">
                    {row.free}
                  </td>
                  <td className="border-b border-[#DDE3DA] bg-[#f0faf6] p-4 text-center font-bold text-[#1D5C3B]">
                    {row.pro}
                  </td>
                  <td className="border-b border-[#DDE3DA] p-4 text-center text-[#5A6259]">
                    {row.stu}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Testimonials ─────────────────────────────────────────── */}
      <div className="mt-16">
        <h2 className="ouma-display mb-6 text-center text-2xl font-bold text-[#17211A]">
          Real women. Real results.
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-[#DDE3DA] bg-white p-5">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-[#f59e0b]">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-[#2A342C]">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DFF0E4] text-sm font-black text-[#1D5C3B]">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#17211A]">{t.name}</p>
                  <p className="text-[10px] text-[#5A6259]">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FAQ ──────────────────────────────────────────────────── */}
      <div className="mt-16">
        <h2 className="ouma-display mb-6 text-center text-2xl font-bold text-[#17211A]">FAQ</h2>
        <div className="mx-auto max-w-2xl space-y-2">
          {FAQS.map((item, idx) => {
            const open = openFaq === idx
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-[#DDE3DA] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#17211A] focus-visible:outline-2 focus-visible:outline-[#1D5C3B]"
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#5A6259] transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300"
                  style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[#5A6259]">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Bottom CTA ───────────────────────────────────────────── */}
      <div className="mt-16 rounded-2xl bg-[#3a5030] p-8 text-center text-white">
        <h2 className="ouma-display mb-2 text-3xl font-bold">Start protecting your skin today.</h2>
        <p className="mb-6 text-white/70">
          Free forever. Upgrade when you want more. No credit card needed.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-[#3a5030] no-underline shadow hover:bg-[#f0faf6] transition"
        >
          Start free — takes 30 seconds
        </Link>
      </div>
    </div>
  )
}
