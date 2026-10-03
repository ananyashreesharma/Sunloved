// Sample labels to try a check without typing. Typical INCI lists for each kind of product,
// unbranded; together they show an avoid verdict, a caution verdict, a personal flag and fragrance. Labels are
// translated by each app (key = copy key).

export type SampleLabel = { key: "sampleFairness" | "sampleNiacinamide" | "sampleSunscreen" | "sampleCream"; inci: string }

export const SAMPLE_LABELS: SampleLabel[] = [
  // The kind of "fairness" cream SkinLens exists to catch: a hidden prescription steroid and
  // hydroquinone behind a cosmetic-looking label.
  {
    key: "sampleFairness",
    inci: "Aqua, Stearic Acid, Glycerin, Cetyl Alcohol, Hydroquinone, Clobetasol Propionate, Niacinamide, Parfum, Methylparaben",
  },
  {
    key: "sampleNiacinamide",
    inci: "Aqua, Niacinamide, Pentylene Glycol, Zinc PCA, Dimethyl Isosorbide, Tamarindus Indica Seed Gum, Xanthan Gum, Isoceteth-20, Ethoxydiglycol, Phenoxyethanol, Chlorphenesin",
  },
  {
    key: "sampleSunscreen",
    inci: "Aqua, Homosalate, Ethylhexyl Salicylate, Butyl Methoxydibenzoylmethane, Glycerin, Octocrylene, Silica, Alcohol Denat., Tocopherol, Parfum, Linalool, Limonene",
  },
  {
    key: "sampleCream",
    inci: "Aqua, Glycerin, Caprylic/Capric Triglyceride, Cetearyl Alcohol, Butyrospermum Parkii Butter, Retinol, Ceramide NP, Isopropyl Myristate, Dimethicone, Phenoxyethanol, Sodium Hyaluronate, Parfum",
  },
]
