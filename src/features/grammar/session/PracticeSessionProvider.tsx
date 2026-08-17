import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { saveCompletedSession } from '@/features/grammar/session/completedSessionCache';
import { createClientAttemptId } from '@/features/grammar/session/createClientAttemptId';
import type { CompletedPracticeSession, GrammarExercise } from '@/features/grammar/types/content';
import {
  buildCompletedSession,
  createInitialPracticeState,
  practiceReducer,
  shufflePracticeExercises,
  type PracticeAction,
  type PracticeState,
} from '@/features/grammar/utils';

type StartSessionInput = {
  exercises: GrammarExercise[];
  topicId: string;
  lessonId: string;
  contentRevision: number;
};

type PracticeSessionContextValue = {
  state: PracticeState;
  dispatch: (action: PracticeAction) => void;
  applyAction: (action: PracticeAction) => PracticeState;
  startSession: (input: StartSessionInput) => void;
  clearActiveSession: () => void;
  commitCompletedSession: (snapshot?: PracticeState) => CompletedPracticeSession | null;
  getCompletedSession: (clientAttemptId: string) => CompletedPracticeSession | null;
};

const PracticeSessionContext = createContext<PracticeSessionContextValue | null>(null);

function sessionKey(input: StartSessionInput): string {
  const exerciseIds = [...input.exercises.map((item) => item.id)].sort();
  return `${input.topicId}:${input.lessonId}:${input.contentRevision}:${exerciseIds.join(',')}`;
}

export function PracticeSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createInitialPracticeState);
  const [, setCompletedEpoch] = useState(0);
  const completedRef = useRef<Record<string, CompletedPracticeSession>>({});
  const startedKeyRef = useRef<string | null>(null);
  const stateRef = useRef(state);

  const applyAction = useCallback((action: PracticeAction): PracticeState => {
    const next = practiceReducer(stateRef.current, action);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const dispatch = useCallback(
    (action: PracticeAction) => {
      applyAction(action);
    },
    [applyAction],
  );

  const startSession = useCallback((input: StartSessionInput) => {
    const key = sessionKey(input);
    const current = stateRef.current;
    // Same lesson set already active (any phase, including completed while Review/Result
    // is showing and Practice stays mounted). Retry paths must clearActiveSession first.
    if (startedKeyRef.current === key && current.exercises.length > 0) {
      return;
    }
    startedKeyRef.current = key;
    const action = {
      type: 'start' as const,
      exercises: shufflePracticeExercises(input.exercises),
      clientAttemptId: createClientAttemptId(),
      topicId: input.topicId,
      lessonId: input.lessonId,
      contentRevision: input.contentRevision,
      startedAt: new Date().toISOString(),
    };
    const next = practiceReducer(stateRef.current, action);
    stateRef.current = next;
    setState(next);
  }, []);

  const clearActiveSession = useCallback(() => {
    startedKeyRef.current = null;
    const next = createInitialPracticeState();
    stateRef.current = next;
    setState(next);
  }, []);

  const commitCompletedSession = useCallback(
    (snapshot?: PracticeState): CompletedPracticeSession | null => {
      const session = buildCompletedSession(snapshot ?? stateRef.current);
      if (!session) {
        return null;
      }
      const frozen = Object.freeze({
        ...session,
        answers: Object.freeze(session.answers.map((row) => Object.freeze({ ...row }))),
      }) as CompletedPracticeSession;

      completedRef.current = {
        ...completedRef.current,
        [frozen.clientAttemptId]: frozen,
      };
      saveCompletedSession(frozen).catch(() => undefined);
      setCompletedEpoch((value) => value + 1);
      return frozen;
    },
    [],
  );

  const getCompletedSession = useCallback(
    (clientAttemptId: string) => completedRef.current[clientAttemptId] ?? null,
    [],
  );

  const value = useMemo<PracticeSessionContextValue>(
    () => ({
      state,
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      commitCompletedSession,
      getCompletedSession,
    }),
    [
      state,
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      commitCompletedSession,
      getCompletedSession,
    ],
  );

  return (
    <PracticeSessionContext.Provider value={value}>{children}</PracticeSessionContext.Provider>
  );
}

export function usePracticeSession(): PracticeSessionContextValue {
  const value = useContext(PracticeSessionContext);
  if (!value) {
    throw new Error('usePracticeSession must be used within PracticeSessionProvider');
  }
  return value;
}
