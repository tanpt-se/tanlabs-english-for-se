import { pickFirstUnlearnedCore } from '@/features/vocabulary/utils/continueCore';

describe('pickFirstUnlearnedCore', () => {
  const items = [
    { id: 'standup:1', coreOrder: 1, situationSortOrder: 1 },
    { id: 'standup:2', coreOrder: 2, situationSortOrder: 1 },
    { id: 'meetings:1', coreOrder: 1, situationSortOrder: 2 },
  ];

  it('returns the first unlearned core by situation then core order', () => {
    expect(pickFirstUnlearnedCore(items, new Set())).toEqual(items[0]);
    expect(pickFirstUnlearnedCore(items, new Set(['standup:1']))).toEqual(items[1]);
    expect(pickFirstUnlearnedCore(items, new Set(['standup:1', 'standup:2']))).toEqual(items[2]);
    expect(pickFirstUnlearnedCore([{ id: 'solo' }], new Set())).toEqual({ id: 'solo' });
  });

  it('returns null when every core expression is known', () => {
    expect(pickFirstUnlearnedCore(items, new Set(items.map((item) => item.id)))).toBeNull();
  });
});
