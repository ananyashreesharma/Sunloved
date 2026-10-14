import { AddStepScreen } from "@/components/routine/AddStepScreen"

// Ported from frontend/components/ouma/app/OumaAddStepClient.tsx. Lives at the root stack level
// (not inside (app)'s Tabs) so it's a real pushed screen with native swipe-back — see products.tsx
// for why. Route is "/add-step" rather than the web's "/routine/add" to avoid colliding with the
// (app) group's own "/routine" tab screen (a top-level "routine/" folder here would claim that URL
// too, since route groups like (app) don't appear in the URL).
export default function AddStepRoute() {
  return <AddStepScreen />
}
