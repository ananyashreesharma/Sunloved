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

/** A time of life when some ingredients matter more, whatever the skin type. Kept on the phone only. */
export type LifeStage = "pregnant" | "breastfeeding" | "child"
export const LIFE_STAGES: LifeStage[] = ["pregnant", "breastfeeding", "child"]

// Conservative and well established: retinoids are advised against in pregnancy and while
// breastfeeding; strong exfoliating acids and peels are a "check first" in pregnancy; children's
// skin is thinner, so strong actives and scent-heavy oils are best left out. Reasons say what to do,
// never that harm is certain.
const RETINOIDS = /\b(retinol|retinal|retinaldehyde|retinyl \w+|retinoic|tretinoin|adapalene|tazarotene|isotretinoin|hydroxypinacolone retinoate|retinoid)\b/i
const STRONG_ACIDS = /\b(salicylic acid|glycolic acid|lactic acid|mandelic acid|pyruvic acid|trichloroacetic|capryloyl salicylic)\b/i
const LIFE_STAGE_RULES: Array<{ stages: LifeStage[]; match: RegExp; reason: string }> = [
  {
    stages: ["pregnant", "breastfeeding"],
    match: RETINOIDS,
    reason: "Retinoids (vitamin A) are advised against in pregnancy and while breastfeeding. Ask your doctor or midwife before using it.",
  },
  {
    stages: ["pregnant"],
    match: STRONG_ACIDS,
    reason: "Gentle amounts in a wash are usually fine, but check with your doctor or midwife before using strong acids or peels in pregnancy.",
  },
  {
    stages: ["child"],
    match: RETINOIDS,
    reason: "A strong anti-ageing and acne active, meant for adult skin. Not for children unless a doctor suggests it.",
  },
  {
    stages: ["child"],
    match: STRONG_ACIDS,
    reason: "Exfoliating acids are strong for a child's thinner skin. Best left out unless a doctor suggests it.",
  },
  {
    stages: ["child"],
    match: /\b(camphor|menthol|eucalyptus|mentha piperita|peppermint|essential oil|melaleuca|tea tree)\b/i,
    reason: "Strong scent oils and cooling agents can irritate children's skin, and some aren't advised for young children at all.",
  },
]

/** A flag that applies because of this person's life stage, whatever they've marked as fine for their skin. */
export function lifeStageFlag(ingredient: string, profile: SkinProfile | null | undefined): PersonalFlag | null {
  const stage = profile?.lifeStage
  if (!stage) return null
  const rule = LIFE_STAGE_RULES.find((r) => r.stages.includes(stage) && r.match.test(ingredient))
  return rule ? { reason: rule.reason } : null
}

/** What a person told us about one ingredient: it suits them, or their skin reacts to it. */
export type IngredientOverride = "fine" | "react"

export type SkinProfile = {
  skinType?: string | null
  concerns?: string[]
  lifeStage?: LifeStage | null
  /** Keyed by the ingredient's standard name, lower case (see LabelItem.key). */
  overrides?: Record<string, IngredientOverride>
}

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
