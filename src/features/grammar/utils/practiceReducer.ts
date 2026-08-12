import {
  GRAMMAR_COMPLETION_THRESHOLD,
  type GrammarExercise,
  type PrivacyBoundedAnswerRecord,
} from '@/features/grammar/types/content';
import { gradeExercise, type LearnerResponse } from '@/features/grammar/utils/grade';
import { shufflePracticeExercises } from '@/features/grammar/utils/shufflePracticeExercises';

export type PracticePhase = 'answering' | 'checked' | 'reviewing' | 'completed';

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
  resumeReviewOnBack: boolean;
  reopenedPrior: PrivacyBoundedAnswerRecord | null;
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
  | { type: 'skip' }
  | { type: 'back' }
  | { type: 'continue' }
  | { type: 'reopen'; index: number }
  | { type: 'submit' }
  | { type: 'return_to_review' }
  | { type: 'retry'; clientAttemptId: string; startedAt: string }
  | { type: 'reset' };

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

export function isSkippedAnswer(record: PrivacyBoundedAnswerRecord | undefined): boolean {
  return record?.skipped === true;
}

function coveredIds(checked: PrivacyBoundedAnswerRecord[]): Set<string> {
  return new Set(checked.map((row) => row.exerciseId));
}

function enterReview(state: PracticeState, checked: PrivacyBoundedAnswerRecord[]): PracticeState {
  return {
    ...state,
    phase: 'reviewing',
    response: null,
    lastCorrect: null,
    lastExplanation: null,
    checked,
    resumeReviewOnBack: false,
    reopenedPrior: null,
  };
}

function nextOpenIndex(
  exercises: GrammarExercise[],
  checked: PrivacyBoundedAnswerRecord[],
  afterIndex: number,
): number {
  const covered = coveredIds(checked);
  const forward = exercises.findIndex(
    (exercise, index) => index > afterIndex && !covered.has(exercise.id),
  );
  if (forward >= 0) {
    return forward;
  }
  return exercises.findIndex((exercise) => !covered.has(exercise.id));
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
    resumeReviewOnBack: false,
    reopenedPrior: null,
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
      const withoutCurrent = state.checked.filter((row) => row.exerciseId !== exercise.id);
      const prior = state.checked.find((row) => row.exerciseId === exercise.id);
      const record: PrivacyBoundedAnswerRecord = {
        exerciseId: exercise.id,
        correct: grade.correct,
        selectedIds: grade.selectedIds,
        skipped: false,
      };
      return {
        ...state,
        phase: 'checked',
        lastCorrect: grade.correct,
        lastExplanation: grade.explanation,
        checked: [...withoutCurrent, record],
        correctCount: state.correctCount - (prior?.correct ? 1 : 0) + (grade.correct ? 1 : 0),
      };
    }
    case 'skip': {
      if (state.phase !== 'answering') {
        return state;
      }
      const exercise = state.exercises[state.index];
      if (!exercise) {
        return state;
      }
      const withoutCurrent = state.checked.filter((row) => row.exerciseId !== exercise.id);
      const prior = state.checked.find((row) => row.exerciseId === exercise.id);
      const record: PrivacyBoundedAnswerRecord = {
        exerciseId: exercise.id,
        correct: false,
        selectedIds: [],
        skipped: true,
      };
      const checked = [...withoutCurrent, record];
      const correctCount = state.correctCount - (prior?.correct ? 1 : 0);
      if (coveredIds(checked).size >= state.exercises.length) {
        return enterReview({ ...state, correctCount }, checked);
      }
      const target = nextOpenIndex(state.exercises, checked, state.index);
      if (target < 0) {
        return enterReview({ ...state, correctCount }, checked);
      }
      return {
        ...state,
        index: target,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked,
        correctCount,
        resumeReviewOnBack: false,
        reopenedPrior: null,
      };
    }
    case 'back': {
      if (
        state.phase === 'completed' ||
        state.phase === 'reviewing' ||
        state.exercises.length === 0
      ) {
        return state;
      }
      if (state.phase === 'checked') {
        const last = state.checked[state.checked.length - 1];
        const current = state.exercises[state.index];
        if (!last || !current || last.exerciseId !== current.id) {
          return state;
        }
        if (state.resumeReviewOnBack) {
          const withoutCurrent = state.checked.slice(0, -1);
          const correctCount = state.correctCount - (last.correct ? 1 : 0);
          const prior = state.reopenedPrior;
          let checked = withoutCurrent;
          let nextCorrect = correctCount;
          if (prior && !checked.some((row) => row.exerciseId === prior.exerciseId)) {
            checked = [...checked, prior];
            nextCorrect += prior.correct ? 1 : 0;
          }
          return enterReview({ ...state, correctCount: nextCorrect }, checked);
        }
        return {
          ...state,
          phase: 'answering',
          response: null,
          lastCorrect: null,
          lastExplanation: null,
          checked: state.checked.slice(0, -1),
          correctCount: state.correctCount - (last.correct ? 1 : 0),
        };
      }
      if (state.resumeReviewOnBack) {
        const prior = state.reopenedPrior;
        let checked = state.checked;
        let correctCount = state.correctCount;
        if (prior && !checked.some((row) => row.exerciseId === prior.exerciseId)) {
          checked = [...checked, prior];
          correctCount += prior.correct ? 1 : 0;
        }
        return enterReview({ ...state, correctCount }, checked);
      }
      if (state.checked.length === 0) {
        return state;
      }
      const previous = state.checked[state.checked.length - 1];
      if (!previous) {
        return state;
      }
      const previousIndex = state.exercises.findIndex((item) => item.id === previous.exerciseId);
      if (previousIndex < 0) {
        return state;
      }
      return {
        ...state,
        index: previousIndex,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: state.checked.slice(0, -1),
        correctCount: state.correctCount - (previous.correct ? 1 : 0),
        resumeReviewOnBack: false,
        reopenedPrior: null,
      };
    }
    case 'continue': {
      if (state.phase !== 'checked') {
        return state;
      }
      if (coveredIds(state.checked).size >= state.exercises.length) {
        return enterReview(state, state.checked);
      }
      const target = nextOpenIndex(state.exercises, state.checked, state.index);
      if (target < 0) {
        return enterReview(state, state.checked);
      }
      return {
        ...state,
        index: target,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        resumeReviewOnBack: false,
        reopenedPrior: null,
      };
    }
    case 'reopen': {
      if (state.phase !== 'reviewing') {
        return state;
      }
      if (action.index < 0 || action.index >= state.exercises.length) {
        return state;
      }
      const exercise = state.exercises[action.index];
      if (!exercise) {
        return state;
      }
      const prior = state.checked.find((row) => row.exerciseId === exercise.id);
      const snapshot: PrivacyBoundedAnswerRecord = prior ?? {
        exerciseId: exercise.id,
        correct: false,
        selectedIds: [],
        skipped: true,
      };
      return {
        ...state,
        index: action.index,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: state.checked.filter((row) => row.exerciseId !== exercise.id),
        correctCount: state.correctCount - (prior?.correct ? 1 : 0),
        resumeReviewOnBack: true,
        reopenedPrior: snapshot,
      };
    }
    case 'submit': {
      if (state.phase !== 'reviewing' || state.exercises.length === 0) {
        return state;
      }
      if (coveredIds(state.checked).size < state.exercises.length) {
        return state;
      }
      const score = scorePercent(state.correctCount, state.exercises.length);
      return {
        ...state,
        phase: 'completed',
        score,
        completed: isCompletedScore(score),
        completedAt: new Date().toISOString(),
        response: null,
        lastCorrect: null,
        lastExplanation: null,
      };
    }
    case 'return_to_review': {
      if (state.phase !== 'completed') {
        return state;
      }
      return {
        ...state,
        phase: 'reviewing',
        score: null,
        completed: null,
        completedAt: null,
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
        exercises: shufflePracticeExercises(state.exercises),
        clientAttemptId: action.clientAttemptId,
        topicId: state.topicId,
        lessonId: state.lessonId,
        contentRevision: state.contentRevision,
        startedAt: action.startedAt,
      };
    }
    case 'reset':
      return createInitialPracticeState();
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
