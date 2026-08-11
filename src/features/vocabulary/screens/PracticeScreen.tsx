import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppStackParamList } from '@/app/navigation/types';
import { BottomActionBar } from '@/components/ui/navigation';
import { TopAppHeader } from '@/components/ui/navigation';
import { AnswerOption } from '@/components/ui/selection';
import { InsightPanel, LearningScreen, PromptCard } from '@/features/vocabulary/components';
import { getPracticeQuestions, getSituation } from '@/features/vocabulary/data/mockCatalog';
import { useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function PracticeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'VocabularyPractice'>>();
  const colors = useAppColors();
  const situation = getSituation(route.params.situationId);
  const questions = useMemo(
    () => getPracticeQuestions(route.params.situationId),
    [route.params.situationId],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[index];
  const total = questions.length;
  const isLast = index >= total - 1;

  const optionState = (optionIndex: number) => {
    if (!checked || selected === null) {
      return selected === optionIndex ? 'selected' : 'default';
    }
    if (optionIndex === question.correctIndex) {
      return 'correct';
    }
    if (optionIndex === selected) {
      return 'incorrect';
    }
    return 'default';
  };

  return (
    <LearningScreen
      testID="vocabulary-practice"
      footer={
        <BottomActionBar
          disabled={selected === null}
          label={checked ? (isLast ? 'See result' : 'Next question') : 'Check answer'}
          testID="practice-action"
          onPress={() => {
            if (!checked) {
              if (selected === null) {
                return;
              }
              if (selected === question.correctIndex) {
                setCorrectCount((value) => value + 1);
              }
              setChecked(true);
              return;
            }

            if (isLast) {
              navigation.replace('VocabularyResult', {
                situationId: route.params.situationId,
                correct: correctCount,
                total,
              });
              return;
            }

            setIndex((value) => value + 1);
            setSelected(null);
            setChecked(false);
          }}
        />
      }
    >
      <TopAppHeader
        showBack
        title={situation?.title ?? 'Practice'}
        onBackPress={() => navigation.goBack()}
      />
      <Text style={[styles.progress, { color: colors.textMuted }]}>
        {index + 1} of {total}
      </Text>
      <PromptCard text={question.prompt} />
      <Text style={[styles.question, { color: colors.text }]}>{question.question}</Text>
      <View style={styles.options}>
        {question.options.map((option, optionIndex) => (
          <AnswerOption
            key={option}
            label={option}
            state={optionState(optionIndex)}
            disabled={checked}
            onPress={() => setSelected(optionIndex)}
          />
        ))}
      </View>
      {checked ? <InsightPanel title={question.insightTitle} body={question.insightBody} /> : null}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 14,
  },
  progress: {
    fontSize: 12,
    lineHeight: 17,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
});
