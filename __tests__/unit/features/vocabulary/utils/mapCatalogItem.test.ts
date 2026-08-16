import { mapCatalogExpression, mapCatalogTerm } from '@/features/vocabulary/utils/mapCatalogItem';
import { displayPronunciation } from '@/features/vocabulary/utils/pronunciation';

const base = {
  id: 'id-1',
  item_key: 'blocker',
  type: 'word',
  term: 'blocker',
  meaning: 'stops progress',
  context: 'Standup',
  level: 'A2',
  pos: null,
  content: {
    pos: 'n',
    pronunciation: '/ˈblɒkə/',
    countability: 'countable',
    patterns: ['be blocked by'],
    alternatives: ['stuck'],
    notes: ['standup'],
    examples: [
      { label: 'standup', sentence: 'I am blocked.' },
      { sentence: 'Still blocked.' },
      { label: 1, sentence: 'Ignored label type.' },
      { sentence: 2 },
      ['ctx', 'Tuple example.'],
      [null, 'No label tuple.'],
      'skip',
    ],
  },
};

describe('mapCatalogItem', () => {
  it('maps core flags and content fallbacks', () => {
    const expression = mapCatalogExpression({
      ...base,
      type: 'phrase',
      is_core: true,
      core_order: 2,
    });
    expect(expression.isCore).toBe(true);
    expect(expression.coreOrder).toBe(2);
    expect(expression.pronunciation).toBe('/ˈblɒkə/');
    expect(expression.countability).toBe('countable');
    expect(expression.needsPractice).toBe(true);

    const term = mapCatalogTerm('task-progress', base);
    expect(term.pos).toBe('n');
    expect(term.pronunciation).toBe('/ˈblɒkə/');
    expect(term.examples).toEqual(
      expect.arrayContaining([
        { label: 'standup', sentence: 'I am blocked.' },
        { label: '', sentence: 'Still blocked.' },
        { label: 'ctx', sentence: 'Tuple example.' },
        { label: '', sentence: 'No label tuple.' },
      ]),
    );
  });

  it('unwraps fake IPA slashes for display', () => {
    expect(displayPronunciation('/on trak/')).toBe('on trak');
    expect(displayPronunciation('hot-fiks')).toBe('hot-fiks');
    expect(displayPronunciation('  ')).toBeNull();
    expect(displayPronunciation(null)).toBeNull();
  });
});
