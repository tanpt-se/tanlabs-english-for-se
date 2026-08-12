import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { useMutationState } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GrammarPracticeStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { CompletionHero, Feedback, LearningScreen, ResultMetric } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import {
  useCompleteGrammarAttempt,
  useGrammarLessons,
  useGrammarResultSession,
  useGrammarTopic,
} from '@/features/grammar/hooks';
import { grammarCompletionMutationKey } from '@/features/grammar/mutations';
import { exitGrammarPracticeFlow } from '@/features/grammar/navigation/exitPracticeFlow';
import { usePracticeSession } from '@/features/grammar/session';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function GrammarResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarPracticeStackParamList>>();
  const route = useRoute<RouteProp<GrammarPracticeStackParamList, 'GrammarResult'>>();
  const colors = useAppColors();
  const { user } = useAuth();
  const { clearActiveSession } = usePracticeSession();
  const saveMutation = useCompleteGrammarAttempt();
  const { session, isLoading } = useGrammarResultSession(route.params.clientAttemptId);
  const topicQuery = useGrammarTopic(session?.topicId);
  const lessonsQuery = useGrammarLessons(session?.topicId);
  const needsPractice = session ? Math.max(session.totalCount - session.correctCount, 0) : 0;
  const lessons = lessonsQuery.data ?? [];
  const lessonIndex = session ? lessons.findIndex((row) => row.id === session.lessonId) : -1;
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;
  const retryTracked = useRef(false);

  const saveStates = useMutationState({
    filters: { mutationKey: grammarCompletionMutationKey },
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

  const goTopic = () => {
    clearActiveSession();
    if (session?.topicId) {
      exitGrammarPracticeFlow(navigation, {
        name: 'GrammarTopic',
        params: { topicId: session.topicId },
      });
      return;
    }
    exitGrammarPracticeFlow(navigation, { name: 'GrammarHome' });
  };

  const goNext = () => {
    if (!session || !nextLesson) {
      goTopic();
      return;
    }
    clearActiveSession();
    exitGrammarPracticeFlow(navigation, {
      name: 'GrammarLesson',
      params: { topicId: session.topicId, lessonId: nextLesson.id },
    });
  };

  const retry = () => {
    if (!session) {
      goTopic();
      return;
    }
    if (!retryTracked.current) {
      retryTracked.current = true;
      trackEvent('grammar_practice_retry', {
        topic_slug: topicQuery.data?.slug,
      }).catch(() => undefined);
    }
    clearActiveSession();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'GrammarPractice',
            params: { topicId: session.topicId, lessonId: session.lessonId },
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
      topicId: session.topicId,
      lessonId: session.lessonId,
      contentRevision: session.contentRevision,
      correctCount: session.correctCount,
      totalCount: session.totalCount,
      score: session.score,
      answers: session.answers,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      topicSlug: topicQuery.data?.slug,
      lessonSlug: undefined,
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
              } now or return to this topic later.`
            : ' Return to this topic anytime to review.'
        }`
      : `This attempt: ${session.score}%. Progress is saved — retry to improve, or continue other lessons.`
    : '';

  return (
    <LearningScreen
      testID="grammar-result"
      header={<TopAppHeader showBack title="Lesson result" onBackPress={goTopic} />}
      footer={
        session ? (
          <BottomActionBar
            label={saveError ? 'Retry save' : nextLesson ? 'Next level' : 'Back to topic'}
            testID={
              saveError
                ? 'grammar-result-retry-save'
                : nextLesson
                ? 'grammar-result-next'
                : 'grammar-result-home'
            }
            onPress={saveError ? retrySave : nextLesson ? goNext : goTopic}
          />
        ) : null
      }
    >
      {isLoading ? <BrandLoading fill size="md" testID="grammar-result-loading" /> : null}
      {session ? (
        <>
          <CompletionHero
            situation={(topicQuery.data?.title ?? 'Grammar').toUpperCase()}
            title={session.completed ? 'Lesson complete' : 'Keep practicing'}
            message={
              session.completed
                ? `You passed with ${session.score}%.${
                    needsPractice > 0
                      ? ` Review ${needsPractice} answer${
                          needsPractice === 1 ? '' : 's'
                        } to strengthen this tense.`
                      : ' Great accuracy on this set.'
                  }`
                : `You scored ${session.score}%. Reach 70% to mark this lesson complete.`
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
            testID="grammar-result-retry"
          >
            Retry
          </Text>
        </>
      ) : isLoading ? null : (
        <Text style={[styles.missing, { color: colors.textMuted }]}>
          This practice session isn’t available anymore (app was restarted or the link expired).
          Return to Grammar to continue.
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
