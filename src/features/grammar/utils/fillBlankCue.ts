export type FillBlankPolarity = 'negative' | 'affirmative' | 'question';

export type ParsedFillBlankCue = {
  raw: string;
  lemma: string;
  polarity: FillBlankPolarity | null;
};

const POLARITY_SUFFIX = /\s*[·•]\s*(negative|affirmative|question)\s*$/i;

export function parseFillBlankCue(template: string): ParsedFillBlankCue | null {
  const match = template.match(/___\s*\(([^)]+)\)/);
  const raw = match?.[1]?.trim();
  if (!raw) {
    return null;
  }
  const polarityMatch = raw.match(POLARITY_SUFFIX);
  if (!polarityMatch) {
    return { raw, lemma: raw, polarity: null };
  }
  const polarity = polarityMatch[1]?.toLowerCase() as FillBlankPolarity;
  const lemma = raw.replace(POLARITY_SUFFIX, '').trim();
  return { raw, lemma, polarity };
}

export function fillBlankInstruction(polarity: FillBlankPolarity | null): string {
  if (polarity === 'negative') {
    return 'Fill with a negative form';
  }
  if (polarity === 'affirmative') {
    return 'Fill with an affirmative form';
  }
  if (polarity === 'question') {
    return 'Fill with a question form';
  }
  return 'Fill in the blank';
}

export function fillBlankPlaceholder(cue: ParsedFillBlankCue | null): string {
  if (!cue) {
    return 'Type your answer';
  }
  if (cue.polarity === 'negative') {
    return `Type the negative form of "${cue.lemma}"`;
  }
  if (cue.polarity === 'question') {
    return `Type the question form of "${cue.lemma}"`;
  }
  if (cue.polarity === 'affirmative') {
    return `Type "${cue.lemma}"`;
  }
  return cue.lemma.includes('/') ? cue.lemma : `Type "${cue.lemma}"`;
}
