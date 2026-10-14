/**
 * Shared NDJSON/TSV loader for India catalog rows (skincare, makeup, etc.).
 * Each line: { idx, name, type, brand, dept, price, rating }
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export type IndiaCatalogRow = {
  idx: number;
  name: string;
  productType: string;
  brandName: string;
  department: string;
  priceInr: number;
  rating: number | null;
};

function parsePriceInr(cell: string): number {
  const digits = cell.replace(/[₹,\s]/g, '').trim();
  const n = parseFloat(digits);
  if (Number.isNaN(n)) throw new Error(`Bad price: ${cell}`);
  return n;
}

function parseRating(cell: string): number | null {
  const m = cell.replace(/★/g, '').trim();
  if (!m) return null;
  const n = parseFloat(m);
  return Number.isNaN(n) ? null : n;
}

function parseTsvLine(line: string): IndiaCatalogRow | null {
  const t = line.split('\t').map((c) => c.trim());
  if (t.length < 7) return null;
  const [idxS, name, productType, brandName, department, priceCell, ratingCell] = t;
  const idx = parseInt(idxS, 10);
  if (!name || !productType || !brandName || Number.isNaN(idx)) return null;
  return {
    idx,
    name,
    productType,
    brandName,
    department: department || '',
    priceInr: parsePriceInr(priceCell),
    rating: parseRating(ratingCell || ''),
  };
}

export function slugifyPart(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function productIdForRow(row: IndiaCatalogRow): string {
  const base = `in-${row.idx}-${slugifyPart(row.brandName)}-${slugifyPart(row.name)}`;
  return base.slice(0, 120);
}

export function loadIndiaCatalogRowsFromDir(dataDir: string): IndiaCatalogRow[] {
  const names = readdirSync(dataDir);
  const ndjson = names.filter((f) => f.endsWith('.ndjson')).sort();
  if (ndjson.length > 0) {
    const rows: IndiaCatalogRow[] = [];
    for (const f of ndjson) {
      const text = readFileSync(join(dataDir, f), 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const o = JSON.parse(trimmed) as {
          idx: number;
          name: string;
          type: string;
          brand: string;
          dept: string;
          price: number;
          rating: number | null;
        };
        rows.push({
          idx: o.idx,
          name: o.name,
          productType: o.type,
          brandName: o.brand,
          department: o.dept ?? '',
          priceInr: o.price,
          rating: o.rating,
        });
      }
    }
    rows.sort((a, b) => a.idx - b.idx);
    return rows;
  }

  const tsv = names.filter((f) => f.endsWith('.tsv')).sort();
  const fromTsv: IndiaCatalogRow[] = [];
  for (const f of tsv) {
    const text = readFileSync(join(dataDir, f), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const row = parseTsvLine(trimmed);
      if (row) fromTsv.push(row);
    }
  }
  fromTsv.sort((a, b) => a.idx - b.idx);
  return fromTsv;
}
