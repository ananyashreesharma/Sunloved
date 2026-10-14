/**
 * How an EU CosIng record becomes a SkinLens rating and a plain-words description. Shared by
 * rate-ingredients-cosing.ts (rates rows we already have) and import-cosing-inventory.ts (adds the
 * rest of the EU inventory), so both rate the same way. Never "red": see rate-ingredients-cosing.ts.
 *
 * CosIng data © European Union, reused under Commission Decision 2011/833/EU.
 */
import { IngredientSafetyRating, IngredientZone } from '@prisma/client';

// CosIng function name → what it does, in plain words.
export const FUNCTION_PHRASES: Record<string, string> = {
  ABRASIVE: 'scrubs away dead skin',
  ABSORBENT: 'soaks up oil and moisture',
  ANTICAKING: 'keeps powders from clumping',
  ANTICORROSIVE: 'protects the packaging from corrosion',
  ANTIDANDRUFF: 'helps control dandruff',
  ANTIFOAMING: 'stops unwanted foaming',
  ANTIMICROBIAL: 'slows the growth of microbes',
  ANTIOXIDANT: 'protects skin and the formula from oxidising',
  ANTIPERSPIRANT: 'reduces sweating',
  ANTISEBORRHOEIC: 'helps control oiliness',
  ANTISTATIC: 'reduces static, especially in hair',
  ASTRINGENT: 'tightens and tones the skin',
  BINDING: 'holds the product together',
  BLEACHING: 'lightens skin or hair',
  BUFFERING: 'keeps the pH steady',
  BULKING: 'adds body to the formula',
  CHELATING: 'stops minerals in water from spoiling the formula',
  CLEANSING: 'cleans skin or hair',
  'COSMETIC COLORANT': 'adds colour',
  DENATURANT: 'makes the alcohol undrinkable',
  DEODORANT: 'reduces body odour',
  DEPILATORY: 'removes hair',
  DETANGLING: 'helps detangle hair',
  EMOLLIENT: 'softens and smooths skin',
  EMULSIFYING: 'helps oil and water mix',
  'EMULSION STABILISING': 'keeps the formula from separating',
  EXFOLIATING: 'loosens dead skin cells',
  'FILM FORMING': 'leaves a thin film on skin or hair',
  FLAVOURING: 'adds flavour',
  'FOAM BOOSTING': 'boosts lather',
  FOAMING: 'makes the product lather',
  'GEL FORMING': 'gives a gel texture',
  'HAIR CONDITIONING': 'conditions hair',
  'HAIR DYEING': 'colours hair',
  'HAIR FIXING': 'holds hairstyles in place',
  'HAIR WAVING OR STRAIGHTENING': 'reshapes hair',
  HUMECTANT: 'draws water into the skin',
  HYDROTROPE: 'helps other ingredients dissolve',
  KERATOLYTIC: 'loosens dead skin cells',
  MASKING: "masks the product's base smell",
  MOISTURISING: 'moisturises',
  'NAIL CONDITIONING': 'conditions nails',
  OPACIFYING: 'makes the product less see-through',
  'ORAL CARE': 'used in oral care',
  OXIDISING: 'used in hair colouring and bleaching',
  PEARLESCENT: 'adds a pearly shine',
  PERFUMING: 'adds scent',
  PLASTICISER: 'keeps films flexible',
  PRESERVATIVE: 'keeps the product free of bacteria and mould',
  PROPELLANT: 'pushes the product out of a spray can',
  REDUCING: 'used in perms and hair straightening',
  REFATTING: 'replaces oils that washing strips away',
  REFRESHING: 'gives a cooling, fresh feel',
  'SKIN CONDITIONING': 'keeps skin in good condition',
  'SKIN CONDITIONING - EMOLLIENT': 'softens and smooths skin',
  'SKIN CONDITIONING - HUMECTANT': 'draws water into the skin',
  'SKIN CONDITIONING - MISCELLANEOUS': 'keeps skin in good condition',
  'SKIN CONDITIONING - OCCLUSIVE': 'seals moisture into the skin',
  'SKIN PROTECTING': 'helps protect the skin',
  SMOOTHING: 'smooths the skin surface',
  SOLVENT: 'dissolves other ingredients',
  SOOTHING: 'helps calm the skin',
  STABILISING: 'keeps the formula stable',
  SURFACTANT: 'helps the product spread and rinse off',
  'SURFACTANT - CLEANSING': 'cleans by lifting away oil and dirt',
  'SURFACTANT - DISPERSING NON-SOLUBLE': 'spreads other ingredients evenly',
  'SURFACTANT - EMULSIFYING': 'helps oil and water mix',
  'SURFACTANT - FOAM BOOSTING': 'boosts lather',
  'SURFACTANT - HYDROTROPE': 'helps other ingredients dissolve',
  'SURFACTANT - SOLUBILIZING': 'helps oils dissolve in water',
  TANNING: 'darkens skin without sun',
  TONIC: 'gives a toned, refreshed feel',
  'UV ABSORBER': 'protects the product from UV light',
  'UV FILTER': 'filters UV rays to protect skin',
  'VISCOSITY CONTROLLING': 'adjusts thickness',
};

// Order in which functions are worth telling a skincare user about. CosIng lists them
// alphabetically, which put "denaturant" and "hair conditioning" first for glycerin.
export const FUNCTION_PRIORITY = [
  'SKIN CONDITIONING - HUMECTANT', 'HUMECTANT', 'MOISTURISING', 'SKIN CONDITIONING - EMOLLIENT', 'EMOLLIENT',
  'SKIN CONDITIONING - OCCLUSIVE', 'UV FILTER', 'PRESERVATIVE', 'EXFOLIATING', 'KERATOLYTIC', 'SOOTHING',
  'SKIN PROTECTING', 'BLEACHING', 'ANTIMICROBIAL', 'ANTIOXIDANT', 'SURFACTANT - CLEANSING', 'CLEANSING',
  'ASTRINGENT', 'SKIN CONDITIONING', 'SKIN CONDITIONING - MISCELLANEOUS', 'PERFUMING', 'MASKING',
  'EMULSIFYING', 'SURFACTANT - EMULSIFYING', 'TANNING', 'COSMETIC COLORANT', 'ABRASIVE', 'ABSORBENT',
  'SMOOTHING', 'REFRESHING', 'FILM FORMING', 'SURFACTANT', 'FOAMING', 'SOLVENT', 'VISCOSITY CONTROLLING',
];

// Roles that only matter for niche products; never worth a second clause in a skincare description.
export const MINOR = new Set(['DENATURANT', 'DEODORANT', 'ORAL CARE', 'FLAVOURING', 'ANTICORROSIVE', 'ANTISTATIC', 'HAIR CONDITIONING', 'HAIR DYEING', 'HAIR FIXING', 'HAIR WAVING OR STRAIGHTENING', 'NAIL CONDITIONING', 'PROPELLANT', 'PLASTICISER', 'REDUCING', 'OXIDISING']);

export function rankFunctions(functions: string[]): string[] {
  const rank = (f: string) => {
    const i = FUNCTION_PRIORITY.indexOf(f.toUpperCase());
    return i === -1 ? FUNCTION_PRIORITY.length : i;
  };
  return [...functions].sort((a, b) => rank(a) - rank(b));
}


export function zoneFromEu(annexes: string[], functions: string[], conditionalBan: boolean): IngredientZone {
  if (annexes.includes('II')) return conditionalBan ? 'green' : 'yellow';
  if (annexes.includes('III')) return functions.some((f) => /PERFUMING|MASKING/i.test(f)) ? 'yellow' : 'green';
  return 'green';
}

export const RATING: Record<IngredientZone, IngredientSafetyRating> = { red: 'avoid', yellow: 'caution', green: 'safe' };

export function regulatorySentence(annexes: string[], conditionalBan = false): string | null {
  if (annexes.includes('II') && conditionalBan) return 'Only allowed in EU cosmetics when properly refined or purified.';
  if (annexes.includes('II')) return 'The EU bans or restricts some forms or uses of this ingredient.';
  if (annexes.includes('III')) return 'Allowed in EU cosmetics only with limits on strength or use.';
  if (annexes.includes('V')) return 'An EU-approved preservative, used within set limits.';
  if (annexes.includes('VI')) return 'An EU-approved UV filter.';
  if (annexes.includes('IV')) return 'An EU-approved colourant.';
  return null;
}

export function describe(functions: string[], annexes: string[], conditionalBan = false): string | null {
  // Skip a second phrase that repeats the first ("cleans… and cleans skin or hair").
  const SAME: string[][] = [['PRESERVATIVE', 'ANTIMICROBIAL'], ['CLEANSING', 'SURFACTANT - CLEANSING', 'SURFACTANT', 'FOAMING']];
  const groupOf = (f: string) => SAME.findIndex((g) => g.includes(f));
  const picked: string[] = [];
  for (const f of rankFunctions(functions).map((x) => x.toUpperCase())) {
    if (!FUNCTION_PHRASES[f]) continue;
    const g = groupOf(f);
    const dup = picked.some((p) => FUNCTION_PHRASES[p] === FUNCTION_PHRASES[f] || (g !== -1 && groupOf(p) === g) || FUNCTION_PHRASES[p].split(' ')[0] === FUNCTION_PHRASES[f].split(' ')[0]);
    if (!dup) picked.push(f);
    if (picked.length === 2) break;
  }
  const phrases = picked.map((f) => FUNCTION_PHRASES[f]);
  // A secondary role like "denaturant" or "oral care" is noise next to the main one.
  if (phrases.length === 2 && MINOR.has(picked[1])) phrases.pop();
  const what = phrases.length ? `${phrases.join(' and ')}.` : '';
  const sentence = what ? what.charAt(0).toUpperCase() + what.slice(1) : '';
  return [sentence, regulatorySentence(annexes, conditionalBan)].filter(Boolean).join(' ') || null;
}

