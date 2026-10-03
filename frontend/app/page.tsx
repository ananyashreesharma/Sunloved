import { Checker } from "@/components/v3/Checker"

// The public front door: check any label, free. Signed-in people get the same page; their
// routine is one click away in the header.
export default function Home() {
  return <Checker />
}
