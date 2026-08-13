import { FieldTextInput } from '@/components/ui/input';
import type { FillBlankExercise } from '@/features/vocabulary/types/content';

type FillBlankExerciseViewProps = {
  exercise: FillBlankExercise;
  value: string;
  checked: boolean;
  onChange: (text: string) => void;
};

export function FillBlankExerciseView({
  exercise,
  value,
  checked,
  onChange,
}: FillBlankExerciseViewProps) {
  return (
    <FieldTextInput
      autoCapitalize="none"
      autoCorrect={false}
      editable={!checked}
      label="Your answer"
      placeholder={exercise.payload.cue ?? 'Type the missing expression'}
      testID="vocabulary-exercise-fill"
      value={value}
      onChangeText={onChange}
    />
  );
}
