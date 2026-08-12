export function shuffleArray<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temp = next[index]!;
    next[index] = next[swapIndex]!;
    next[swapIndex] = temp;
  }
  return next;
}
