// Reads realistic labels from markets around the world exactly as the apps do (backend analysis +
// shared annotateLabel) and prints the verdict, coverage and notes for each. Run it after changing
// ratings, the label parser or synonyms: `npm run check:world-labels` (backend must be running).
import { annotateLabel } from '../../packages/shared/src/annotate';

const LABELS: { market: string; name: string; profile: { skinType: string; concerns: string[] }; inci: string }[] = [
  { market: 'India', name: 'Ayurvedic face oil', profile: { skinType: 'dry', concerns: ['pigmentation'] },
    inci: 'Sesamum Indicum Seed Oil, Crocus Sativus Flower Extract, Santalum Album Oil, Rubia Cordifolia Root Extract, Nelumbo Nucifera Flower Extract, Glycyrrhiza Glabra Root Extract, Curcuma Longa Root Extract, Vetiveria Zizanoides Root Extract' },
  { market: 'India', name: 'Fairness cream', profile: { skinType: 'oily', concerns: ['acne', 'pigmentation'] },
    inci: 'Aqua, Stearic Acid, Niacinamide, Glycerin, Isopropyl Myristate, Cetyl Alcohol, Dimethicone, Titanium Dioxide, Ethylhexyl Methoxycinnamate, Butyl Methoxydibenzoylmethane, Parfum, Methylparaben, Propylparaben' },
  { market: 'Nigeria/Ghana', name: 'Skin-lightening cream (illegal type)', profile: { skinType: 'combination', concerns: ['pigmentation'] },
    inci: 'Aqua, Paraffinum Liquidum, Hydroquinone, Clobetasol Propionate, Kojic Acid, Glycerin, Parfum' },
  { market: 'West Africa', name: 'Mercury soap', profile: { skinType: 'normal', concerns: [] },
    inci: 'Sodium Tallowate, Sodium Palm Kernelate, Aqua, Mercuric Iodide, Parfum' },
  { market: 'Korea', name: 'Snail essence', profile: { skinType: 'dry', concerns: ['dryness'] },
    inci: 'Snail Secretion Filtrate, Betaine, Butylene Glycol, 1,2-Hexanediol, Sodium Hyaluronate, Panthenol, Arginine, Allantoin, Ethyl Hexanediol, Sodium Polyacrylate, Carbomer, Phenoxyethanol' },
  { market: 'Korea', name: 'Centella ampoule', profile: { skinType: 'combination', concerns: ['redness'] },
    inci: 'Centella Asiatica Extract, Glycerin, Niacinamide, Butylene Glycol, Madecassoside, Asiaticoside, Asiatic Acid, Madecassic Acid' },
  { market: 'Japan', name: 'Sunscreen milk', profile: { skinType: 'oily', concerns: ['acne'] },
    inci: 'Water, Alcohol, Ethylhexyl Methoxycinnamate, Zinc Oxide, Isododecane, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Talc, Dimethicone' },
  { market: 'US', name: 'Sunscreen (Drug Facts actives)', profile: { skinType: 'sensitive', concerns: [] },
    inci: 'Avobenzone 3%, Homosalate 10%, Octisalate 5%, Octocrylene 10%' },
  { market: 'US', name: 'Acne wash (Drug Facts)', profile: { skinType: 'oily', concerns: ['acne'] },
    inci: 'Active ingredient: Salicylic Acid 2%. Inactive ingredients: Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Glycerin, Fragrance' },
  { market: 'EU/UK', name: 'Retinol serum', profile: { skinType: 'normal', concerns: ['aging'] },
    inci: 'Aqua, Squalane, Caprylic/Capric Triglyceride, Retinol, Tocopherol, Bisabolol, Phenoxyethanol, Ethylhexylglycerin' },
  { market: 'France', name: 'Cream with trilingual water', profile: { skinType: 'dry', concerns: ['sensitivity'] },
    inci: 'Ingredients: Aqua/Water/Eau, Glycerin, Cetearyl Alcohol, Parfum/Fragrance, Limonene, Linalool. May contain: CI 77891, CI 77491.' },
  { market: 'Mexico', name: 'Spanish-translated label', profile: { skinType: 'oily', concerns: [] },
    inci: 'Agua, Glicerina, Alcohol Cetílico, Fragancia, Metilparabeno' },
  { market: 'Brazil', name: 'Portuguese label', profile: { skinType: 'combination', concerns: [] },
    inci: 'Água, Glicerina, Álcool Cetílico, Fragrância' },
  { market: 'Mexico', name: 'Spanish label, sensitive skin', profile: { skinType: 'normal', concerns: ['sensitivity'] },
    inci: 'Agua, Glicerina, Alcohol Cetílico, Fragancia, Metilparabeno' },
  { market: 'Gulf', name: 'Argan & rose cream', profile: { skinType: 'dry', concerns: ['dryness'] },
    inci: 'Aqua, Argania Spinosa Kernel Oil, Rosa Damascena Flower Water, Butyrospermum Parkii Butter, Glycerin, Cetearyl Alcohol, Parfum, Citronellol, Geraniol' },
  { market: 'Gulf', name: 'Arabic-script label', profile: { skinType: 'normal', concerns: [] },
    inci: 'ماء، جليسرين، زيت الأرغان، عطر' },
];

(async () => {
  for (const l of LABELS) {
    const res = await fetch(`${process.env.API_BASE ?? 'http://localhost:3001/api'}/ingredients/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients: l.inci }),
    });
    const body: any = await res.json();
    const api = body.data ?? body;
    const a = annotateLabel(api, l.profile);
    const v = a.verdict ?? 'NO VERDICT';
    console.log(`\n[${l.market}] ${l.name} → ${v}  (rated ${a.rated}/${a.total}, coverage ${Math.round(a.coverage * 100)}%)`);
    console.log('  parsed:', JSON.stringify(api.parsed));
    const notes = [...a.flagged, ...a.noData].map((i) => `${i.num}.${i.name}=${i.state}`).join(' | ');
    if (notes) console.log('  notes:', notes);
    if (a.summary) console.log('  summary:', a.summary.slice(0, 220));
  }
})();
