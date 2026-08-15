import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { useMutationState } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { VocabularyPracticeStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { CompletionHero, Feedback, LearningScreen, ResultMetric } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import {
  useCompleteVocabularyAttempt,
  useVocabularyResultSession,
  useVocabularySituation,
} from '@/features/vocabulary/hooks';
import { vocabularyCompletionMutationKey } from '@/features/vocabulary/mutations';
import { exitVocabularyPracticeFlow } from '@/features/vocabulary/navigation/exitPracticeFlow';
import { usePracticeSession } from '@/features/vocabulary/session';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function PracticeResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyPracticeStackParamList>>();
  const route = useRoute<RouteProp<VocabularyPracticeStackParamList, 'VocabularyResult'>>();
  const colors = useAppColors();
  const { user } = useAuth();
  const { clearActiveSession } = usePracticeSession();
  const saveMutation = useCompleteVocabularyAttempt();
  const { session, isLoading } = useVocabularyResultSession(route.params.clientAttemptId);
  const situationQuery = useVocabularySituation(
    session?.situationSlug === 'weak' ? undefined : session?.situationId,
  );
  const needsPractice = session ? Math.max(session.totalCount - session.correctCount, 0) : 0;
  const retryTracked = useRef(false);

  const saveStates = useMutationState({
    filters: { mutationKey: vocabularyCompletionMutationKey },
  });
  const matchingSave = [...saveStates]
    .reverse()
    .find(
      (row) =>
        (row.variables as { clientAttemptId?: string } | undefined)?.clientAttemptId ===
        route.params.clientAttemptId,
    );
  const saveStatus = matchingSave?.status ?? 'idle';
  const savePaused = Boolean(matchingSave?.isPaused);
  const savePending = saveStatus === 'pending';
  const saveError = saveStatus === 'error';
  const saveSuccess = saveStatus === 'success';

  useEffect(() => {
    retryTracked.current = false;
  }, [route.params.clientAttemptId]);

  const goHome = () => {
    clearActiveSession();
    exitVocabularyPracticeFlow(navigation, { name: 'VocabularyHome' });
  };

  const goWeak = () => {
    clearActiveSession();
    exitVocabularyPracticeFlow(navigation, { name: 'VocabularyWeak' });
  };

  const retry = () => {
    if (!session) {
      goHome();
      return;
    }
    if (!retryTracked.current) {
      retryTracked.current = true;
      trackEvent('vocabulary_practice_retry', {
        situation_slug: session.situationSlug ?? situationQuery.data?.slug,
      }).catch(() => undefined);
    }
    clearActiveSession();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'VocabularyPractice',
            params:
              session.situationSlug === 'weak'
                ? { situationId: 'weak', mode: 'weak' as const }
                : { situationId: session.situationId },
          },
        ],
      }),
    );
  };

  const retrySave = () => {
    if (!session || !user?.id || savePending) {
      return;
    }
    saveMutation.mutate({
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
      situationSlug: session.situationSlug ?? situationQuery.data?.slug,
    });
  };

  const syncTitle = savePaused
    ? 'Waiting for connection'
    : savePending
    ? 'Saving progress'
    : saveError
    ? 'Couldn’t save yet'
    : saveSuccess
    ? session?.completed
      ? 'Progress saved'
      : 'Not complete yet'
    : session?.completed
    ? 'Progress saved'
    : 'Not complete yet';

  const syncMessage = savePaused
    ? 'Your result is stored on this device. We’ll sync when you’re back online.'
    : savePending
    ? 'Saving this attempt…'
    : saveError
    ? 'Progress stays on this device. Retry save when you’re online.'
    : session
    ? session.completed
      ? `This attempt: ${session.score}%.${
          needsPractice > 0
            ? ` Review ${needsPractice} answer${
                needsPractice === 1 ? '' : 's'
              } now or practice weak items later.`
            : ' Great work! Practice weak items to reinforce.'
        }`
      : `This attempt: ${session.score}%. Progress is saved — retry to improve, or continue other situations.`
    : '';

  return (
    <LearningScreen
      testID="vocabulary-result"
      contentGap={16}
      header={<TopAppHeader showBack title="Practice result" onBackPress={goHome} />}
      footer={
        session ? (
          <BottomActionBar
            label={
              saveError ? 'Retry save' : needsPractice > 0 ? 'Practice weak items' : 'Back to home'
            }
            testID={
              saveError
                ? 'vocabulary-result-retry-save'
                : needsPractice > 0
                ? 'vocabulary-result-weak'
                : 'vocabulary-result-home'
            }
            onPress={saveError ? retrySave : needsPractice > 0 ? goWeak : goHome}
          />
        ) : null
      }
    >
      {isLoading ? <BrandLoading fill size="md" testID="vocabulary-result-loading" /> : null}
      {session ? (
        <>
          <CompletionHero
            situation={
              session.situationSlug === 'weak'
                ? 'WEAK ITEMS'
                : (situationQuery.data?.title ?? 'Vocabulary').toUpperCase()
            }
            title={session.completed ? 'Practice complete' : 'Keep practicing'}
            message={
              session.completed
                ? `You passed with ${session.score}%.${
                    needsPractice > 0
                      ? ` Review ${needsPractice} answer${
                          needsPractice === 1 ? '' : 's'
                        } to strengthen your vocabulary.`
                      : ' Excellent work on this set.'
                  }`
                : `You scored ${session.score}%. Reach 70% to mark this situation complete.`
            }
          />
          <Text style={[styles.section, { color: colors.text }]}>Your result</Text>
          <View style={styles.metrics}>
            <ResultMetric type="correct" value={String(session.correctCount)} />
            <ResultMetric type="needsPractice" value={String(needsPractice)} />
            <ResultMetric type="score" value={`${session.score}%`} />
          </View>
          <Feedback
            type={
              saveError
                ? 'info'
                : savePaused || savePending
                ? 'info'
                : session.completed
                ? 'success'
                : 'info'
            }
            title={syncTitle}
            message={syncMessage}
          />
          <Text
            accessibilityRole="button"
            onPress={retry}
            style={[styles.retry, { color: colors.primary }]}
            testID="vocabulary-result-retry"
          >
            Retry
          </Text>
        </>
      ) : isLoading ? null : (
        <Text style={[styles.missing, { color: colors.textMuted }]}>
          This practice session isn’t available anymore (app was restarted or the link expired).
          Return to Vocabulary to continue.
        </Text>
      )}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
  },
  missing: {
    fontSize: 14,
    lineHeight: 20,
  },
  retry: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
});
