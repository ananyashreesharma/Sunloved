import { redirect } from "next/navigation"
import { StepPage } from "@/components/v3/StepPage"

export default function EditStep({ searchParams }: { searchParams: { id?: string } }) {
  if (!searchParams.id) redirect("/app/routine")
  return <StepPage id={searchParams.id} />
}
