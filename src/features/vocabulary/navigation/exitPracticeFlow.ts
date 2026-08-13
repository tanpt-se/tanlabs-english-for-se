import { CommonActions } from '@react-navigation/native';

import type { VocabularyStackParamList } from '@/app/navigation/types';

type ParentNavigation = {
  getState: () => { routes: Array<{ name: string; params?: object }> };
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
};

type NestedNavigation = {
  getParent: () => ParentNavigation | undefined;
};

type ExitTarget =
  | { name: 'VocabularyHome' }
  | { name: 'VocabularySituation'; params: VocabularyStackParamList['VocabularySituation'] }
  | { name: 'VocabularyWeak' };

export function exitVocabularyPracticeFlow(navigation: NestedNavigation, target: ExitTarget): void {
  const parent = navigation.getParent();
  if (!parent) {
    return;
  }

  const kept = parent
    .getState()
    .routes.filter((route) => route.name !== 'VocabularyPracticeFlow')
    .map((route) => ({ name: route.name, params: route.params }));

  let routes: Array<{ name: string; params?: object }>;
  if (target.name === 'VocabularyHome') {
    routes = [{ name: 'VocabularyHome' }];
  } else if (target.name === 'VocabularyWeak') {
    const home = kept.find((route) => route.name === 'VocabularyHome') ?? {
      name: 'VocabularyHome',
    };
    routes = [home, { name: 'VocabularyWeak' }];
  } else {
    const home = kept.find((route) => route.name === 'VocabularyHome') ?? {
      name: 'VocabularyHome',
    };
    routes = [home, { name: 'VocabularySituation', params: target.params }];
  }

  parent.dispatch(
    CommonActions.reset({
      index: routes.length - 1,
      routes,
    }),
  );
}
