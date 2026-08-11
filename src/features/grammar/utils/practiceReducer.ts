import {
  GRAMMAR_COMPLETION_THRESHOLD,
  type GrammarExercise,
  type PrivacyBoundedAnswerRecord,
} from '@/features/grammar/types/content';
import { gradeExercise, type LearnerResponse } from '@/features/grammar/utils/grade';

export type PracticePhase = 'answering' | 'checked' | 'completed';

export type PracticeState = {
  exercises: GrammarExercise[];
  index: number;
  phase: PracticePhase;
  response: LearnerResponse | null;
  lastCorrect: boolean | null;
  lastExplanation: string | null;
  checked: PrivacyBoundedAnswerRecord[];
  correctCount: number;
  clientAttemptId: string;
  topicId: string;
  lessonId: string;
  contentRevision: number;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  completed: boolean | null;
};

export type PracticeAction =
  | {
      type: 'start';
      exercises: GrammarExercise[];
      clientAttemptId: string;
      topicId: string;
      lessonId: string;
      contentRevision: number;
      startedAt: string;
    }
  | { type: 'set_response'; response: LearnerResponse }
  | { type: 'check' }
  | { type: 'continue' }
  | { type: 'retry'; clientAttemptId: string; startedAt: string };

export function scorePercent(correctCount: number, totalCount: number): number {
  if (totalCount <= 0) {
    return 0;
  }
  return Math.round((correctCount / totalCount) * 100);
}

export function isCompletedScore(score: number): boolean {
  return score >= GRAMMAR_COMPLETION_THRESHOLD;
}

export function monotonicBestScore(previousBest: number | null, lastScore: number): number {
  if (previousBest === null) {
    return lastScore;
  }
  return Math.max(previousBest, lastScore);
}

export function createInitialPracticeState(): PracticeState {
  return {
    exercises: [],
    index: 0,
    phase: 'answering',
    response: null,
    lastCorrect: null,
    lastExplanation: null,
    checked: [],
    correctCount: 0,
    clientAttemptId: '',
    topicId: '',
    lessonId: '',
    contentRevision: 1,
    startedAt: '',
    completedAt: null,
    score: null,
    completed: null,
  };
}

export function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'start': {
      if (action.exercises.length === 0) {
        return state;
      }
      return {
        ...createInitialPracticeState(),
        exercises: action.exercises,
        clientAttemptId: action.clientAttemptId,
        topicId: action.topicId,
        lessonId: action.lessonId,
        contentRevision: action.contentRevision,
        startedAt: action.startedAt,
      };
    }
    case 'set_response': {
      if (state.phase !== 'answering') {
        return state;
      }
      return { ...state, response: action.response };
    }
    case 'check': {
      if (state.phase !== 'answering' || state.response === null) {
        return state;
      }
      const exercise = state.exercises[state.index];
      if (!exercise) {
        return state;
      }
      const grade = gradeExercise(exercise, state.response);
      if ('error' in grade) {
        return state;
      }
      const record: PrivacyBoundedAnswerRecord = {
        exerciseId: exercise.id,
        correct: grade.correct,
        selectedIds: grade.selectedIds,
      };
      return {
        ...state,
        phase: 'checked',
        lastCorrect: grade.correct,
        lastExplanation: grade.explanation,
        checked: [...state.checked, record],
        correctCount: state.correctCount + (grade.correct ? 1 : 0),
      };
    }
    case 'continue': {
      if (state.phase !== 'checked') {
        return state;
      }
      const isLast = state.index >= state.exercises.length - 1;
      if (isLast) {
        const total = state.exercises.length;
        const score = scorePercent(state.correctCount, total);
        return {
          ...state,
          phase: 'completed',
          score,
          completed: isCompletedScore(score),
          completedAt: new Date().toISOString(),
          response: null,
        };
      }
      return {
        ...state,
        index: state.index + 1,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
      };
    }
    case 'retry': {
      if (state.exercises.length === 0) {
        return state;
      }
      return {
        ...createInitialPracticeState(),
        exercises: state.exercises,
        clientAttemptId: action.clientAttemptId,
        topicId: state.topicId,
        lessonId: state.lessonId,
        contentRevision: state.contentRevision,
        startedAt: action.startedAt,
      };
    }
    default:
      return state;
  }
}

export function buildCompletedSession(state: PracticeState) {
  if (state.phase !== 'completed' || state.score === null || state.completed === null) {
    return null;
  }
  return {
    clientAttemptId: state.clientAttemptId,
    topicId: state.topicId,
    lessonId: state.lessonId,
    contentRevision: state.contentRevision,
    correctCount: state.correctCount,
    totalCount: state.exercises.length,
    score: state.score,
    completed: state.completed,
    answers: state.checked,
    startedAt: state.startedAt,
    completedAt: state.completedAt ?? state.startedAt,
  };
}
