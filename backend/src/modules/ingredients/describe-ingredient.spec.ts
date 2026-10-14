import { plainDescription } from '../../../prisma/lib/describe-ingredient';

describe('plainDescription', () => {
  it.each([
    ['Hamamelis Virginiana Leaf Extract', 'skin conditioning', /^Witch hazel leaf extract\./],
    ['Prunus Armeniaca Kernel Oil', 'skin conditioning', /^Apricot kernel oil\./],
    ['Ceramide NP', 'skin conditioning', /skin barrier/],
    ['Acetyl Hexapeptide-8', 'skin conditioning', /^Peptide/],
    ['Cyclopentasiloxane', 'emollient', /^Silicone/],
    ['Sodium Polyacrylate', 'binding, viscosity controlling, skin conditioning - emollient', /^Thickener/],
    ['Cetearyl Alcohol', 'emollient', /not a drying alcohol/],
    ['Saccharomyces Cerevisiae Extract', 'skin conditioning', /^Yeast extract\. A natural extract/],
  ])('%s', (name, fn, re) => {
    expect(plainDescription(name, fn)).toMatch(re);
  });
  // Essential oils are scent: never "softens and nourishes".
  it.each(['Eucalyptus Oil', 'Lavandula Angustifolia Oil', 'Lemon Oil', 'Mentha Piperita Oil'])('leaves essential oil %s alone', (name) => {
    expect(plainDescription(name, 'skin conditioning, perfuming')).toBeNull();
  });
  it('never guesses a plant it does not know', () => {
    expect(plainDescription('Zzyzx Unknownia Leaf Extract', 'skin conditioning')).toBe('A plant extract (Zzyzx Unknownia), used to condition skin.');
  });
});
