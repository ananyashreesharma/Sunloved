import { titleMatches } from '../../../prisma/lib/external-retail-sources';

describe('titleMatches (retail listing is really this product)', () => {
  it.each([
    ['Dove', 'Dove Dryness & Shine Shampoo', "L'Oreal Paris Glycolic Gloss Shine Boosting Shampoo"],
    ['OGX', 'OGX Argan Oil of Morocco Hydrating Hair Mask', 'OGX Moroccan Argan Oil Conditioner 385ml'],
    ['Dove', 'Dove Dryness & Shine Shampoo', 'Dove Dryness & Shine Conditioner'],
    ['Plum', 'Plum Green Tea Pore Cleansing Face Wash', undefined],
  ])('rejects %s "%s" → %j', (brand, name, title) => {
    expect(titleMatches(brand, name, title)).toBe(false);
  });
  it.each([
    ["L'Oreal Paris", "L'Oreal Paris Total Repair 5 Shampoo", "L'Oreal Paris Total Repair 5 Repairing Shampoo (340ml)"],
    ['Cetaphil', 'Cetaphil Gentle Skin Cleanser', 'Cetaphil Gentle Skin Cleanser for Dry to Normal Skin, 125 ml'],
    ['Lakmé', 'Lakme 9 to 5 Naturale Aloe Aqua Gel', 'Lakme 9 To 5 Naturale Aloe Aqua Gel 50g'],
    ["Pond's", "Pond's Pure White Anti-Pollution Face Wash", 'Ponds Pure White Anti Pollution + Purity Face Wash 100 g'],
  ])('accepts %s "%s" → %j', (brand, name, title) => {
    expect(titleMatches(brand, name, title)).toBe(true);
  });
});
