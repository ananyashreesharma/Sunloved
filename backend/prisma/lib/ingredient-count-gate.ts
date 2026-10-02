/**
 * Gate 2 — Reject partial scrapes (tiny ingredient lists) before storing.
 */

const MIN_INGREDIENTS_BY_CATEGORY: Record<string, number> = {
  sunscreen: 8,
  serum: 6,
  moisturizer: 6,
  toner: 4,
  lip_balm: 3,
  lip_mask: 3,
  lip_scrub: 3,
  sheet_mask: 4,
  shampoo: 6,
  conditioner: 6,
  body_wash: 6,
  soap: 4,
  default: 4,
};

export function detectIngredientCountCategory(productName: string): string {
  const n = productName.toLowerCase();
  if (n.includes('spf') || n.includes('sunscreen')) return 'sunscreen';
  if (n.includes('lip scrub')) return 'lip_scrub';
  if (n.includes('lip') && n.includes('mask')) return 'lip_mask';
  if (n.includes('lip')) return 'lip_balm';
  if (n.includes('serum')) return 'serum';
  if (n.includes('shampoo')) return 'shampoo';
  if (n.includes('conditioner')) return 'conditioner';
  if (n.includes('body wash') || n.includes('bodywash') || n.includes('shower gel'))
    return 'body_wash';
  if (n.includes('soap') && !n.includes('shampoo')) return 'soap';
  if (n.includes('sheet') && n.includes('mask')) return 'sheet_mask';
  if (n.includes('mask')) return 'sheet_mask';
  if (n.includes('toner') || n.includes('mist')) return 'toner';
  if (n.includes('moisturizer') || n.includes('cream') || n.includes('lotion')) return 'moisturizer';
  return 'default';
}

export function minIngredientsForProduct(productName: string): number {
  const cat = detectIngredientCountCategory(productName);
  return MIN_INGREDIENTS_BY_CATEGORY[cat] ?? MIN_INGREDIENTS_BY_CATEGORY.default;
}

export function ingredientCountAcceptable(ingredients: string[], productName: string): boolean {
  const min = minIngredientsForProduct(productName);
  return ingredients.length >= min;
}
