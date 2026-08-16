/** Authoring stores "Goal: …"; screens show the heading separately. */
export function lessonGoalText(usage: string): string {
  return usage.replace(/^Goal:\s*/i, '').trim();
}
