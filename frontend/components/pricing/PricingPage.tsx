"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X, Zap, Star, GraduationCap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type BillingCycle = "monthly" | "annual"

const FREE_FEATURES = [
  "Unlimited ingredient scans",
  "Ingredient breakdown & zone color coding",
  "Basic safety flags (paraben, sulfate, fragrance)",
  "Save up to 3 products",
  "Search the full product catalog",
]

const FREE_LOCKED = [
  "Dupe resolution & ranked alternatives",
  "Ingredient conflict detector",
  "Routine builder with conflict checks",
  "Climate-based product scoring",
  "Pregnancy-safe filter",
  "Personalized skin concern scoring",
  "Unlimited saved products",
  "Priority support",
]

const PAID_FEATURES = [
  "Everything in Free",
  "Dupe resolution & ranked alternatives",
  "Ingredient conflict detector",
  "Routine builder with conflict checks",
  "Climate-based product scoring",
  "Pregnancy-safe filter",
  "Personalized skin concern scoring",
  "Unlimited saved products",
  "Priority support",
]

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    icon: Zap,
    price: { monthly: 99, annual: 99 },
    badge: null,
    cta: "Start Monthly",
    highlight: false,
  },
  {
    id: "annual",
    label: "Annual",
    icon: Star,
    price: { monthly: 599, annual: 50 },
    badge: "Best Value · 2 months free",
    cta: "Start Annual",
    highlight: true,
  },
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    price: { monthly: 49, annual: 39 },
    badge: "Verified .edu / .ac.in",
    cta: "Verify Student Status",
    highlight: false,
  },
]

export function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly")

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Heading */}
      <div className="text-center mb-14">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-sun-apricot-wash text-sun-apricot mb-5">
          Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Scan freely.{" "}
          <span className="text-sun-apricot">Resolve smartly.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Every ingredient scan is free — forever. Premium unlocks the intelligence
          layer: dupes, conflicts, routines, and personalized scoring.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <button
          onClick={() => setCycle("monthly")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            cycle === "monthly"
              ? "bg-gray-900 text-white shadow"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setCycle("annual")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            cycle === "annual"
              ? "bg-gray-900 text-white shadow"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Annual
          <span className="ml-2 text-xs font-bold text-green-600">−17%</span>
        </button>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-20">
        {/* Free card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col">
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Free</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-gray-900">₹0</span>
              <span className="text-gray-500 mb-1">/forever</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">No card required</p>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
            {FREE_LOCKED.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400 line-through">
                <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/scan">
            <Button variant="outline" className="w-full rounded-xl font-semibold">
              Start scanning free
            </Button>
          </Link>
        </div>

        {/* Paid plan cards */}
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const price =
            cycle === "annual" && plan.id === "annual"
              ? plan.price.annual
              : plan.price.monthly
          const suffix =
            plan.id === "annual" && cycle === "annual" ? "/yr" : "/mo"

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-8 flex flex-col relative transition-shadow ${
                plan.highlight
                  ? "border-sun-apricot bg-gradient-to-b from-orange-50 to-white shadow-xl ring-2 ring-sun-apricot/30"
                  : "border-gray-200 bg-white hover:shadow-md"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow">
                  {plan.badge}
                </span>
              )}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-sun-apricot" />
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {plan.label}
                  </p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹{price}</span>
                  <span className="text-gray-500 mb-1">{suffix}</span>
                </div>
                {plan.id === "annual" && cycle === "annual" && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    Save ₹{99 * 12 - 599} vs monthly
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {PAID_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full rounded-xl font-semibold gap-2 ${
                  plan.highlight
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-sun-blueberry hover:bg-sun-blueberry/90 text-white"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Feature comparison table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white mb-20">
        <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
          <div className="col-span-2 px-6 py-4">Feature</div>
          <div className="px-6 py-4 text-center">Free</div>
          <div className="px-6 py-4 text-center text-sun-apricot">Premium</div>
          <div className="px-6 py-4 text-center">Student</div>
        </div>
        {[
          ["Ingredient scans", true, true, true],
          ["Safety flags (paraben, sulfate)", true, true, true],
          ["Save products", "3", "Unlimited", "Unlimited"],
          ["Dupe resolution", false, true, true],
          ["Ingredient conflict detector", false, true, true],
          ["Routine builder", false, true, true],
          ["Climate-based scoring", false, true, true],
          ["Pregnancy-safe filter", false, true, true],
          ["Personalized concern scoring", false, true, true],
          ["Priority support", false, true, true],
        ].map(([label, free, premium, student], i) => (
          <div
            key={String(label)}
            className={`grid grid-cols-5 border-b border-gray-100 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
          >
            <div className="col-span-2 px-6 py-4 text-gray-700 font-medium">{label}</div>
            {[free, premium, student].map((val, j) => (
              <div key={j} className="px-6 py-4 flex items-center justify-center">
                {val === true ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : val === false ? (
                  <X className="w-4 h-4 text-gray-300" />
                ) : (
                  <span className="text-gray-600 font-medium">{val}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Questions?</h2>
        <p className="text-gray-600 mb-6">
          We offer a full refund within 7 days, no questions asked. Student pricing
          requires a valid .edu or .ac.in email address.
        </p>
        <Link href="/how-we-decide">
          <Button variant="outline" className="rounded-xl">
            How we build Sunloved →
          </Button>
        </Link>
      </div>
    </section>
  )
}
