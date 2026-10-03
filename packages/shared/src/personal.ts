// "Not for you": ingredients that are fine in general but matter for this person's skin type or
// concerns. Deliberately short and conservative — each rule is a well-established association, and
// the reason is always said in the user's own terms ("which matters with acne").

export type PersonalFlag = { reason: string }

// A rule applies when the profile has any of the listed skin types or concerns. "sensitive" as a skin
// type comes from older profiles; it now lives under concerns as "sensitivity".
type Rule = { when: { skinType?: string[]; concern?: string[] }; match: RegExp; reason: string }

const RULES: Rule[] = [
  {
    when: { concern: ["acne", "pores"] },
    match: /\b(isopropyl (myristate|palmitate|isostearate)|myristyl myristate|cocos nucifera|coconut oil|cocoa butter|theobroma cacao|lanolin|laureth-4|ethylhexyl palmitate)\b/i,
    reason: "Fine in general, but it can clog pores, which matters with acne and large pores.",
  },
  {
    when: { skinType: ["dry"], concern: ["dryness"] },
    match: /\b(alcohol denat|sd alcohol|denatured alcohol|isopropyl alcohol|ethanol)\b/i,
    reason: "Dries skin out, which matters when your skin is already dry.",
  },
  {
    when: { skinType: ["sensitive"], concern: ["sensitivity"] },
    match: /\b(parfum|fragrance|limonene|linalool|citral|geraniol|eugenol|essential oil|lavandula|mentha|peppermint|eucalyptus)\b/i,
    reason: "Fine for many, but scent ingredients are a common trigger for sensitive skin.",
  },
  {
    when: { concern: ["redness", "sensitivity"] },
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
      (!!profile.skinType && !!r.when.skinType?.includes(profile.skinType)) || !!r.when.concern?.some((c) => profile.concerns?.includes(c))
    if (applies && r.match.test(ingredient)) return { reason: r.reason }
  }
  return null
}
