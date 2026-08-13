/**
 * Smoke: generated vocabulary packs stay inside the locked ship band.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('vocabulary packs inventory', () => {
  it('has 2000–3000 unique terms across five core situations with exercises', () => {
    const packs = JSON.parse(
      readFileSync(resolve(__dirname, '../../../../supabase/seed/vocabulary/packs.json'), 'utf8'),
    );
    expect(packs.contentSchemaVersion).toBe(1);
    expect(packs.situations).toHaveLength(5);
    const terms = new Set<string>();
    const exerciseTypes = { choose_expression: 0, fill_blank: 0, sentence_order: 0 };
    let exerciseCount = 0;
    for (const situation of packs.situations) {
      expect(situation.items.length).toBeGreaterThan(0);
      for (const item of situation.items) {
        const normalized = String(item.term)
          .normalize('NFKC')
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        expect(terms.has(normalized)).toBe(false);
        terms.add(normalized);
        expect(['word', 'phrase', 'expression']).toContain(item.type);
        expect(['A2', 'B1', 'B2', 'C1']).toContain(item.level);
        expect(Array.isArray(item.exercises)).toBe(true);
        expect(item.exercises.length).toBeGreaterThanOrEqual(1);
        for (const exercise of item.exercises) {
          exerciseCount += 1;
          expect(['choose_expression', 'fill_blank', 'sentence_order']).toContain(exercise.type);
          exerciseTypes[exercise.type as keyof typeof exerciseTypes] += 1;
        }
      }
    }
    expect(terms.size).toBeGreaterThanOrEqual(2000);
    expect(terms.size).toBeLessThanOrEqual(3000);
    expect(exerciseCount).toBe(terms.size);
    expect(exerciseTypes.choose_expression).toBeGreaterThan(0);
    expect(exerciseTypes.fill_blank).toBeGreaterThan(0);
    expect(exerciseTypes.sentence_order).toBeGreaterThan(0);
  });
});
