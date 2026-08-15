import type { CefrLevel } from '@/features/vocabulary/utils/levels';
import type { VocabularyPos } from '@/features/vocabulary/utils/pos';

export type VocabularyExpression = {
  id: string;
  text: string;
  tag: string;
  intent?: string;
  needsPractice?: boolean;
  level: CefrLevel;
  pos: VocabularyPos;
  context?: string;
};

export type VocabularyTermDetail = {
  id: string;
  situationId: string;
  term: string;
  type: 'word' | 'phrase' | 'expression';
  pos: VocabularyPos;
  level: CefrLevel;
  meaning: string;
  context: string;
  patterns: string[];
  examples: Array<{ label: string; sentence: string }>;
  alternatives: string[];
  notes: string[];
};
