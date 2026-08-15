import { StyleSheet, View } from 'react-native';

import { AnswerOption } from '@/components/ui/selection';
import type { ChooseExpressionExercise } from '@/features/vocabulary/types/content';
import { themeTokens } from '@/theme';

type ChooseExpressionExerciseViewProps = {
  exercise: ChooseExpressionExercise;
  selectedOptionId: string | null;
  checked: boolean;
  onSelect: (optionId: string) => void;
};

export function ChooseExpressionExerciseView({
  exercise,
  selectedOptionId,
  checked,
  onSelect,
}: ChooseExpressionExerciseViewProps) {
  return (
    <View style={styles.options} testID="vocabulary-exercise-choose">
      {exercise.payload.options.map((option) => {
        const state = (() => {
          if (!checked) {
            return selectedOptionId === option.id ? 'selected' : 'default';
          }
          if (option.id === exercise.answer.optionId) {
            return 'correct';
          }
          if (option.id === selectedOptionId) {
            return 'incorrect';
          }
          return 'default';
        })();
        return (
          <AnswerOption
            key={option.id}
            label={option.text}
            state={state}
            disabled={checked}
            onPress={() => onSelect(option.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: themeTokens.spacing['12'],
  },
});
