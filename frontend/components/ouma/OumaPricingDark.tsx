"use client"

import Link from "next/link"
import { Check } from "lucide-react"

type Plan = {
  id: "free" | "pro" | "student"
  label: string
  priceLine: string
  subPrice?: string
  popular?: boolean
  features: string[]
  cta: string
  ctaVariant: "dark" | "green" | "outline"
}

const PLANS: Plan[] = [
  {
    id: "free",
    label: "FREE",
    priceLine: "₹0",
    subPrice: "Always free",
    features: ["3 scans / month", "Zone verdict", "Smart swap engine"],
    cta: "Get started free",
    ctaVariant: "dark",
  },
  {
    id: "pro",
    label: "PRO",
    priceLine: "₹99 / month",
    popular: true,
    features: [
      "Unlimited scans",
      "Full ingredient detail",
      "Zone verdict",
      "OCR photo scan",
      "Allergen & conflict alerts",
      "Habit building",
    ],
    cta: "Start 7-day free trial",
    ctaVariant: "green",
  },
  {
    id: "student",
    label: "STUDENT",
    priceLine: "₹49 / month",
    features: [
      "Unlimited scans",
      "Full ingredient detail",
      "Zone verdict",
      "OCR photo scan",
      "Allergen & conflict alerts",
      "Habit building",
    ],
    cta: "Start 7-day free trial",
    ctaVariant: "dark",
  },
]

function ctaClass(variant: Plan["ctaVariant"], popular?: boolean) {
  if (variant === "green") {
    return "bg-[#00a862] text-white shadow-[0_8px_30px_rgba(0,168,98,0.35)] hover:bg-[#009456]"
  }
  if (popular) {
    return "bg-[#0b1f16] text-white hover:bg-black"
  }
  return "bg-[#0b1f16] text-white hover:bg-black"
}

export function OumaPricingDark() {
  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-14 md:pt-20">
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#5ee9a8]/80">
            • Simple pricing
          </p>
          <h1 className="ouma-display mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Free to start. Upgrade when ready.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/55 md:text-base">
            No credit card to start. UPI autopay accepted. Cancel any time.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3 md:items-stretch">
          {PLANS.map((plan) => {
            const isLight = !!plan.popular
            return (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col rounded-[28px] border p-8 md:p-10 ${
                  isLight
                    ? "border-white/10 bg-white text-[#0a0f0d] shadow-[0_24px_80px_rgba(0,0,0,0.55)] md:-translate-y-2"
                    : "border-white/10 bg-[#051205] text-white"
                }`}
              >
                {plan.popular ? (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#00a862] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                    Popular
                  </div>
                ) : null}

                <p
                  className={`text-[11px] font-black uppercase tracking-[0.28em] ${
                    isLight ? "text-[#3a5030]" : "text-white/45"
                  }`}
                >
                  {plan.label}
                </p>
                <p className={`ouma-display mt-3 text-4xl font-bold ${isLight ? "text-[#0a0f0d]" : "text-white"}`}>
                  {plan.priceLine}
                </p>
                {plan.subPrice ? (
                  <p className={`mt-1 text-sm ${isLight ? "text-[#5A6259]" : "text-white/50"}`}>{plan.subPrice}</p>
                ) : null}

                <div className={`my-6 h-px w-full ${isLight ? "bg-[#DDE3DA]" : "bg-white/10"}`} />

                <ul className="flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-snug">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isLight ? "text-[#00a862]" : "text-[#5ee9a8]"}`} />
                      <span className={isLight ? "text-[#17211A]" : "text-white/85"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`mt-8 flex w-full items-center justify-center rounded-full py-4 text-sm font-black no-underline transition ${ctaClass(
                    plan.ctaVariant,
                    isLight,
                  )}`}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
