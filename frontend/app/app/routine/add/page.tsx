import { OumaAddStepClient } from "@/components/ouma/app/OumaAddStepClient"

export default function OumaAddStepPage({
  searchParams,
}: {
  searchParams: { type?: "morning" | "night"; name?: string }
}) {
  return <OumaAddStepClient initialType={searchParams.type} initialName={searchParams.name} />
}
