import { groupByCefrLevel, normalizeCefrLevel } from '@/features/vocabulary/utils/levels';
import { inferPos, resolvePos } from '@/features/vocabulary/utils/pos';

describe('vocabulary CEFR levels', () => {
  it('normalizes unknown levels to A2', () => {
    expect(normalizeCefrLevel('B1')).toBe('B1');
    expect(normalizeCefrLevel('C1')).toBe('C1');
    expect(normalizeCefrLevel('C2')).toBe('A2');
  });

  it('groups items A2 → B1 → B2 → C1 and keeps totals', () => {
    const groups = groupByCefrLevel(
      [
        { id: '1', level: 'B1' },
        { id: '2', level: 'A2' },
        { id: '3', level: 'B2' },
        { id: '4', level: 'A2' },
        { id: '5', level: 'C1' },
      ],
      { A2: 10, B1: 5, B2: 2, C1: 4 },
    );
    expect(groups.map((group) => group.level)).toEqual(['A2', 'B1', 'B2', 'C1']);
    expect(groups[0]?.items).toHaveLength(2);
    expect(groups[0]?.total).toBe(10);
    expect(groups[3]?.total).toBe(4);
  });
});

describe('vocabulary POS', () => {
  it('maps expression/phrase/word heuristics', () => {
    expect(inferPos('expression', "I'm blocked.")).toBe('expr');
    expect(inferPos('phrase', 'catch up')).toBe('phr v');
    expect(inferPos('phrase', 'on track')).toBe('phr');
    expect(inferPos('word', 'backlog')).toBe('n');
    expect(inferPos('word', 'deploy')).toBe('v');
  });

  it('prefers authored pos when valid', () => {
    expect(resolvePos('word', 'backlog', 'v')).toBe('v');
    expect(resolvePos('word', 'backlog', 'nope')).toBe('n');
  });
});
