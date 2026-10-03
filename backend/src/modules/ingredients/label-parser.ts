// Mirror of packages/shared/src/labels.ts (the apps split labels with the same rules before
// sending them): keep the two in step. Plus the server-only part: other names an ingredient goes
// by on real labels, so "Avobenzone", "Agua" or "Aqua/Water/Eau" find their INCI entry.

const HEADINGS =
  /\b(active ingredients?|inactive ingredients?|other ingredients?|ingredients?|ingr[eé]dients?|ingredientes|inhaltsstoffe|composition|inci|contains|may contain|peut contenir|puede contener|pode conter)\s*:/gi

export function splitLabel(raw: string): string[] {
  let text = raw
    .replace(/\r/g, "\n")
    // "[+/- CI 77891]" and "+/-:" introduce colourants that may be present: keep them as ingredients.
    .replace(/\[\s*\+\/-\s*:?/g, ",")
    .replace(/\+\/-\s*:?/g, ",")
    .replace(/[\[\]]/g, ",")
    .replace(HEADINGS, ",")
  // Full stop between ingredients ("Salicylic Acid 2%. Water"), but not inside numbers ("0.5%").
  text = text.replace(/\.(?=\s+[^\d\s])/g, ",")
  return (
    text
      // Separators; a comma between two digits belongs to a chemical name (1,2-Hexanediol).
      .split(/(?<!\d),|,(?!\d)|[;\n•·|،؛]/)
      // A piece starting with a footnote mark is the legend ("*organic"), not an ingredient.
      .filter((s) => !/^\s*[*°†‡¹²³]/.test(s))
      .map((s) =>
        s
          // Concentrations: "3%", "(3%)", "2.0 %", "0,5%", "w/w".
          .replace(/\(?\s*\d+(?:[.,]\d+)?\s*%\s*(?:w\/w|w\/v)?\s*\)?/gi, " ")
          // Footnote marks: "Aloe*", "Rosehip Oil**", "Shea Butter°".
          .replace(/[*°†‡¹²³]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/^[.\-–—:]+|[.\-–—:]+$/g, "")
          .trim(),
      )
      .filter((s) => s.length > 0 && /[\p{L}\d]/u.test(s))
  )
}


// Other names for INCI entries: US drug-facts names, and common translations on labels in
// Spanish, Portuguese, French and Arabic. Keys are lowercase without accents.
const SYNONYMS: Record<string, string> = {
  // US Drug Facts (sunscreens, acne)
  avobenzone: 'Butyl Methoxydibenzoylmethane',
  octinoxate: 'Ethylhexyl Methoxycinnamate',
  octisalate: 'Ethylhexyl Salicylate',
  oxybenzone: 'Benzophenone-3',
  sulisobenzone: 'Benzophenone-4',
  ensulizole: 'Phenylbenzimidazole Sulfonic Acid',
  ecamsule: 'Terephthalylidene Dicamphor Sulfonic Acid',
  meradimate: 'Menthyl Anthranilate',
  bemotrizinol: 'Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine',
  bisoctrizole: 'Methylene Bis-Benzotriazolyl Tetramethylbutylphenol',
  // Lightening-cream ingredients by the names printed on packs
  'mercury chloride': 'Mercuric Chloride',
  'mercuric iodide': 'Mercuric Iodide',
  'clobetasol': 'Clobetasol Propionate',
  'clobetasol 17-propionate': 'Clobetasol Propionate',
  'betamethasone': 'Betamethasone Valerate',
  'mometasone': 'Mometasone Furoate',
  'fluocinolone': 'Fluocinolone Acetonide',
  'triamcinolone': 'Triamcinolone Acetonide',
  'beclomethasone': 'Beclomethasone Dipropionate',
  'halobetasol': 'Halobetasol Propionate',
  'fluticasone': 'Fluticasone Propionate',
  'retinoic acid': 'Tretinoin',
  'hidroquinona': 'Hydroquinone',
  'hydroquinon': 'Hydroquinone',
  // Plain English
  water: 'Aqua',
  fragrance: 'Parfum',
  perfume: 'Parfum',
  'shea butter': 'Butyrospermum Parkii Butter',
  'aloe vera': 'Aloe Barbadensis Leaf Juice',
  'vitamin e': 'Tocopherol',
  'mineral oil': 'Paraffinum Liquidum',
  'petroleum jelly': 'Petrolatum',
  // Spanish
  agua: 'Aqua',
  glicerina: 'Glycerin',
  'alcohol cetilico': 'Cetyl Alcohol',
  'alcohol cetearilico': 'Cetearyl Alcohol',
  'alcohol estearilico': 'Stearyl Alcohol',
  fragancia: 'Parfum',
  metilparabeno: 'Methylparaben',
  propilparabeno: 'Propylparaben',
  'acido hialuronico': 'Hyaluronic Acid',
  niacinamida: 'Niacinamide',
  'acido salicilico': 'Salicylic Acid',
  'acido glicolico': 'Glycolic Acid',
  'acido estearico': 'Stearic Acid',
  'dioxido de titanio': 'Titanium Dioxide',
  'oxido de zinc': 'Zinc Oxide',
  'aceite mineral': 'Paraffinum Liquidum',
  vaselina: 'Petrolatum',
  tocoferol: 'Tocopherol',
  pantenol: 'Panthenol',
  dimeticona: 'Dimethicone',
  'manteca de karite': 'Butyrospermum Parkii Butter',
  // Portuguese
  'alcool cetilico': 'Cetyl Alcohol',
  'alcool cetoestearilico': 'Cetearyl Alcohol',
  fragrancia: 'Parfum',
  'oxido de zinco': 'Zinc Oxide',
  'oleo mineral': 'Paraffinum Liquidum',
  'manteiga de karite': 'Butyrospermum Parkii Butter',
  // French
  eau: 'Aqua',
  glycerine: 'Glycerin',
  'alcool cetylique': 'Cetyl Alcohol',
  'alcool cetearylique': 'Cetearyl Alcohol',
  'beurre de karite': 'Butyrospermum Parkii Butter',
  // Arabic
  'ماء': 'Aqua',
  'جليسرين': 'Glycerin',
  'غليسرين': 'Glycerin',
  'عطر': 'Parfum',
  'زيت الأرغان': 'Argania Spinosa Kernel Oil',
  'زبدة الشيا': 'Butyrospermum Parkii Butter',
  'نياسيناميد': 'Niacinamide',
  'هيدروكينون': 'Hydroquinone',
  'حمض الهيالورونيك': 'Hyaluronic Acid',
};

function plain(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Keys normalised the same way as the label text (accents and Arabic hamza forms vary).
const SYNONYM_INDEX = new Map(Object.entries(SYNONYMS).map(([k, v]) => [plain(k), v]));

/**
 * Names to try for one label entry, most specific first: as printed, each name in
 * "Aqua/Water/Eau", outside and inside brackets in "Aqua (Water)", then known synonyms of each.
 */
export function candidateNames(entry: string): string[] {
  const out: string[] = [];
  const add = (s: string) => {
    const t = s.trim();
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  };
  add(entry);
  const outer = entry.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const inner = [...entry.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  for (const part of [outer, ...inner]) {
    add(part);
    for (const slash of part.split('/')) add(slash);
  }
  for (const c of [...out]) {
    const s = SYNONYM_INDEX.get(plain(c));
    if (s) add(s);
  }
  return out;
}
