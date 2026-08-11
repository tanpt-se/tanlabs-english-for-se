export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Settings: undefined;
  EditProfile: undefined;
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
