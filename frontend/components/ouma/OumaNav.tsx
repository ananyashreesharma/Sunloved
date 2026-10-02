"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import { OumaLogo } from "./OumaLogo"

const mobileLinks = [
  { href: "#demo", label: "Try demo" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
]

export function OumaNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <header
        className="ouma-nav fixed left-0 right-0 top-0 z-[10040] flex h-14 items-center border-b transition-[background,box-shadow] duration-300 md:h-16"
        style={{
          backgroundColor: scrolled ? "#F5F0E8" : "rgba(245, 240, 232, 0.92)",
          borderColor: "#E0D9CE",
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="ouma-container flex w-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="md:hidden">
              <OumaLogo variant="mark" href="#top" />
            </span>
            <span className="hidden md:inline">
              <OumaLogo variant="full" href="#top" />
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <Link
              href="/login"
              className="hidden text-[15px] font-medium text-[#1C1C1A] no-underline hover:underline md:inline"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="ouma-btn-nav-cta hidden h-9 min-h-[36px] items-center rounded-full bg-[#E8895A] px-5 text-[14px] font-semibold text-white no-underline transition-colors hover:bg-[#D07845] md:inline-flex"
            >
              Start free trial
            </Link>

            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center text-[#2D5A1B] md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link
              href="/login"
              className="ouma-btn-nav-cta inline-flex h-10 min-h-[48px] items-center rounded-full bg-[#E8895A] px-4 text-[13px] font-semibold text-white no-underline hover:bg-[#D07845] md:hidden"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-[10030] flex flex-col bg-[#F5F0E8] px-6 pt-24 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <nav className="flex flex-col items-center gap-6 text-lg font-medium text-[#1C1C1A]">
            {mobileLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  )
}
