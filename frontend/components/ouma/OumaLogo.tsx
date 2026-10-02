import Link from "next/link"

type OumaLogoProps = {
  variant?: "full" | "mark"
  light?: boolean
  className?: string
  href?: string
}

export function OumaLogo({ variant = "full", light = false, className = "", href = "#top" }: OumaLogoProps) {
  const sun = "#FFCA5A"
  const inner = light ? "#2D5A1B" : "#E8895A"
  const text = light ? "#F5F0E8" : "#1C1C1A"

  const mark = (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <svg width={variant === "mark" ? 40 : 36} height={variant === "mark" ? 40 : 36} viewBox="0 0 48 48" fill="none" aria-hidden>
        <circle cx="24" cy="24" r="22" fill={sun} />
        <circle cx="24" cy="24" r="10" fill={inner} />
      </svg>
      {variant === "full" ? (
        <span
          className="ouma-display text-[22px] font-medium leading-none tracking-tight md:text-2xl"
          style={{ color: text }}
        >
          ouma
        </span>
      ) : null}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-[120px] items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:#2D5A1B]">
        {mark}
      </Link>
    )
  }

  return mark
}
