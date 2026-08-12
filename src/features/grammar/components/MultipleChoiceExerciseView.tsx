import { StyleSheet, View } from 'react-native';

import { AnswerOption } from '@/components/ui/selection';
import type { MultipleChoiceExercise } from '@/features/grammar/types/content';
import { themeTokens } from '@/theme';

type MultipleChoiceExerciseViewProps = {
  exercise: MultipleChoiceExercise;
  selectedOptionId: string | null;
  checked: boolean;
  onSelect: (optionId: string) => void;
};

export function MultipleChoiceExerciseView({
  exercise,
  selectedOptionId,
  checked,
  onSelect,
}: MultipleChoiceExerciseViewProps) {
  return (
    <View style={styles.options} testID="grammar-exercise-mc">
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
            label={option.label}
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
    gap: themeTokens.spacing['14'],
  },
});
