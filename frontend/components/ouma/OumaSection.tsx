"use client"

import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { useOumaInView } from "./useOumaInView"

type OumaSectionProps = {
  children: ReactNode
  className?: string
  id?: string
} & Omit<ComponentPropsWithoutRef<"section">, "children" | "className" | "id">

export function OumaSection({ children, className = "", id, ...rest }: OumaSectionProps) {
  const { ref, inView } = useOumaInView<HTMLElement>()
  return (
    <section
      ref={ref}
      id={id}
      className={`ouma-reveal ${inView ? "ouma-reveal--in" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </section>
  )
}
