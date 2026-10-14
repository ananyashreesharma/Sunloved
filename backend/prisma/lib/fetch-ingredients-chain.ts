/**
 * Ingredient resolution: INCIDecoder only (no Skinsort / Nykaa — often unreachable from servers).
 *
 * Gates (per hit, before accepting):
 *   • Minimum ingredient count by product type (Gate 1)
 *   • Jaccard dedup vs lists already accepted this run (Gate 2)
 */
import { ingredientCountAcceptable, minIngredientsForProduct } from './ingredient-count-gate';
import { isDuplicateIngredientList } from './ingredient-dedup-gate';
import { fetchIngredientsINCIDecoderDetailed } from './external-ingredient-sources';

export type IngredientChainSource = 'incidecoder';

export type IngredientChainResult = {
  names: string[];
  source: IngredientChainSource;
};

export type FetchIngredientsChainOpts = {
  lenientIncidecoder?: boolean;
  /** Lists already stored this run — dedup gate compares against these. */
  existingIngredientLists?: string[][];
  skipIngredientCountGate?: boolean;
  skipIngredientDedupGate?: boolean;
  /** When set, append human-readable miss reasons (pass `verbose` from CLI). */
  trace?: string[];
};

function tryAccept(
  names: string[],
  source: IngredientChainSource,
  productName: string,
  opts: FetchIngredientsChainOpts,
): IngredientChainResult | null {
  const trace = opts.trace;

  if (!opts.skipIngredientCountGate && !ingredientCountAcceptable(names, productName)) {
    const need = minIngredientsForProduct(productName);
    const msg = `[${source}] count gate rejected: ${names.length} ingredients (need ≥${need}) for "${productName}"`;
    console.warn(msg);
    trace?.push(`${source}: ingredient count ${names.length} < minimum ${need} for this product type`);
    return null;
  }

  const lists = opts.existingIngredientLists;
  if (
    !opts.skipIngredientDedupGate &&
    lists &&
    lists.length > 0 &&
    isDuplicateIngredientList(names, lists)
  ) {
    console.warn(`[${source}] dedup gate rejected — list too similar to another product`);
    trace?.push(`${source}: dedup gate — same INCI list as another product in this run`);
    return null;
  }

  return { names, source };
}

export async function fetchIngredientsWithFallback(
  brand: string,
  name: string,
  opts: FetchIngredientsChainOpts,
): Promise<IngredientChainResult | null> {
  const trace = opts.trace;
  const strictInci = !opts.lenientIncidecoder;

  try {
    const inci = await fetchIngredientsINCIDecoderDetailed(brand, name, {
      strict: strictInci,
    });
    if (inci.ok) {
      const r = tryAccept(inci.names, 'incidecoder', name, opts);
      if (r) return r;
      trace?.push(
        'incidecoder: found product + ingredients but rejected by count or dedup gate (run with --verbose to see console warnings)',
      );
    } else if (inci.ok === false) {
      const human: Record<string, string> = {
        no_search_hit: strictInci
          ? 'no search hit with strict title match (try default lenient mode or fix brand/name spelling)'
          : 'no search results on INCIDecoder',
        empty_ingredient_section: 'product page had no ingredient list block',
        network_error: 'network error talking to INCIDecoder',
      };
      trace?.push(`incidecoder: ${human[inci.reason] ?? inci.reason}`);
    }
  } catch {
    trace?.push('incidecoder: unexpected error');
  }

  return null;
}
