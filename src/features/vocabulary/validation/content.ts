import {
  VOCABULARY_CONTENT_SCHEMA_VERSION,
  VOCABULARY_EXERCISE_TYPES,
  VOCABULARY_LEVELS,
  isVocabularyExerciseType,
  isVocabularyLevel,
  type VocabularyExercise,
} from '@/features/vocabulary/types/content';

export function assertVocabularyExercise(exercise: VocabularyExercise): void {
  if (!exercise.id || !exercise.situationId || !exercise.prompt) {
    throw new Error('Vocabulary exercise is missing required fields.');
  }
  if (!isVocabularyExerciseType(exercise.type)) {
    throw new Error(`Unsupported Vocabulary exercise type: ${exercise.type}`);
  }
  if (exercise.contentSchemaVersion !== VOCABULARY_CONTENT_SCHEMA_VERSION) {
    throw new Error('Unsupported Vocabulary content schema version.');
  }
  if (!(VOCABULARY_EXERCISE_TYPES as readonly string[]).includes(exercise.type)) {
    throw new Error('Invalid Vocabulary exercise type.');
  }
}

export function assertVocabularyLevel(level: string): void {
  if (!isVocabularyLevel(level)) {
    throw new Error(`Unsupported Vocabulary level: ${level}`);
  }
  if (!(VOCABULARY_LEVELS as readonly string[]).includes(level)) {
    throw new Error('Invalid Vocabulary level.');
  }
}
