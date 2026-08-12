import { FieldTextInput } from '@/components/ui/input';
import type { FillBlankExercise } from '@/features/grammar/types/content';
import { fillBlankPlaceholder, parseFillBlankCue } from '@/features/grammar/utils/fillBlankCue';

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
  const cue = parseFillBlankCue(exercise.payload.template);
  return (
    <FieldTextInput
      autoCapitalize="none"
      autoCorrect={false}
      editable={!checked}
      label="Your answer"
      placeholder={fillBlankPlaceholder(cue)}
      testID="grammar-exercise-fill"
      value={value}
      onChangeText={onChange}
    />
  );
}
