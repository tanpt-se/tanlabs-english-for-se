export {
  completeVocabularyAttempt,
  deriveWeakClientAttemptId,
  getExercisesForItemIds,
  getSituation,
  getSituationExercises,
  getSituationItems,
  getSituations,
  getVocabularyTerm,
  getWeakProgress,
  searchVocabularyLibrary,
  VOCABULARY_LIBRARY_PAGE_SIZE,
  type CompleteVocabularyAttemptInput,
  type VocabularyLibraryPage,
  type VocabularyLibraryQuery,
  type VocabularySituationItems,
  type VocabularySituationSummary,
} from '@/features/vocabulary/services/contentService';
export {
  VocabularyDomainError,
  toVocabularyDomainError,
  type VocabularyDomainErrorCode,
} from '@/features/vocabulary/services/errors';
