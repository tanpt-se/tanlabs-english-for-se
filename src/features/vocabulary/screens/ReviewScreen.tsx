import { CommonActions, useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyPracticeStackParamList } from '@/app/navigation/types';
import { LearningScreen } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { useAuth } from '@/core/auth/AuthProvider';
import { useCompleteVocabularyAttempt } from '@/features/vocabulary/hooks';
import { exitVocabularyPracticeFlow } from '@/features/vocabulary/navigation/exitPracticeFlow';
import { usePracticeSession } from '@/features/vocabulary/session';
import {
  buildCompletedSession,
  isSkippedAnswer,
  splitExercisePrompt,
} from '@/features/vocabulary/utils';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function ReviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyPracticeStackParamList>>();
  const colors = useAppColors();
  const { user } = useAuth();
  const completeAttempt = useCompleteVocabularyAttempt();
  const { state, applyAction, commitCompletedSession, clearActiveSession } = usePracticeSession();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const answeredCount = state.checked.filter((row) => !isSkippedAnswer(row)).length;
  const skippedCount = state.checked.filter((row) => isSkippedAnswer(row)).length;
  const byId = new Map(state.checked.map((row) => [row.exerciseId, row]));
  const submitting = completeAttempt.isPending && !completeAttempt.isPaused;

  const practiceRouteParams = () => {
    const situationId = state.situationSlug || state.situationId;
    if (situationId === 'weak') {
      return { situationId: 'weak' as const, mode: 'weak' as const };
    }
    return { situationId };
  };

  const goToResult = (clientAttemptId: string) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'VocabularyResult', params: { clientAttemptId } }],
      }),
    );
  };

  const onSubmit = () => {
    if (submitting) {
      return;
    }
    if (!user?.id) {
      setSubmitError('Sign in to save your progress.');
      return;
    }
    const next = applyAction({ type: 'submit' });
    if (next.phase !== 'completed') {
      return;
    }
    const session = buildCompletedSession(next);
    if (!session) {
      return;
    }

    commitCompletedSession(next);
    setSubmitError(null);
    completeAttempt.mutate({
      userId: user.id,
      clientAttemptId: session.clientAttemptId,
      situationId: session.situationId,
      contentRevision: session.contentRevision,
      correctCount: session.correctCount,
      totalCount: session.totalCount,
      score: session.score,
      itemResults: session.itemResults,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      situationSlug: session.situationSlug,
    });
    goToResult(session.clientAttemptId);
  };

  const onReopen = (index: number) => {
    if (submitting) {
      return;
    }
    const next = applyAction({ type: 'reopen', index });
    if (next.phase !== 'answering') {
      return;
    }
    navigation.navigate('VocabularyPractice', practiceRouteParams());
  };

  const onBack = () => {
    if (submitting) {
      return;
    }
    const canNavigateBack =
      typeof navigation.canGoBack === 'function' ? navigation.canGoBack() : true;
    if (canNavigateBack) {
      navigation.goBack();
      return;
    }
    navigation.navigate('VocabularyPractice', practiceRouteParams());
  };

  if (state.exercises.length === 0) {
    return (
      <LearningScreen
        testID="vocabulary-review"
        header={
          <TopAppHeader
            showBack
            title="Review answers"
            onBackPress={() => {
              clearActiveSession();
              exitVocabularyPracticeFlow(navigation, { name: 'VocabularyHome' });
            }}
          />
        }
      >
        <Text style={[styles.body, { color: colors.textMuted }]}>No active practice session.</Text>
      </LearningScreen>
    );
  }

  return (
    <LearningScreen
      testID="vocabulary-review"
      header={<TopAppHeader showBack title="Review answers" onBackPress={onBack} />}
      footer={
        <BottomActionBar
          label={submitting ? 'Saving…' : 'Submit'}
          testID="vocabulary-review-submit"
          disabled={submitting}
          onPress={onSubmit}
        />
      }
    >
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {`${answeredCount} answered · ${skippedCount} skipped`}
      </Text>
      {submitError ? (
        <Text
          style={[styles.body, { color: colors.danger }]}
          testID="vocabulary-review-submit-error"
        >
          {submitError}
        </Text>
      ) : null}

      {state.exercises.map((exercise, index) => {
        const row = byId.get(exercise.id);
        const skipped = !row || isSkippedAnswer(row);
        const canReopen = !submitting && (skipped || row?.correct === false);
        const stem = splitExercisePrompt(exercise.prompt, exercise.type).stem;
        return (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canReopen }}
            disabled={!canReopen}
            testID={`vocabulary-review-row-${index}`}
            onPress={() => {
              if (canReopen) {
                onReopen(index);
              }
            }}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: colors.surface,
                opacity: pressed && canReopen ? 0.88 : 1,
              },
            ]}
          >
            <View style={styles.rowCopy}>
              <Text style={[styles.rowIndex, { color: colors.textMuted }]}>{index + 1}</Text>
              <Text style={[styles.rowStem, { color: colors.text }]} numberOfLines={2}>
                {stem}
              </Text>
            </View>
            <Text
              style={[
                styles.rowStatus,
                { color: skipped ? colors.warning : row?.correct ? colors.success : colors.danger },
              ]}
            >
              {skipped ? 'Skipped' : row?.correct ? 'Done' : 'Wrong · fix'}
            </Text>
          </Pressable>
        );
      })}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    borderRadius: themeTokens.radius.card,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: themeTokens.spacing['14'],
    paddingVertical: themeTokens.spacing['12'],
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowIndex: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  rowStem: {
    fontSize: 15,
    lineHeight: 21,
  },
  rowStatus: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
