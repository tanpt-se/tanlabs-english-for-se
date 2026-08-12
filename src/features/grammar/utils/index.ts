export { formatCorrectAnswer } from '@/features/grammar/utils/formatCorrectAnswer';
export { gradeExercise } from '@/features/grammar/utils/grade';
export type { GradeResult, LearnerResponse } from '@/features/grammar/utils/grade';
export { normalizeFillBlank, normalizeOrderTokenText } from '@/features/grammar/utils/normalize';
export {
  buildCompletedSession,
  createInitialPracticeState,
  isCompletedScore,
  isSkippedAnswer,
  monotonicBestScore,
  practiceReducer,
  scorePercent,
} from '@/features/grammar/utils/practiceReducer';
export type {
  PracticeAction,
  PracticePhase,
  PracticeState,
} from '@/features/grammar/utils/practiceReducer';
export { shuffleArray } from '@/features/grammar/utils/shuffle';
export { shufflePracticeExercises } from '@/features/grammar/utils/shufflePracticeExercises';
export { splitExercisePrompt } from '@/features/grammar/utils/splitExercisePrompt';
export {
  pickContinueLessonForTopic,
  pickGlobalContinueLearning,
} from '@/features/grammar/utils/continueLearning';
export type { ContinueLearningTarget } from '@/features/grammar/utils/continueLearning';
export {
  countCompletedGrammarTopics,
  GRAMMAR_LESSONS_PER_TOPIC,
  isTopicFullyCompleted,
  lessonBestScoreRatio,
  progressStatusFromScore,
  topicBestScoreProgressRatio,
} from '@/features/grammar/utils/topicProgress';
