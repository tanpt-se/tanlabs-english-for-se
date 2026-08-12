import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type GrammarPracticeStackParamList = {
  GrammarPractice: { topicId: string; lessonId: string };
  GrammarReview: undefined;
  GrammarResult: { clientAttemptId: string };
};

export type GrammarStackParamList = {
  GrammarHome: undefined;
  GrammarTopic: { topicId: string };
  GrammarLesson: { topicId: string; lessonId: string };
  GrammarPracticeFlow: NavigatorScreenParams<GrammarPracticeStackParamList>;
};

export type VocabularyStackParamList = {
  VocabularyHome: undefined;
  VocabularySituation: { situationId: string };
  VocabularyPractice: { situationId: string };
  VocabularyResult: {
    situationId: string;
    correct: number;
    total: number;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Grammar: NavigatorScreenParams<GrammarStackParamList> | undefined;
  Vocabulary: NavigatorScreenParams<VocabularyStackParamList> | undefined;
  Interview: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  EditProfile: undefined;
};

export type RootStackParamList = AuthStackParamList &
  AppStackParamList & {
    CompleteProfile: undefined;
  };
