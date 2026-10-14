import { StepPage } from "@/components/v3/StepPage"

export default function AddStep({ searchParams }: { searchParams: { type?: string; name?: string } }) {
  return <StepPage initialType={searchParams.type} initialName={searchParams.name} />
}
