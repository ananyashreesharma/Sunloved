// The "where this rating comes from" line must never call an allowed ingredient banned.
import { ratingSource } from './ingredients.service';

const eu = (note: string, zone: 'green' | 'yellow' | 'red' = 'green') => ratingSource({ source: null, regulatoryNotes: `EU CosIng: ${note}`, zone } as any);

describe('ratingSource', () => {
  it('reads Annex III as allowed with limits, not banned', () => {
    expect(eu('Annex III', 'yellow')).toBe('EU cosmetics rules (CosIng): allowed with limits.');
  });
  it('only says banned for an ingredient we rate avoid', () => {
    expect(eu('Annex II', 'red')).toBe('EU cosmetics rules (CosIng): banned in cosmetics.');
    expect(eu('Annex II (conditional)', 'green')).toContain('the forms used in cosmetics are allowed');
  });
  it('names colours, preservatives and UV filters', () => {
    expect(eu('Annex IV')).toContain('approved colour');
    expect(eu('Annex V')).toContain('approved preservative');
    expect(eu('Annex VI')).toContain('approved UV filter');
    expect(eu('No restrictions')).toContain('listed, no restrictions');
  });
  it('credits hand checks', () => {
    expect(ratingSource({ source: 'manual', regulatoryNotes: null, zone: 'green' } as any)).toBe('Checked by hand by SkinLens.');
  });
  it('says plainly when no person has checked a rating', () => {
    expect(ratingSource({ source: 'ai_generated', regulatoryNotes: null, zone: 'yellow' } as any)).toMatch(/^Automated rating, not yet checked by a person/);
    expect(ratingSource({ source: 'community', regulatoryNotes: null, zone: 'green' } as any)).toMatch(/not yet checked by us/);
    expect(ratingSource({ source: 'dermatologist_verified', regulatoryNotes: null, zone: 'green' } as any)).toBe('Checked by a dermatologist.');
    expect(ratingSource({ source: 'ai_generated', regulatoryNotes: null, zone: null } as any)).toBeUndefined();
  });
});
