import { redirect } from "next/navigation"

// Retired: Routine is now the app's home screen (it shows real per-user data;
// the old Home dashboard was a static mock). Kept as a redirect for old links/bookmarks.
export default function OumaHomePage() {
  redirect("/app/routine")
}
