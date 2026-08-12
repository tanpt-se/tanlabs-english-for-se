import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { grammarErrorMessage, useGrammarLesson, useGrammarTopic } from '@/features/grammar/hooks';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function GrammarLessonScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarStackParamList>>();
  const route = useRoute<RouteProp<GrammarStackParamList, 'GrammarLesson'>>();
  const colors = useAppColors();
  const { topicId, lessonId } = route.params;
  const topicQuery = useGrammarTopic(topicId);
  const lessonQuery = useGrammarLesson(lessonId);
  const lesson = lessonQuery.data;
  const startedTracked = useRef(false);
  const headerTitle =
    topicQuery.data && lesson
      ? `${topicQuery.data.title} · ${lesson.title}`
      : topicQuery.data?.title ?? 'Lesson';

  useEffect(() => {
    if (!lesson || !topicQuery.data || startedTracked.current) {
      return;
    }
    startedTracked.current = true;
    trackEvent('grammar_lesson_started', {
      topic_slug: topicQuery.data.slug,
      lesson_slug: lesson.slug,
    }).catch(() => undefined);
  }, [lesson, topicQuery.data]);

  return (
    <LearningScreen
      testID="grammar-lesson"
      header={<TopAppHeader showBack title={headerTitle} onBackPress={() => navigation.goBack()} />}
      footer={
        lesson ? (
          <BottomActionBar
            label="Start practice"
            testID="grammar-practice-cta"
            onPress={() => {
              trackEvent('grammar_practice_started', {
                topic_slug: topicQuery.data?.slug,
                lesson_slug: lesson.slug,
              }).catch(() => undefined);
              navigation.navigate('GrammarPracticeFlow', {
                screen: 'GrammarPractice',
                params: {
                  topicId,
                  lessonId: lesson.id,
                },
              });
            }}
          />
        ) : null
      }
    >
      {lessonQuery.isLoading ? (
        <BrandLoading fill size="md" testID="grammar-lesson-loading" />
      ) : null}

      {lessonQuery.isError ? (
        <Text style={[styles.body, { color: colors.danger }]}>
          {grammarErrorMessage(lessonQuery.error, 'Couldn’t load this lesson.')}
        </Text>
      ) : null}

      {lesson ? (
        <>
          <Text style={[styles.section, { color: colors.text }]}>When</Text>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {lesson.content.usage}
          </Text>

          <View style={[styles.formula, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.formulaText, { color: colors.text }]}>
              {lesson.content.forms.affirmative}
            </Text>
            {lesson.content.forms.negative ? (
              <Text style={[styles.formulaText, { color: colors.text }]}>
                {lesson.content.forms.negative}
              </Text>
            ) : null}
            {lesson.content.forms.question ? (
              <Text style={[styles.formulaText, { color: colors.text }]}>
                {lesson.content.forms.question}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.section, { color: colors.text }]}>Examples</Text>
          {lesson.content.examples.map((example) => (
            <View key={example.id} style={styles.exampleRow}>
              <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.exampleText, { color: colors.text }]}>{example.sentence}</Text>
            </View>
          ))}

          {lesson.content.tips[0] ? (
            <View
              style={[
                styles.note,
                { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
              ]}
            >
              <Text style={[styles.noteLabel, { color: colors.primary }]}>Don't</Text>
              <Text style={[styles.noteBody, { color: colors.textSecondary }]}>
                {lesson.content.tips[0]}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  bullet: {
    borderRadius: 4,
    height: 7,
    marginTop: 7,
    width: 7,
  },
  exampleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: themeTokens.spacing['10'],
    minHeight: 40,
  },
  exampleText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  formula: {
    borderRadius: themeTokens.radius.xl,
    gap: themeTokens.spacing['6'],
    paddingHorizontal: themeTokens.spacing['20'],
    paddingVertical: themeTokens.spacing.lg,
  },
  formulaText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  intro: {
    fontSize: 16,
    lineHeight: 22,
  },
  note: {
    borderRadius: themeTokens.radius.card,
    borderWidth: 1,
    gap: themeTokens.spacing['6'],
    padding: themeTokens.spacing.md,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 19,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
