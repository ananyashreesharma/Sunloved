/**
 * OPTIONAL stubs for makeup-only NDJSON (Foundation, Mascara, …).
 * For additional skincare SKUs, add files under `data/india-catalog/` instead — same format as part-01.ndjson.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const OUT_DIR = join(__dirname, '..', 'data', 'india-makeup-catalog');

const TYPE_ROWS: { type: string; dept: string }[] = [
  { type: 'Foundation', dept: 'Face' },
  { type: 'Concealer', dept: 'Face' },
  { type: 'Primer', dept: 'Face' },
  { type: 'Blush', dept: 'Face' },
  { type: 'Bronzer', dept: 'Face' },
  { type: 'Setting Powder', dept: 'Face' },
  { type: 'Setting Spray', dept: 'Face' },
  { type: 'BB / CC Cream', dept: 'Face' },
  { type: 'Mascara', dept: 'Eyes' },
  { type: 'Eyeliner', dept: 'Eyes' },
  { type: 'Eyeshadow', dept: 'Eyes' },
  { type: 'Eyebrow', dept: 'Eyes' },
  { type: 'Lipstick', dept: 'Lips' },
  { type: 'Lip Gloss', dept: 'Lips' },
  { type: 'Lip Liner', dept: 'Lips' },
  { type: 'Lip Tint', dept: 'Lips' },
];

const BRANDS = [
  'Lakmé',
  'Maybelline',
  'Kay Beauty',
  'Sugar Cosmetics',
  'Nykaa Beauty',
  'Colorbar',
  'Swiss Beauty',
  'Insight Cosmetics',
  'Faces Canada',
  'MyGlamm',
  'Renée',
  'M.A.C',
  'Huda Beauty',
  'Fenty Beauty',
  'Charlotte Tilbury',
  'Tower 28',
  'Rare Beauty',
  'NARS',
  'Bobbi Brown',
  "L'Oréal Paris",
  'Revlon',
  'wet n wild',
  'Clinique',
  'Estée Lauder',
  'Smashbox',
  'Too Faced',
];

function pseudoRating(seed: number): number {
  const x = ((seed * 7919) % 100) / 100;
  return Math.round((3.7 + x * 1.1) * 10) / 10;
}

function pseudoPrice(seed: number): number {
  const tiers = [199, 299, 399, 499, 699, 899, 1199, 1499, 1999, 2499, 2999, 3499];
  return tiers[seed % tiers.length];
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const linesPerFile = 250;
  const total = 1000;
  const parts = 4;

  for (let p = 0; p < parts; p++) {
    const chunk: string[] = [];
    for (let j = 0; j < linesPerFile; j++) {
      const i = p * linesPerFile + j;
      if (i >= total) break;
      const idx = 1001 + i;
      const spec = TYPE_ROWS[i % TYPE_ROWS.length];
      const brand = BRANDS[i % BRANDS.length];
      const variant = Math.floor(i / TYPE_ROWS.length) + 1;
      const name = `${brand} ${spec.type} ${variant}`;
      const row = {
        idx,
        name,
        type: spec.type,
        brand,
        dept: spec.dept,
        price: pseudoPrice(idx),
        rating: pseudoRating(idx),
      };
      chunk.push(JSON.stringify(row));
    }
    const fn = join(OUT_DIR, `part-0${p + 1}.ndjson`);
    writeFileSync(fn, chunk.join('\n') + '\n', 'utf8');
    console.log(`Wrote ${chunk.length} lines → ${fn}`);
  }

  console.log('Done. idx range 1001–2000. Replace files with real catalog data when ready.');
}

main();
