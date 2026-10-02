import { Suspense } from "react"
import { OumaShareCardClient } from "@/components/ouma/OumaShareCardClient"

export default function ShareCardPage() {
  return (
    <Suspense>
      <OumaShareCardClient />
    </Suspense>
  )
}
