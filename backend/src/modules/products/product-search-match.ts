import { orderedAlphanumericSubsequenceRatio } from 'prisma/lib/product-name-similarity';

type ProductForMatch = {
  name: string;
  brand: { name: string };
  category?: { name: string | null } | null;
  categoryLegacy?: string | null;
  description?: string | null;
  ingredients: Array<{ ingredient: { inciName: string; displayName: string | null } }>;
};

function alnum(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Hybrid score: exact / substring on name & brand, ordered-subsequence (typo-tolerant),
 * token overlap, and ingredient INCI / displayName hits. 0–100 for UI.
 */
export function scoreProductSearchMatch(
  rawQuery: string,
  product: ProductForMatch,
): { score: number; matchedIngredients: string[] } {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return { score: 0, matchedIngredients: [] };

  const name = product.name.toLowerCase();
  const brand = product.brand.name.toLowerCase();
  const cat =
    (product.category?.name || product.categoryLegacy || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);

  let score = 0;
  const matchedIngredients: string[] = [];

  if (name === q) score += 100;
  else if (name.startsWith(q)) score += 92;
  else if (name.includes(q)) score += 82;
  else if (`${brand} ${name}`.includes(q) || `${name} ${brand}`.includes(q)) score += 78;

  const qA = alnum(q);
  const nameA = alnum(name);
  const brandA = alnum(brand);
  if (qA.length >= 2 && nameA.length > 0) {
    const r1 = orderedAlphanumericSubsequenceRatio(qA, nameA);
    const r2 = orderedAlphanumericSubsequenceRatio(nameA, qA);
    score += Math.max(r1, r2) * 42;
  }
  if (qA.length >= 2 && brandA.length > 0) {
    const rb = Math.max(
      orderedAlphanumericSubsequenceRatio(qA, brandA),
      orderedAlphanumericSubsequenceRatio(brandA, qA),
    );
    score += rb * 28;
  }

  for (const t of tokens) {
    if (name.includes(t)) score += 14;
    if (brand.includes(t)) score += 12;
    if (cat.includes(t)) score += 8;
    if (desc.includes(t)) score += 5;
  }

  for (const pi of product.ingredients) {
    const inci = pi.ingredient.inciName.toLowerCase();
    const disp = (pi.ingredient.displayName || '').toLowerCase();
    const label = pi.ingredient.displayName || pi.ingredient.inciName;
    let hit = false;
    if (inci.includes(q) || disp.includes(q)) {
      score += 38;
      hit = true;
    } else {
      for (const t of tokens) {
        if (inci.includes(t) || disp.includes(t)) {
          score += 20;
          hit = true;
          break;
        }
      }
    }
    if (hit && matchedIngredients.length < 8) matchedIngredients.push(label);
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    matchedIngredients,
  };
}
