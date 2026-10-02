import { Suspense } from "react"
import { OumaLoginClient } from "@/components/ouma/OumaLoginClient"

export default function OumaLoginPage() {
  return (
    <Suspense>
      <OumaLoginClient />
    </Suspense>
  )
}
