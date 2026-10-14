import * as fs from 'fs';
import * as path from 'path';
import { candidateNames, splitLabel } from './label-parser';

describe('splitLabel', () => {
  it('keeps chemical names with commas whole', () => {
    expect(splitLabel('Betaine, 1,2-Hexanediol, Panthenol')).toEqual(['Betaine', '1,2-Hexanediol', 'Panthenol']);
  });
  it('drops US Drug Facts headings and percentages', () => {
    expect(splitLabel('Active ingredient: Salicylic Acid 2%. Inactive ingredients: Water, Glycerin')).toEqual(['Salicylic Acid', 'Water', 'Glycerin']);
    expect(splitLabel('Avobenzone 3%, Homosalate 10%')).toEqual(['Avobenzone', 'Homosalate']);
  });
  it('splits Arabic commas and handles "may contain"', () => {
    expect(splitLabel('ماء، جليسرين، عطر')).toEqual(['ماء', 'جليسرين', 'عطر']);
    expect(splitLabel('Aqua, Linalool. May contain: CI 77891')).toEqual(['Aqua', 'Linalool', 'CI 77891']);
  });
  it('drops footnote legends', () => {
    expect(splitLabel('Aloe Barbadensis Leaf Juice*, Glycerin. *organic')).toEqual(['Aloe Barbadensis Leaf Juice', 'Glycerin']);
  });
});

describe('candidateNames', () => {
  it('tries slash, bracket and synonym names', () => {
    expect(candidateNames('Aqua/Water/Eau')).toEqual(expect.arrayContaining(['Aqua', 'Water', 'Eau']));
    expect(candidateNames('Avobenzone')).toContain('Butyl Methoxydibenzoylmethane');
    expect(candidateNames('Hidroquinona')).toContain('Hydroquinone');
    expect(candidateNames('Fragancia')).toContain('Parfum');
    expect(candidateNames('عطر')).toContain('Parfum');
  });
  it('tries each name listed inside brackets', () => {
    expect(candidateNames('Iron Oxides (CI 77491, CI 77492)')).toEqual(expect.arrayContaining(['Iron Oxides', 'CI 77491', 'CI 77492']));
  });
  it('does not split polymer names at slashes', () => {
    expect(candidateNames('Castor Oil/IPDI Copolymer')).not.toContain('Castor Oil');
    expect(candidateNames('Caprylic/\u200BCapric Triglyceride')).toContain('Caprylic/Capric Triglyceride');
  });
  it('maps US colour names', () => {
    expect(candidateNames('FD&C Red No. 40')).toContain('CI 16035');
  });
});

describe('shared copy', () => {
  it('matches packages/shared/src/labels.ts (run npm run sync:shared)', () => {
    const src = path.join(__dirname, '../../../../packages/shared/src/labels.ts');
    if (!fs.existsSync(src)) return;
    const copy = fs.readFileSync(path.join(__dirname, 'shared-labels.ts'), 'utf8');
    expect(copy.endsWith(fs.readFileSync(src, 'utf8'))).toBe(true);
  });
});

describe('names people type', () => {
  it.each([
    ['Haldi', 'Curcuma Longa Root Extract'],
    ['Kesar', 'Crocus Sativus Flower Extract'],
    ['Gulab Jal', 'Rosa Damascena Flower Water'],
    ['Multani Mitti', 'Solum Fullonum'],
    ['Mulethi', 'Glycyrrhiza Glabra Root Extract'],
    ['Snail Mucin', 'Snail Secretion Filtrate'],
    ['L-Ascorbic Acid', 'Ascorbic Acid'],
    ['Organic Aloe Vera', 'Aloe Barbadensis Leaf Juice'],
    ['Certified Organic Green Tea Leaf Extract', 'Camellia Sinensis Leaf Extract'],
  ])('%s → %s', (typed, inci) => {
    expect(candidateNames(typed)).toContain(inci);
  });
});
