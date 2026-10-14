// Splitting labels uses the apps' own code (shared-labels.ts, copied from packages/shared at build).
// The server-only part lives here: other names an ingredient goes by on real labels, so
// "Avobenzone", "Agua" or "Aqua/Water/Eau" find their INCI entry.

export { splitLabel } from './shared-labels';

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
  // Plain English and common names on labels
  water: 'Aqua',
  'purified water': 'Aqua',
  'deionized water': 'Aqua',
  'demineralized water': 'Aqua',
  glycerine: 'Glycerin',
  'vegetable glycerin': 'Glycerin',
  'd-panthenol': 'Panthenol',
  'dexpanthenol': 'Panthenol',
  'pro-vitamin b5': 'Panthenol',
  'cetostearyl alcohol': 'Cetearyl Alcohol',
  'glyceryl monostearate': 'Glyceryl Stearate',
  'emulsifying wax': 'Cetearyl Alcohol',
  'tocopherol acetate': 'Tocopheryl Acetate',
  'vitamin e acetate': 'Tocopheryl Acetate',
  'vitamin c': 'Ascorbic Acid',
  'vitamin b3': 'Niacinamide',
  'coconut oil': 'Cocos Nucifera Oil',
  'almond oil': 'Prunus Amygdalus Dulcis Oil',
  'sweet almond oil': 'Prunus Amygdalus Dulcis Oil',
  'jojoba oil': 'Simmondsia Chinensis Seed Oil',
  'olive oil': 'Olea Europaea Fruit Oil',
  'argan oil': 'Argania Spinosa Kernel Oil',
  'castor oil': 'Ricinus Communis Seed Oil',
  'carrot seed oil': 'Daucus Carota Sativa Seed Oil',
  'tea tree oil': 'Melaleuca Alternifolia Leaf Oil',
  'rosehip oil': 'Rosa Canina Fruit Oil',
  'green tea extract': 'Camellia Sinensis Leaf Extract',
  'aloe vera extract': 'Aloe Barbadensis Leaf Extract',
  'aloe vera juice': 'Aloe Barbadensis Leaf Juice',
  'aloe vera gel': 'Aloe Barbadensis Leaf Juice',
  'licorice extract': 'Glycyrrhiza Glabra Root Extract',
  'glycyrrhiza glabra extract': 'Glycyrrhiza Glabra Root Extract',
  'light liquid paraffin': 'Paraffinum Liquidum',
  'liquid paraffin': 'Paraffinum Liquidum',
  'butylated hydroxytoluene': 'BHT',
  'methyl paraben': 'Methylparaben',
  'propyl paraben': 'Propylparaben',
  'ethyl paraben': 'Ethylparaben',
  'butyl paraben': 'Butylparaben',
  'octyl methoxycinnamate': 'Ethylhexyl Methoxycinnamate',
  'caprylic capric triglyceride': 'Caprylic/Capric Triglyceride',
  'caprylic/capric triglycerides': 'Caprylic/Capric Triglyceride',
  'hyaluronic acid': 'Sodium Hyaluronate',
  flavor: 'Aroma',
  flavour: 'Aroma',
  'ifra certified allergen free fragrance': 'Parfum',
  // US colour names (FD&C / D&C) to their EU colour index numbers
  'yellow 5': 'CI 19140',
  'yellow 6': 'CI 15985',
  'red 4': 'CI 14700',
  'red 33': 'CI 17200',
  'red 40': 'CI 16035',
  'blue 1': 'CI 42090',
  // "Iron Oxides" is itself the INCI name and covers red, yellow and black (CI 77491/77492/77499).
  'iron oxide': 'Iron Oxides',
  'titanium dioxide': 'CI 77891',
  fragrance: 'Parfum',
  perfume: 'Parfum',
  'shea butter': 'Butyrospermum Parkii Butter',
  'aloe vera': 'Aloe Barbadensis Leaf Juice',
  'vitamin e': 'Tocopherol',
  'mineral oil': 'Paraffinum Liquidum',
  'petroleum jelly': 'Petrolatum',
  // Indian names printed on packs (Hindi and Ayurvedic)
  haldi: 'Curcuma Longa Root Extract',
  kesar: 'Crocus Sativus Flower Extract',
  saffron: 'Crocus Sativus Flower Extract',
  chandan: 'Santalum Album Oil',
  'gulab jal': 'Rosa Damascena Flower Water',
  'multani mitti': 'Solum Fullonum',
  besan: 'Cicer Arietinum Seed Powder',
  'gram flour': 'Cicer Arietinum Seed Powder',
  mulethi: 'Glycyrrhiza Glabra Root Extract',
  manjistha: 'Rubia Cordifolia Root Extract',
  // Common names and spellings
  'alpha arbutin': 'Alpha-Arbutin',
  'snail mucin': 'Snail Secretion Filtrate',
  'l ascorbic acid': 'Ascorbic Acid',
  'l-ascorbic acid': 'Ascorbic Acid',
  'alpha tocopherol': 'Tocopherol',
  'green tea leaf extract': 'Camellia Sinensis Leaf Extract',
  'white tea leaf extract': 'Camellia Sinensis Leaf Extract',
  etilexilglicerina: 'Ethylhexylglycerin',
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
export function candidateNames(raw: string): string[] {
  let entry = raw;
  const out: string[] = [];
  const add = (s: string) => {
    const t = s.trim();
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  };
  add(raw);
  // Invisible characters from websites, backslashes used as slashes, a stray full stop.
  const clean = entry.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/\\/g, '/').replace(/\.+$/, '').trim();
  add(clean);
  entry = clean;
  // "Organic Aloe Vera", "Certified Organic Green Tea": the claim isn't part of the ingredient's name.
  const unclaimed = entry.replace(/^(certified\s+)?organic\s+/i, '');
  if (unclaimed !== entry) {
    add(unclaimed);
    entry = unclaimed;
  }
  const outer = entry.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  // "Iron Oxides (CI 77491, CI 77492)": each name listed inside the brackets is tried on its own.
  const inner = [...entry.matchAll(/\(([^)]*)\)/g)].flatMap((m) => [m[1], ...m[1].split(/[,;]/)]);
  // "Aqua/Water/Eau" lists alternatives, but in polymer names ("Castor Oil/IPDI Copolymer",
  // "Acrylates/C10-30 Alkyl Acrylate Crosspolymer") the slash is part of one chemical name.
  const isOneChemical = /polymer|copolymer|glyceride|crosspolymer|\d\/\d/i.test(entry);
  for (const part of [outer, ...inner]) {
    add(part);
    if (!isOneChemical) for (const slash of part.split('/')) add(slash);
  }
  for (const c of [...out]) {
    // "FD&C Red No. 40" and "Red 40" are the same; "No." is dropped for the lookup.
    const s = SYNONYM_INDEX.get(plain(c)) ?? SYNONYM_INDEX.get(plain(c).replace(/^(fd&c|d&c)\s+/, '').replace(/\bno\.?\s*/, ''));
    if (s) add(s);
  }
  return out;
}
