/**
 * India body / hair / bath catalog rows (CSV from Nykaa–Amazon–Flipkart–oriented lists).
 * Product IDs use prefix `in-bh-` so they never collide with skincare `in-{idx}-…` rows.
 */
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { slugifyPart } from './india-catalog-loader';

export type BodyHairCatalogRow = {
  id: number;
  product_name: string;
  brand: string;
  category: string;
  subcategory: string;
  product_type: string;
  price_inr: number;
  market_segment: string;
  source_notes: string;
};

export function productIdForBodyHairRow(row: BodyHairCatalogRow): string {
  const base = `in-bh-${row.id}-${slugifyPart(row.brand)}-${slugifyPart(row.product_name)}`;
  return base.slice(0, 120);
}

export function bodyHairDescriptionJson(row: Pick<BodyHairCatalogRow, 'market_segment' | 'source_notes'>): string {
  return JSON.stringify({
    marketSegment: row.market_segment,
    sourceNotes: row.source_notes,
  });
}

/** Map CSV (category, subcategory, product_type) → leaf `product_categories.slug`. */
export function resolveBodyHairLeafSlug(
  category: string,
  subcategory: string,
  productType: string,
): string | null {
  const cat = category.trim().toLowerCase();
  const sub = subcategory.trim().toLowerCase();
  const t = productType.trim().toLowerCase();

  if (cat === 'bath-body' && sub === 'bath-soaks') {
    if (t === 'bath-salts') return 'bath-salts';
    if (t === 'bath-bombs') return 'bath-bomb';
    if (t === 'bubble-bath') return 'bubble-bath';
    return null;
  }

  if (cat === 'bodycare' && sub === 'body-sun-care') {
    if (t === 'body-spf') return 'body-spf';
    if (t === 'after-sun-body') return 'body-after-sun';
    return null;
  }

  if (cat === 'bodycare' && sub === 'body-treatments') {
    const m: Record<string, string> = {
      'stretch-mark': 'stretch-mark',
      'body-serum': 'body-serum',
      'body-exfoliator': 'body-exfoliator',
      'intimate-care': 'intimate-care',
    };
    return m[t] ?? null;
  }

  if (cat === 'bodycare' && sub === 'cleansers') {
    const m: Record<string, string> = {
      'body-wash': 'body-wash',
      'soap-bar': 'soap-bar',
      'shower-oil': 'shower-oil',
      'body-scrub': 'body-scrub',
    };
    return m[t] ?? null;
  }

  if (cat === 'bodycare' && sub === 'deodorant') {
    const m: Record<string, string> = {
      stick: 'deodorant-stick',
      spray: 'deodorant-spray',
      cream: 'deodorant-cream',
      natural: 'natural-deodorant',
    };
    return m[t] ?? null;
  }

  if (cat === 'bodycare' && sub === 'hand-foot') {
    const m: Record<string, string> = {
      'hand-cream': 'hand-cream',
      'foot-cream': 'foot-cream',
      'nail-care': 'nail-care',
      'foot-scrub': 'foot-scrub',
    };
    return m[t] ?? null;
  }

  if (cat === 'bodycare' && sub === 'moisturisers') {
    const m: Record<string, string> = {
      lotion: 'body-lotion',
      butter: 'body-butter',
      oil: 'body-oil',
      gel: 'body-gel',
      cream: 'body-cream',
    };
    return m[t] ?? null;
  }

  if (cat === 'haircare' && sub === 'cleansers') {
    const m: Record<string, string> = {
      shampoo: 'shampoo',
      'clarifying-shampoo': 'clarifying-shampoo',
      'co-wash': 'co-wash',
      'dry-shampoo': 'dry-shampoo',
    };
    return m[t] ?? null;
  }

  if (cat === 'haircare' && sub === 'conditioning') {
    const m: Record<string, string> = {
      conditioner: 'conditioner',
      'hair-mask': 'hair-mask',
      'deep-conditioner': 'deep-conditioner',
      'leave-in': 'leave-in-conditioner',
      'hair-rinse': 'hair-rinse',
    };
    return m[t] ?? null;
  }

  if (cat === 'haircare' && sub === 'scalp-care') {
    const m: Record<string, string> = {
      'scalp-serum': 'scalp-serum',
      'scalp-scrub': 'scalp-scrub',
      'scalp-tonic': 'scalp-tonic',
      'anti-dandruff': 'anti-dandruff',
    };
    return m[t] ?? null;
  }

  if (cat === 'haircare' && sub === 'hair-treatments') {
    const m: Record<string, string> = {
      'hair-oil': 'hair-oil',
      'hair-serum': 'hair-serum',
      'hair-cream': 'hair-cream',
      'heat-protectant': 'heat-protectant',
      'hair-growth': 'hair-growth',
    };
    return m[t] ?? null;
  }

  if (cat === 'haircare' && sub === 'styling') {
    const m: Record<string, string> = {
      gel: 'hair-gel',
      mousse: 'hair-mousse',
      spray: 'hair-spray',
      wax: 'hair-wax',
    };
    return m[t] ?? null;
  }

  return null;
}

export function loadBodyHairCatalogFromCsv(csvPath: string): BodyHairCatalogRow[] {
  const buf = readFileSync(csvPath, 'utf8');
  const records = parse(buf, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  }) as Record<string, string>[];

  const rows: BodyHairCatalogRow[] = [];
  for (const r of records) {
    const id = parseInt(r.id, 10);
    if (!r.product_name || !r.brand || Number.isNaN(id)) continue;
    const price = parseFloat(String(r.price_inr ?? '').replace(/,/g, ''));
    rows.push({
      id,
      product_name: r.product_name,
      brand: r.brand,
      category: r.category,
      subcategory: r.subcategory,
      product_type: r.product_type,
      price_inr: Number.isFinite(price) ? price : 0,
      market_segment: r.market_segment ?? '',
      source_notes: r.source_notes ?? '',
    });
  }
  rows.sort((a, b) => a.id - b.id);
  return rows;
}
