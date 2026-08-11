import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

/** Nested Grammar learning stack (PH2). Result carries only clientAttemptId. */
export type GrammarStackParamList = {
  GrammarHome: undefined;
  GrammarTopic: { topicId: string };
  GrammarLesson: { topicId: string; lessonId: string };
  GrammarPractice: { topicId: string; lessonId: string };
  GrammarResult: { clientAttemptId: string };
};

export type AppStackParamList = {
  Home: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Grammar: NavigatorScreenParams<GrammarStackParamList> | undefined;
  VocabularyHome: undefined;
  VocabularySituation: { situationId: string };
  VocabularyPractice: { situationId: string };
  VocabularyResult: {
    situationId: string;
    correct: number;
    total: number;
  };
};

export type RootStackParamList = AuthStackParamList &
  AppStackParamList & {
    CompleteProfile: undefined;
  };
