export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Settings: undefined;
  EditProfile: undefined;
};

export type RootStackParamList = AuthStackParamList &
  AppStackParamList & {
    CompleteProfile: undefined;
  };
