type PackExercise = {
  key: string;
  type: 'choose_expression' | 'fill_blank' | 'sentence_order';
  prompt: string;
  payload: Record<string, unknown>;
  feedback?: {
    expression?: string;
    meaning?: string;
    context?: string;
    example?: string;
    explanation?: string;
  };
  sortOrder?: number;
};

type CorePracticeItem = {
  key: string;
  term: string;
  meaning: string;
  context: string;
  examples?: [string, string][];
};

/** One choose + one fill so a 10-core list can supply a 5–8 question session. */
export function buildCorePracticeExercises(
  item: CorePracticeItem,
  siblingTerms: readonly string[],
): PackExercise[] {
  const distractors = siblingTerms.filter((term) => term !== item.term).slice(0, 3);
  const padded = [...distractors];
  while (padded.length < 3) {
    padded.push(`option ${padded.length + 1}`);
  }
  const example = item.examples?.[0]?.[1] ?? `Use “${item.term}” in this workplace update.`;
  const blankStem = example.includes(item.term)
    ? example.replace(item.term, '___')
    : `___ — ${item.meaning}`;
  return [
    {
      key: `${item.key}-core-ce`,
      type: 'choose_expression',
      prompt: item.meaning,
      payload: {
        options: [
          { id: 'opt_a', text: item.term },
          { id: 'opt_b', text: padded[0] },
          { id: 'opt_c', text: padded[1] },
          { id: 'opt_d', text: padded[2] },
        ],
        correctOptionId: 'opt_a',
      },
      feedback: {
        expression: item.term,
        meaning: item.meaning,
        context: item.context,
        example,
        explanation: `“${item.term}” is the core phrase for this update.`,
      },
      sortOrder: 1,
    },
    {
      key: `${item.key}-core-fb`,
      type: 'fill_blank',
      prompt: `Fill in the blank: ${blankStem}`,
      payload: { accepted: [item.term] },
      feedback: {
        expression: item.term,
        meaning: item.meaning,
        context: item.context,
        example,
        explanation: `“${item.term}” fits this workplace context.`,
      },
      sortOrder: 2,
    },
  ];
}
