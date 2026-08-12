import { CommonActions } from '@react-navigation/native';

import type { GrammarStackParamList } from '@/app/navigation/types';

type ParentNavigation = {
  getState: () => { routes: Array<{ name: string; params?: object }> };
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
};

type NestedNavigation = {
  getParent: () => ParentNavigation | undefined;
};

type ExitTarget =
  | { name: 'GrammarHome' }
  | { name: 'GrammarTopic'; params: GrammarStackParamList['GrammarTopic'] }
  | { name: 'GrammarLesson'; params: GrammarStackParamList['GrammarLesson'] };

export function exitGrammarPracticeFlow(navigation: NestedNavigation, target: ExitTarget): void {
  const parent = navigation.getParent();
  if (!parent) {
    return;
  }

  const kept = parent
    .getState()
    .routes.filter((route) => route.name !== 'GrammarPracticeFlow')
    .map((route) => ({ name: route.name, params: route.params }));

  let routes: Array<{ name: string; params?: object }>;
  if (target.name === 'GrammarHome') {
    routes = [{ name: 'GrammarHome' }];
  } else if (target.name === 'GrammarTopic') {
    const home = kept.find((route) => route.name === 'GrammarHome') ?? { name: 'GrammarHome' };
    routes = [home, { name: 'GrammarTopic', params: target.params }];
  } else {
    const home = kept.find((route) => route.name === 'GrammarHome') ?? { name: 'GrammarHome' };
    const topic =
      kept.find((route) => route.name === 'GrammarTopic') ??
      ({
        name: 'GrammarTopic',
        params: { topicId: target.params.topicId },
      } as const);
    routes = [home, topic, { name: 'GrammarLesson', params: target.params }];
  }

  parent.dispatch(
    CommonActions.reset({
      index: routes.length - 1,
      routes,
    }),
  );
}
