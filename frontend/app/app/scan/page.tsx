import { redirect } from "next/navigation"

// Checking a label now happens on the homepage (the V3 checker); old links land there.
export default function OldScanRoute() {
  redirect("/")
}
