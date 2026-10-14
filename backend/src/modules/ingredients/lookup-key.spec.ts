import { lookupKey } from './ingredients.service';

// Regression: ~4,000 stored names had an invisible character after a slash or stray spaces, so an
// exact lookup never matched the cleaned label text.
describe('lookupKey', () => {
  it.each([
    ['Acrylates/​C10-30 Alkyl Acrylate Crosspolymer', 'Acrylates/C10-30 Alkyl Acrylate Crosspolymer'],
    ['1,2- Hexanediol', '1,2-Hexanediol'],
    ['Retinol⁠', 'RETINOL'],
    ['Caprylic / Capric  Triglyceride', 'Caprylic/Capric Triglyceride'],
  ])('%j matches %j', (a, b) => {
    expect(lookupKey(a)).toBe(lookupKey(b));
  });
  it('keeps different ingredients apart', () => {
    expect(lookupKey('Ceramide NP')).not.toBe(lookupKey('Ceramide AP'));
  });
});
