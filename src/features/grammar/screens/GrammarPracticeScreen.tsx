import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GrammarPracticeStackParamList } from '@/app/navigation/types';
import { BrandLoading, ConfirmModal } from '@/components/ui/feedback';
import { ScreenScroll } from '@/components/ui/layout';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { FillBlankExerciseView } from '@/features/grammar/components/FillBlankExerciseView';
import { MultipleChoiceExerciseView } from '@/features/grammar/components/MultipleChoiceExerciseView';
import { PracticeFeedback } from '@/features/grammar/components/PracticeFeedback';
import { PracticeProgressBar } from '@/features/grammar/components/PracticeProgressBar';
import { SentenceOrderExerciseView } from '@/features/grammar/components/SentenceOrderExerciseView';
import {
  grammarErrorMessage,
  useGrammarExercises,
  useGrammarLesson,
  useGrammarTopic,
} from '@/features/grammar/hooks';
import { mapPublishedExercise, usePracticeSession } from '@/features/grammar/session';
import type { GrammarTopicSlug } from '@/features/grammar/types/content';
import { formatCorrectAnswer } from '@/features/grammar/utils/formatCorrectAnswer';
import { splitExercisePrompt } from '@/features/grammar/utils/splitExercisePrompt';
import { themeTokens, useAppColors } from '@/theme';

import type { EventArg } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LeaveEvent = EventArg<'beforeRemove', true, { action: { type: string } }>;

export function GrammarPracticeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarPracticeStackParamList>>();
  const route = useRoute<RouteProp<GrammarPracticeStackParamList, 'GrammarPractice'>>();
  const colors = useAppColors();
  const { topicId, lessonId } = route.params;

  const topicQuery = useGrammarTopic(topicId);
  const lessonQuery = useGrammarLesson(lessonId);
  const exercisesQuery = useGrammarExercises(lessonId);
  const { state, dispatch, applyAction, startSession, clearActiveSession } = usePracticeSession();

  const [leaveVisible, setLeaveVisible] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<LeaveEvent['data']['action'] | null>(null);
  const allowLeaveRef = useRef(false);
  const actionLockRef = useRef(false);

  const engineExercises = useMemo(() => {
    if (!exercisesQuery.data || !topicQuery.data || !lessonQuery.data) {
      return [];
    }
    return exercisesQuery.data.map((row) =>
      mapPublishedExercise(row, topicQuery.data!.slug as GrammarTopicSlug, lessonQuery.data!.slug),
    );
  }, [exercisesQuery.data, topicQuery.data, lessonQuery.data]);

  useEffect(() => {
    if (engineExercises.length === 0 || !lessonQuery.data) {
      return;
    }
    startSession({
      exercises: engineExercises,
      topicId,
      lessonId,
      contentRevision: lessonQuery.data.contentRevision,
    });
  }, [engineExercises, lessonId, lessonQuery.data, startSession, topicId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      const leaveEvent = event as LeaveEvent;
      if (allowLeaveRef.current || state.phase === 'completed' || state.exercises.length === 0) {
        return;
      }
      if (state.resumeReviewOnBack && (state.phase === 'answering' || state.phase === 'checked')) {
        leaveEvent.preventDefault();
        const next = applyAction({ type: 'back' });
        if (next.phase === 'reviewing') {
          navigation.navigate('GrammarReview');
        }
        return;
      }
      leaveEvent.preventDefault();
      setPendingLeave(leaveEvent.data.action);
      setLeaveVisible(true);
    });
    return unsubscribe;
  }, [applyAction, navigation, state]);

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
      navigation.navigate('GrammarReview');
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
        navigation.navigate('GrammarReview');
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
    if (state.phase !== 'answering') {
      return;
    }
    withActionLock(() => {
      const next = applyAction({ type: 'skip' });
      goReviewIfNeeded(next.phase);
    });
  };

  const onProgressBack = () => {
    if (
      !(
        state.phase === 'checked' ||
        (state.phase === 'answering' && (state.checked.length > 0 || state.resumeReviewOnBack))
      )
    ) {
      return;
    }
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

  const loading = topicQuery.isLoading || lessonQuery.isLoading || exercisesQuery.isLoading;
  const loadError = topicQuery.isError || lessonQuery.isError || exercisesQuery.isError;
  const emptyReady = exercisesQuery.isSuccess && (exercisesQuery.data?.length ?? 0) === 0;

  return (
    <ScreenScroll
      header={<TopAppHeader showBack title="Practice" onBackPress={onHeaderBack} />}
      footer={
        exercise && state.phase !== 'completed' && state.phase !== 'reviewing' ? (
          <BottomActionBar
            disabled={state.phase === 'answering' ? !canCheck : false}
            label={footerLabel}
            testID="grammar-practice-action"
            onPress={onPrimary}
          />
        ) : null
      }
    >
      <View style={styles.stack} testID="grammar-practice">
        {loading && !loadError && !emptyReady && !exercise ? (
          <BrandLoading fill size="md" testID="grammar-practice-loading" />
        ) : null}

        {loadError ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.body, { color: colors.danger }]}>
              {grammarErrorMessage(
                exercisesQuery.error,
                'Couldn’t load exercises. Check your connection and try again.',
              )}
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="grammar-practice-retry"
              onPress={() => {
                topicQuery.refetch().catch(() => undefined);
                lessonQuery.refetch().catch(() => undefined);
                exercisesQuery.refetch().catch(() => undefined);
              }}
            >
              <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {emptyReady ? (
          <Text style={[styles.body, { color: colors.textMuted }]}>
            This lesson has no published exercises yet.
          </Text>
        ) : null}

        {state.phase === 'reviewing' ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.body, { color: colors.text }]}>
              You’ve covered every question. Review skipped items, then submit.
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="grammar-practice-open-review"
              onPress={() => navigation.navigate('GrammarReview')}
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
                  testID="grammar-practice-count"
                >
                  {state.index + 1} / {total}
                </Text>
              </View>
              <Text style={[styles.stem, { color: colors.text }]} testID="grammar-practice-stem">
                {promptParts.stem}
              </Text>
            </View>

            {exercise.type === 'multiple_choice' ? (
              <MultipleChoiceExerciseView
                exercise={exercise}
                selectedOptionId={
                  state.response?.type === 'multiple_choice' ? state.response.optionId : null
                }
                checked={checked}
                onSelect={(optionId) =>
                  dispatch({
                    type: 'set_response',
                    response: { type: 'multiple_choice', optionId },
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
