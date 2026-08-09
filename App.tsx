/**
 * @format
 */

import { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { runPostRenderBootstrap } from '@/app/bootstrap/postRender';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { AppProviders } from '@/app/providers/AppProviders';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    runPostRenderBootstrap().catch(() => undefined);
  }, []);

  return (
    <AppProviders>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
