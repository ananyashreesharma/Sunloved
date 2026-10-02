// Ingredient clashes inside one routine, checked by product name so they also work for guests and
// for steps typed by hand. Signed-in users additionally get the backend's ingredient-level check.

export type RoutineClash = {
  /** Plain words for the two things that clash, e.g. "Retinol" and "glycolic acid". */
  a: string
  b: string
  /** Step whose frequency the "Alternate them" fix changes to every other day (the acid). */
  alternateStepId: string
  stepIds: string[]
}

const RETINOID = /\b(retinol|retinal|retinaldehyde|tretinoin|adapalene|retinoid|granactive)\b/i
const ACIDS: Array<[RegExp, string]> = [
  [/\bglycolic\b/i, "glycolic acid"],
  [/\blactic\b/i, "lactic acid"],
  [/\bmandelic\b/i, "mandelic acid"],
  [/\bsalicylic\b|\bbha\b/i, "salicylic acid"],
  [/\baha\b|\bpeel(ing)?\b|\bexfoliat/i, "an exfoliating acid"],
]

type StepLike = { id: string; name: string; rest?: boolean }

/** The first retinoid + exfoliating-acid pair due on the same day, if any. */
export function findRoutineClash(steps: StepLike[]): RoutineClash | null {
  const due = steps.filter((s) => !s.rest)
  const retinoid = due.find((s) => RETINOID.test(s.name))
  if (!retinoid) return null
  for (const s of due) {
    if (s.id === retinoid.id) continue
    const acid = ACIDS.find(([re]) => re.test(s.name))
    if (acid) {
      const word = (retinoid.name.match(RETINOID)?.[0] ?? "Retinol").toLowerCase()
      return {
        a: word.charAt(0).toUpperCase() + word.slice(1),
        b: acid[1],
        alternateStepId: s.id,
        stepIds: [retinoid.id, s.id],
      }
    }
  }
  return null
}
