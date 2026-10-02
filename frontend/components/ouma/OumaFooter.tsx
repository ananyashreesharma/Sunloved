import Link from "next/link"
import { OumaLogo } from "./OumaLogo"

const cols = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#", label: "Blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "#", label: "Careers" },
      { href: "#", label: "Press" },
      { href: "#", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
      { href: "#", label: "Refunds" },
    ],
  },
  {
    title: "Social",
    links: [
      { href: "#", label: "Instagram" },
      { href: "#", label: "Twitter" },
      { href: "#", label: "YouTube" },
    ],
  },
]

export function OumaFooter() {
  return (
    <footer className="bg-[#1C1C1A] px-[var(--ouma-pad-x)] pb-10 pt-14 text-[#F5F0E8]">
      <div className="mx-auto max-w-[var(--ouma-max)]">
        <div className="mb-12 border-b border-[#333] pb-10">
          <OumaLogo light href="#top" />
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-sm font-semibold text-[#F5F0E8]">{c.title}</p>
              <ul className="space-y-2 text-sm text-[#888580]">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-[#F5F0E8]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-[#333] pt-8 text-center text-sm text-[#888580]">
          © 2025 SkinLens · Made with care in India
        </p>
      </div>
    </footer>
  )
}
