import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyPracticeStackParamList } from '@/app/navigation/types';
import { BrandLoading, ConfirmModal } from '@/components/ui/feedback';
import { ScreenScroll } from '@/components/ui/layout';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { ChooseExpressionExerciseView } from '@/features/vocabulary/components/ChooseExpressionExerciseView';
import { FillBlankExerciseView } from '@/features/vocabulary/components/FillBlankExerciseView';
import { PracticeFeedback } from '@/features/vocabulary/components/PracticeFeedback';
import { PracticeProgressBar } from '@/features/vocabulary/components/PracticeProgressBar';
import { PromptCard } from '@/features/vocabulary/components/PromptCard';
import { SentenceOrderExerciseView } from '@/features/vocabulary/components/SentenceOrderExerciseView';
import { loadKnownItemIds } from '@/features/vocabulary/data/knownItemsStore';
import {
  vocabularyErrorMessage,
  useVocabularyExercises,
  useVocabularySituation,
  useVocabularyWeakExercises,
  useVocabularyWeakProgress,
} from '@/features/vocabulary/hooks';
import { usePracticeSession } from '@/features/vocabulary/session';
import {
  composeSituationSession,
  composeWeakSession,
  CORE_SESSION_MIN,
  CORE_SESSION_TARGET,
  formatCorrectAnswer,
  SESSION_TARGET,
  splitExercisePrompt,
} from '@/features/vocabulary/utils';
import { themeTokens, useAppColors } from '@/theme';

import type { EventArg } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LeaveEvent = EventArg<'beforeRemove', true, { action: { type: string } }>;

export function PracticeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyPracticeStackParamList>>();
  const route = useRoute<RouteProp<VocabularyPracticeStackParamList, 'VocabularyPractice'>>();
  const colors = useAppColors();
  const { situationId, mode = 'situation' } = route.params;
  const isWeakMode = mode === 'weak';

  const situationQuery = useVocabularySituation(isWeakMode ? undefined : situationId);
  const exercisesQuery = useVocabularyExercises(isWeakMode ? undefined : situationId);
  const weakQuery = useVocabularyWeakProgress();
  const weakItemIds = isWeakMode
    ? (weakQuery.data ?? []).slice(0, SESSION_TARGET).map((row) => row.itemId)
    : [];
  // Stabilize ids so refetch/focus does not recompose mid-session.
  const weakItemIdsKey = weakItemIds.join('\0');
  const stableWeakItemIds = useMemo(
    () => (weakItemIdsKey.length > 0 ? weakItemIdsKey.split('\0') : ([] as string[])),
    [weakItemIdsKey],
  );
  const weakExercisesQuery = useVocabularyWeakExercises(stableWeakItemIds);
  const { state, dispatch, applyAction, startSession, clearActiveSession, getActiveState } =
    usePracticeSession();

  const [knownIds, setKnownIds] = useState<Set<string> | null>(null);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<LeaveEvent['data']['action'] | null>(null);
  const allowLeaveRef = useRef(false);
  const actionLockRef = useRef(false);
  const startedTrackedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    loadKnownItemIds()
      .then((ids) => {
        if (alive) {
          setKnownIds(ids);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const composed = useMemo(() => {
    if (isWeakMode) {
      const pool = weakExercisesQuery.data ?? [];
      if (pool.length === 0) {
        return null;
      }
      return composeWeakSession(pool, stableWeakItemIds);
    }
    const pool = exercisesQuery.data ?? [];
    if (!situationQuery.isSuccess || !exercisesQuery.isSuccess) {
      return null;
    }
    const coreItemIds = situationQuery.data?.coreItemIds ?? [];
    if (coreItemIds.length === 0) {
      return { ok: false, reason: 'insufficient_content', available: 0 };
    }
    if (pool.length === 0) {
      return null;
    }
    const preferItemIds =
      knownIds === null ? coreItemIds : coreItemIds.filter((id) => !knownIds.has(id));
    const coreIds = new Set(coreItemIds);
    const corePool = pool.filter((exercise) => exercise.itemId && coreIds.has(exercise.itemId));
    return composeSituationSession(corePool, {
      preferItemIds: preferItemIds.length ? preferItemIds : coreItemIds,
      minExercises: CORE_SESSION_MIN,
      targetTotal: CORE_SESSION_TARGET,
    });
  }, [
    exercisesQuery.data,
    exercisesQuery.isSuccess,
    isWeakMode,
    knownIds,
    situationQuery.data,
    situationQuery.isSuccess,
    stableWeakItemIds,
    weakExercisesQuery.data,
  ]);

  useEffect(() => {
    // Wait for knownIds so preferItemIds is stable — otherwise startSession key
    // changes mid-flow and wipes checked answers while Review is open.
    if (knownIds === null || !composed?.ok) {
      return;
    }
    if (isWeakMode) {
      startSession({
        exercises: composed.exercises,
        situationId: 'weak',
        situationSlug: 'weak',
        contentRevision: 1,
      });
      if (!startedTrackedRef.current) {
        startedTrackedRef.current = true;
        trackEvent('vocabulary_practice_started', {
          situation_slug: 'weak',
        }).catch(() => undefined);
      }
      return;
    }
    if (!situationQuery.data) {
      return;
    }
    startSession({
      exercises: composed.exercises,
      situationId: situationQuery.data.id,
      situationSlug: situationQuery.data.slug,
      contentRevision: 1,
    });
    if (!startedTrackedRef.current) {
      startedTrackedRef.current = true;
      trackEvent('vocabulary_practice_started', {
        situation_slug: situationQuery.data.slug,
      }).catch(() => undefined);
    }
  }, [composed, isWeakMode, knownIds, situationQuery.data, startSession]);

  useEffect(() => {
    startedTrackedRef.current = false;
  }, [situationId, mode]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      const leaveEvent = event as LeaveEvent;
      const latest = getActiveState();
      if (allowLeaveRef.current || latest.phase === 'completed' || latest.exercises.length === 0) {
        return;
      }
      if (
        latest.resumeReviewOnBack &&
        (latest.phase === 'answering' || latest.phase === 'checked')
      ) {
        leaveEvent.preventDefault();
        const next = applyAction({ type: 'back' });
        if (next.phase === 'reviewing') {
          navigation.navigate('VocabularyReview');
        }
        return;
      }
      leaveEvent.preventDefault();
      setPendingLeave(leaveEvent.data.action);
      setLeaveVisible(true);
    });
    return unsubscribe;
  }, [applyAction, getActiveState, navigation]);

  const exercise = state.exercises[state.index];
  const total = state.exercises.length;
  const checked = state.phase === 'checked';
  const canGoBack =
    state.phase === 'checked' ||
    (state.phase === 'answering' && (state.checked.length > 0 || state.resumeReviewOnBack));
  const canSkip = state.phase === 'answering';
  const canCheck = (() => {
    if (state.phase !== 'answering' || !state.response) {
      return false;
    }
    if (state.response.type === 'fill_blank') {
      return state.response.text.trim().length > 0;
    }
    if (state.response.type === 'sentence_order') {
      if (!exercise || exercise.type !== 'sentence_order') {
        return false;
      }
      return state.response.tokenIds.length === exercise.answer.tokenIds.length;
    }
    return true;
  })();

  const promptParts = exercise ? splitExercisePrompt(exercise.prompt, exercise.type) : null;

  const footerLabel =
    state.phase === 'checked'
      ? state.checked.length >= total
        ? 'Review answers'
        : 'Continue'
      : 'Check answer';

  const goReviewIfNeeded = (nextPhase: string) => {
    if (nextPhase === 'reviewing') {
      navigation.navigate('VocabularyReview');
    }
  };

  const withActionLock = (run: () => void) => {
    if (actionLockRef.current) {
      return;
    }
    actionLockRef.current = true;
    try {
      run();
    } finally {
      queueMicrotask(() => {
        actionLockRef.current = false;
      });
    }
  };

  const returnToReview = () => {
    withActionLock(() => {
      const next = applyAction({ type: 'back' });
      if (next.phase === 'reviewing') {
        navigation.navigate('VocabularyReview');
      }
    });
  };

  const onPrimary = () => {
    withActionLock(() => {
      if (state.phase === 'answering') {
        if (
          !state.response ||
          (state.response.type === 'fill_blank' && state.response.text.trim().length === 0) ||
          (state.response.type === 'sentence_order' &&
            (!exercise ||
              exercise.type !== 'sentence_order' ||
              state.response.tokenIds.length !== exercise.answer.tokenIds.length))
        ) {
          return;
        }
        dispatch({ type: 'check' });
        return;
      }
      if (state.phase === 'checked') {
        const next = applyAction({ type: 'continue' });
        goReviewIfNeeded(next.phase);
      }
    });
  };

  const onSkip = () => {
    withActionLock(() => {
      const next = applyAction({ type: 'skip' });
      goReviewIfNeeded(next.phase);
    });
  };

  const onProgressBack = () => {
    withActionLock(() => {
      const next = applyAction({ type: 'back' });
      goReviewIfNeeded(next.phase);
    });
  };

  const onHeaderBack = () => {
    if (state.resumeReviewOnBack && (state.phase === 'answering' || state.phase === 'checked')) {
      returnToReview();
      return;
    }
    navigation.goBack();
  };

  const loading =
    (!isWeakMode && (situationQuery.isLoading || exercisesQuery.isLoading)) ||
    (isWeakMode && (weakQuery.isLoading || weakExercisesQuery.isLoading)) ||
    knownIds === null;
  const loadError =
    (!isWeakMode && (situationQuery.isError || exercisesQuery.isError)) ||
    (isWeakMode && (weakQuery.isError || weakExercisesQuery.isError));
  const insufficient =
    composed !== null && !composed.ok && composed.reason === 'insufficient_content';
  const emptyReady = isWeakMode
    ? weakExercisesQuery.isSuccess && (weakExercisesQuery.data?.length ?? 0) === 0
    : exercisesQuery.isSuccess && (exercisesQuery.data?.length ?? 0) === 0;

  return (
    <ScreenScroll
      header={
        <TopAppHeader
          showBack
          title={isWeakMode ? 'Weak items' : situationQuery.data?.title ?? 'Practice'}
          onBackPress={onHeaderBack}
        />
      }
      footer={
        exercise && state.phase !== 'completed' && state.phase !== 'reviewing' ? (
          <BottomActionBar
            disabled={state.phase === 'answering' ? !canCheck : false}
            label={footerLabel}
            testID="vocabulary-practice-action"
            onPress={onPrimary}
          />
        ) : null
      }
    >
      <View style={styles.stack} testID="vocabulary-practice">
        {loading && !loadError && !emptyReady && !insufficient && !exercise ? (
          <BrandLoading fill size="md" testID="vocabulary-practice-loading" />
        ) : null}

        {loadError ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.body, { color: colors.danger }]}>
              {vocabularyErrorMessage(
                isWeakMode
                  ? weakExercisesQuery.error ?? weakQuery.error
                  : exercisesQuery.error ?? situationQuery.error,
                'Couldn’t load exercises. Check your connection and try again.',
              )}
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="vocabulary-practice-retry"
              onPress={() => {
                if (isWeakMode) {
                  weakQuery.refetch().catch(() => undefined);
                  weakExercisesQuery.refetch().catch(() => undefined);
                  return;
                }
                situationQuery.refetch().catch(() => undefined);
                exercisesQuery.refetch().catch(() => undefined);
              }}
            >
              <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {emptyReady || insufficient ? (
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {mode === 'weak'
              ? 'No weak-item exercises are available yet. Complete a practice session first.'
              : 'This situation does not have enough published exercises yet.'}
          </Text>
        ) : null}

        {state.phase === 'reviewing' ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.body, { color: colors.text }]}>
              You’ve covered every question. Review skipped items, then submit.
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="vocabulary-practice-open-review"
              onPress={() => navigation.navigate('VocabularyReview')}
            >
              <Text style={[styles.retry, { color: colors.primary }]}>Review answers</Text>
            </Pressable>
          </View>
        ) : null}

        {exercise && promptParts && state.phase !== 'reviewing' ? (
          <>
            <PracticeProgressBar
              canGoBack={canGoBack}
              canSkip={canSkip}
              index={state.index}
              total={total}
              onBack={onProgressBack}
              onSkip={onSkip}
            />

            <View style={styles.promptBlock}>
              <View style={styles.instructionRow}>
                <Text style={[styles.instruction, { color: colors.text }]}>
                  {promptParts.instruction}
                </Text>
                <Text
                  style={[styles.questionCount, { color: colors.textSecondary }]}
                  testID="vocabulary-practice-count"
                >
                  {state.index + 1} / {total}
                </Text>
              </View>
              <PromptCard testID="vocabulary-practice-stem" text={promptParts.stem} />
              {exercise.type === 'choose_expression' ? (
                <Text style={[styles.ask, { color: colors.text }]}>What would you say?</Text>
              ) : null}
            </View>

            {exercise.type === 'choose_expression' ? (
              <ChooseExpressionExerciseView
                exercise={exercise}
                selectedOptionId={
                  state.response?.type === 'choose_expression' ? state.response.optionId : null
                }
                checked={checked}
                onSelect={(optionId) =>
                  dispatch({
                    type: 'set_response',
                    response: { type: 'choose_expression', optionId },
                  })
                }
              />
            ) : null}

            {exercise.type === 'fill_blank' ? (
              <FillBlankExerciseView
                exercise={exercise}
                value={state.response?.type === 'fill_blank' ? state.response.text : ''}
                checked={checked}
                onChange={(text) =>
                  dispatch({ type: 'set_response', response: { type: 'fill_blank', text } })
                }
              />
            ) : null}

            {exercise.type === 'sentence_order' ? (
              <SentenceOrderExerciseView
                exercise={exercise}
                orderedTokenIds={
                  state.response?.type === 'sentence_order' ? state.response.tokenIds : []
                }
                checked={checked}
                onChange={(tokenIds) =>
                  dispatch({
                    type: 'set_response',
                    response: { type: 'sentence_order', tokenIds },
                  })
                }
              />
            ) : null}

            {checked && state.lastCorrect !== null && state.lastExplanation ? (
              <PracticeFeedback
                correct={state.lastCorrect}
                explanation={state.lastExplanation}
                correctAnswerLabel={formatCorrectAnswer(exercise)}
              />
            ) : null}
          </>
        ) : null}
      </View>

      <ConfirmModal
        visible={leaveVisible}
        title="Leave practice?"
        message="Your current answers won’t be saved as an attempt."
        confirmLabel="Leave"
        confirmTone="danger"
        cancelLabel="Stay"
        onCancel={() => {
          allowLeaveRef.current = false;
          setLeaveVisible(false);
          setPendingLeave(null);
        }}
        onConfirm={() => {
          const action = pendingLeave;
          allowLeaveRef.current = true;
          setLeaveVisible(false);
          setPendingLeave(null);
          clearActiveSession();
          if (action) {
            navigation.dispatch(action);
          }
        }}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  ask: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  instruction: {
    flex: 1,
    fontSize: themeTokens.typography.size.label,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.label,
    minWidth: 0,
  },
  instructionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
    width: '100%',
  },
  promptBlock: {
    gap: themeTokens.spacing.sm,
    width: '100%',
  },
  questionCount: {
    fontSize: themeTokens.typography.size.label,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.label,
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    paddingVertical: 12,
  },
  stack: {
    flexGrow: 1,
    gap: themeTokens.spacing.md,
    width: '100%',
  },
  stateBlock: {
    gap: themeTokens.spacing.sm,
  },
});
