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
import { SentenceOrderExerciseView } from '@/features/vocabulary/components/SentenceOrderExerciseView';
import { loadKnownItemIds } from '@/features/vocabulary/data/knownItemsStore';
import {
  vocabularyErrorMessage,
  useVocabularyExercises,
  useVocabularySituation,
  useVocabularyWeakProgress,
} from '@/features/vocabulary/hooks';
import { usePracticeSession } from '@/features/vocabulary/session';
import {
  composeSituationSession,
  composeWeakSession,
  formatCorrectAnswer,
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

  const situationQuery = useVocabularySituation(situationId);
  const exercisesQuery = useVocabularyExercises(situationId);
  const weakQuery = useVocabularyWeakProgress();
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
    const pool = exercisesQuery.data ?? [];
    if (pool.length === 0) {
      return null;
    }
    if (mode === 'weak') {
      const weakItemIds = (weakQuery.data ?? []).map((row) => row.itemId);
      return composeWeakSession(pool, weakItemIds);
    }
    const preferItemIds =
      knownIds === null
        ? undefined
        : pool
            .filter((exercise) => exercise.itemId && !knownIds.has(exercise.itemId))
            .map((exercise) => exercise.itemId as string);
    return composeSituationSession(pool, { preferItemIds });
  }, [exercisesQuery.data, knownIds, mode, weakQuery.data]);

  useEffect(() => {
    // Wait for knownIds so preferItemIds is stable — otherwise startSession key
    // changes mid-flow and wipes checked answers while Review is open.
    if (knownIds === null || !composed?.ok || !situationQuery.data) {
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
  }, [composed, knownIds, situationQuery.data, startSession]);

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
    situationQuery.isLoading ||
    exercisesQuery.isLoading ||
    (mode === 'weak' && weakQuery.isLoading) ||
    knownIds === null;
  const loadError = situationQuery.isError || exercisesQuery.isError || weakQuery.isError;
  const insufficient =
    composed !== null && !composed.ok && composed.reason === 'insufficient_content';
  const emptyReady = exercisesQuery.isSuccess && (exercisesQuery.data?.length ?? 0) === 0;

  return (
    <ScreenScroll
      header={
        <TopAppHeader
          showBack
          title={situationQuery.data?.title ?? 'Practice'}
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
                exercisesQuery.error ?? situationQuery.error ?? weakQuery.error,
                'Couldn’t load exercises. Check your connection and try again.',
              )}
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="vocabulary-practice-retry"
              onPress={() => {
                situationQuery.refetch().catch(() => undefined);
                exercisesQuery.refetch().catch(() => undefined);
                if (mode === 'weak') {
                  weakQuery.refetch().catch(() => undefined);
                }
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
                <Text style={[styles.instruction, { color: colors.primary }]}>
                  {promptParts.instruction}
                </Text>
                <Text
                  style={[styles.questionCount, { color: colors.text }]}
                  testID="vocabulary-practice-count"
                >
                  {state.index + 1} / {total}
                </Text>
              </View>
              <Text style={[styles.stem, { color: colors.text }]} testID="vocabulary-practice-stem">
                {promptParts.stem}
              </Text>
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
                expression={exercise.feedback.expression}
                meaning={exercise.feedback.meaning}
                context={exercise.feedback.context}
                example={exercise.feedback.example}
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
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  instruction: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    minWidth: 0,
  },
  instructionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
    width: '100%',
  },
  promptBlock: {
    gap: themeTokens.spacing['6'],
    width: '100%',
  },
  questionCount: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
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
  stem: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
});
