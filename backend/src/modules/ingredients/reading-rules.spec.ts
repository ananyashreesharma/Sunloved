// The rules that keep verdicts honest, tested on the shared reading every app uses.
import { annotateLabel } from '../../../../packages/shared/src/annotate';

type Row = [name: string, zone: 'green' | 'yellow' | 'red' | null, note?: string];
function label(rows: Row[], unknown: string[] = []) {
  const found = rows.map(([name, zone, note]) => ({ name, zone: zone ?? undefined, shortDescription: note ?? `${name} note.` }));
  const parsed = [...rows.map((r) => r[0]), ...unknown];
  return { input: parsed.join(', '), parsed, foundIngredients: found, unknownIngredients: unknown, summary: '', tags: [], actives: [], coverage: rows.length / parsed.length } as any;
}

describe('reading rules', () => {
  it('one avoid ingredient makes the label Avoid, and flags a lightening-cream hazard', () => {
    const r = annotateLabel(label([['Aqua', 'green'], ['Glycerin', 'green'], ['Clobetasol Propionate', 'red'], ['Niacinamide', 'green']]));
    expect(r.verdict).toBe('RED');
    expect(r.lighteningHazard).toBe(true);
    expect(r.flagged[0].name).toBe('Clobetasol Propionate');
  });

  it('gives no verdict below 70% rated', () => {
    const r = annotateLabel(label([['Aqua', 'green'], ['Glycerin', 'green']], ['Mystery One', 'Mystery Two']));
    expect(r.verdict).toBeNull();
  });

  it('never calls an unknown ingredient fine', () => {
    const r = annotateLabel(label([['Aqua', 'green'], ['Glycerin', 'green'], ['Niacinamide', 'green'], ['Squalane', 'green']], ['Mystery']));
    expect(r.items.find((i) => i.name === 'Mystery')?.state).toBe('none');
    expect(r.verdict).not.toBe('GREEN'); // 80% rated is below the 90% needed for "looks fine"
  });

  it('flags pore-clogging oils as not for you with acne', () => {
    const rows: Row[] = [['Aqua', 'green'], ['Glycerin', 'green'], ['Isopropyl Myristate', 'green'], ['Dimethicone', 'green']];
    expect(annotateLabel(label(rows), { skinType: 'oily', concerns: ['acne'] }).items[2].state).toBe('nfy');
    expect(annotateLabel(label(rows), { skinType: 'dry', concerns: [] }).items[2].state).toBe('fine');
  });

  it('a caution ingredient near the top is enough for caution', () => {
    const r = annotateLabel(label([['Glycolic Acid', 'yellow'], ['Aqua', 'green'], ['Glycerin', 'green'], ['Squalane', 'green'], ['Panthenol', 'green'], ['Allantoin', 'green']]));
    expect(r.verdict).toBe('YELLOW');
  });

  it('every caution says what to do next', () => {
    const r = annotateLabel(label([['Glycolic Acid', 'yellow'], ['Aqua', 'green'], ['Parfum', 'yellow']]));
    expect(r.items[0].next).toMatch(/sunscreen/);
    expect(r.items[2].next).toMatch(/fragrance-free|patch-test/i);
  });

  it("a person's own marks change the reading, but never an avoid", () => {
    const rows: Row[] = [['Aqua', 'green'], ['Glycerin', 'green'], ['Parfum', 'yellow'], ['Squalane', 'green'], ['Panthenol', 'green'], ['Allantoin', 'green']];
    const fine = annotateLabel(label(rows), { overrides: { parfum: 'fine' } });
    expect(fine.items[2].state).toBe('fine');
    expect(fine.verdict).toBe('GREEN');
    const react = annotateLabel(label(rows), { overrides: { glycerin: 'react' } });
    expect(react.items[1].state).toBe('nfy');
    expect(react.verdict).toBe('YELLOW');
    const banned = annotateLabel(label([['Hydroquinone', 'red'], ['Aqua', 'green']]), { overrides: { hydroquinone: 'fine' } });
    expect(banned.items[0].state).toBe('avoid');
  });
});
