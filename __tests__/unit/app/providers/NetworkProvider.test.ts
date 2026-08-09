import { shouldResumePausedMutations } from '@/app/providers/NetworkProvider';

test.each([
  [false, true, true],
  [true, false, true],
  [true, true, false],
])('does not resume until cache and connectivity are ready', (cacheRestored, known, online) => {
  expect(shouldResumePausedMutations(cacheRestored, known, online)).toBe(false);
});

test('resumes after cache restoration and confirmed connectivity', () => {
  expect(shouldResumePausedMutations(true, true, true)).toBe(true);
});
