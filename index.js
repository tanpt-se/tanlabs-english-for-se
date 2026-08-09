/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

if (__DEV__) {
  require('./ReactotronConfig');
}

try {
  // Background handler must be registered early (RN Firebase v26 modular API).
  const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
  setBackgroundMessageHandler(getMessaging(), async () => {
    // PH1: keep handler registered; no heavy work.
  });
} catch {
  // Native module unavailable in some test / premature environments.
}

AppRegistry.registerComponent(appName, () => App);
