export { aggregateItemResults } from '@/features/vocabulary/utils/aggregateItemResults';
export {
  composeSituationSession,
  composeWeakSession,
  SESSION_MAX,
  SESSION_MIN,
  SESSION_MIX,
  SESSION_TARGET,
  type ComposeSessionResult,
} from '@/features/vocabulary/utils/composeSession';
export {
  gradeExercise,
  type GradeResult,
  type LearnerResponse,
} from '@/features/vocabulary/utils/grade';
export { normalizeFillBlank } from '@/features/vocabulary/utils/normalize';
export {
  buildCompletedSession,
  createInitialPracticeState,
  isCompletedScore,
  isSkippedAnswer,
  monotonicBestScore,
  practiceReducer,
  scorePercent,
  type PracticeAction,
  type PracticePhase,
  type PracticeState,
} from '@/features/vocabulary/utils/practiceReducer';
export { formatCorrectAnswer, splitExercisePrompt } from '@/features/vocabulary/utils/prompt';
export { countKnownInSituation } from '@/features/vocabulary/utils/progress';
export { shuffleArray } from '@/features/vocabulary/utils/shuffle';
export { shufflePracticeExercises } from '@/features/vocabulary/utils/shufflePracticeExercises';
export {
  isWeakItem,
  sortWeakItems,
  type WeakProgressRow,
} from '@/features/vocabulary/utils/weakItems';
