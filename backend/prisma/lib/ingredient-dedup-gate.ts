/**
 * Gate 3 — Reject lists that are nearly identical to another product’s list (same bad PDP reused).
 */

export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase().trim()).filter(Boolean));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const x of setA) {
    if (setB.has(x)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

export function isDuplicateIngredientList(
  newList: string[],
  existingLists: string[][],
  threshold = 0.6,
): boolean {
  if (existingLists.length === 0 || newList.length === 0) return false;
  return existingLists.some((existing) => jaccardSimilarity(newList, existing) >= threshold);
}
