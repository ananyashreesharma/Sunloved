// "Not for you": ingredients that are fine in general but matter for this person's skin type or
// concerns. Deliberately short and conservative — each rule is a well-established association, and
// the reason is always said in the user's own terms ("which matters with acne").

export type PersonalFlag = { reason: string }

type Rule = { when: { skinType?: string; concern?: string }; match: RegExp; reason: string }

const RULES: Rule[] = [
  {
    when: { concern: "acne" },
    match: /\b(isopropyl (myristate|palmitate|isostearate)|myristyl myristate|cocos nucifera|coconut oil|cocoa butter|theobroma cacao|lanolin|laureth-4|ethylhexyl palmitate)\b/i,
    reason: "Fine in general, but it can clog pores, which matters with acne.",
  },
  {
    when: { skinType: "dry" },
    match: /\b(alcohol denat|sd alcohol|denatured alcohol|isopropyl alcohol|ethanol)\b/i,
    reason: "Dries skin out. You told us yours is dry.",
  },
  {
    when: { skinType: "sensitive" },
    match: /\b(parfum|fragrance|limonene|linalool|citral|geraniol|eugenol|essential oil|lavandula|mentha|peppermint|eucalyptus)\b/i,
    reason: "Fine for many, but scent ingredients are a common trigger for sensitive skin.",
  },
  {
    when: { concern: "redness" },
    match: /\b(menthol|camphor|mentha|peppermint|eucalyptus|alcohol denat)\b/i,
    reason: "Gives a cooling or tingling feel that can make redness worse.",
  },
]

export type SkinProfile = { skinType?: string | null; concerns?: string[] }

/** A personal flag for this ingredient, or null when nothing about the user's skin makes it matter. */
export function personalFlag(ingredient: string, profile: SkinProfile | null | undefined): PersonalFlag | null {
  if (!profile) return null
  for (const r of RULES) {
    const applies =
      (r.when.skinType && r.when.skinType === profile.skinType) || (r.when.concern && profile.concerns?.includes(r.when.concern))
    if (applies && r.match.test(ingredient)) return { reason: r.reason }
  }
  return null
}
