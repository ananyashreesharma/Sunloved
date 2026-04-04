"use client"

import { FormEvent } from "react"

const COPY =
  "Get occasional updates when we improve matching, ethics checks, or pricing — no spam."

export function HomeSubscribeSection() {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <section id="subscribe" className="ss-section ss-section--subscribe">
      <div className="ss-subscribe">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Subscribe now</h2>
        <p className="text-gray-600 max-w-prose mx-auto">{COPY}</p>
        <form action="#" method="post" onSubmit={onSubmit} noValidate>
          <input type="email" name="email" placeholder="Enter your email" autoComplete="email" />
          <button type="submit" className="ss-btn">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}
