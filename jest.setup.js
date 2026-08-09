/* eslint-env jest */

import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);

jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: {
    hide: jest.fn(() => Promise.resolve()),
    isVisible: jest.fn(() => true),
  },
}));

jest.mock('react-native-screens', () => {
  const Real = jest.requireActual('react-native-screens');
  return {
    ...Real,
    enableScreens: jest.fn(),
  };
});

jest.mock('@d11/react-native-fast-image', () => {
  const React = require('react');
  const { Image } = require('react-native');

  const FastImage = React.forwardRef((props, ref) => React.createElement(Image, { ...props, ref }));

  FastImage.displayName = 'FastImage';
  FastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  };
  FastImage.priority = {
    low: 'low',
    normal: 'normal',
    high: 'high',
  };
  FastImage.cacheControl = {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  };
  FastImage.preload = jest.fn();
  FastImage.clearMemoryCache = jest.fn(() => Promise.resolve());
  FastImage.clearDiskCache = jest.fn(() => Promise.resolve());

  return { __esModule: true, default: FastImage };
});

jest.mock('@gluestack-ui/themed', () => {
  const React = require('react');
  const { Text, View, TextInput, Pressable, Switch, ActivityIndicator } = require('react-native');

  const passthrough =
    (Comp = View) =>
    ({ children, ...props }) =>
      React.createElement(Comp, props, children);

  return {
    GluestackUIProvider: passthrough(View),
    Box: passthrough(View),
    VStack: passthrough(View),
    HStack: passthrough(View),
    Heading: passthrough(Text),
    Text: passthrough(Text),
    Button: passthrough(Pressable),
    ButtonText: passthrough(Text),
    Input: passthrough(View),
    InputField: passthrough(TextInput),
    FormControl: passthrough(View),
    FormControlError: passthrough(View),
    FormControlErrorText: passthrough(Text),
    Pressable: passthrough(Pressable),
    Switch,
    Spinner: ActivityIndicator,
  };
});

jest.mock('@gluestack-ui/config', () => ({
  config: {},
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  getApp: jest.fn(() => ({})),
  default: () => ({}),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: 0,
    NOT_DETERMINED: -1,
  };
  const messagingInstance = {};
  return {
    __esModule: true,
    AuthorizationStatus,
    getMessaging: jest.fn(() => messagingInstance),
    hasPermission: jest.fn(async () => AuthorizationStatus.AUTHORIZED),
    requestPermission: jest.fn(async () => AuthorizationStatus.AUTHORIZED),
    registerDeviceForRemoteMessages: jest.fn(async () => undefined),
    getToken: jest.fn(async () => 'test-token'),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(async () => null),
    setBackgroundMessageHandler: jest.fn(),
    // Legacy default export kept for accidental namespaced imports in tests.
    default: () => ({
      requestPermission: jest.fn(async () => 1),
      registerDeviceForRemoteMessages: jest.fn(async () => undefined),
      getToken: jest.fn(async () => 'test-token'),
      onTokenRefresh: jest.fn(() => jest.fn()),
      onMessage: jest.fn(() => jest.fn()),
      onNotificationOpenedApp: jest.fn(() => jest.fn()),
      getInitialNotification: jest.fn(async () => null),
      setBackgroundMessageHandler: jest.fn(),
    }),
  };
});

jest.mock('@react-native-firebase/crashlytics', () => {
  const crashlyticsInstance = {};
  return {
    __esModule: true,
    getCrashlytics: jest.fn(() => crashlyticsInstance),
    setCrashlyticsCollectionEnabled: jest.fn(async () => undefined),
    setAttribute: jest.fn(async () => undefined),
    recordError: jest.fn(),
    crash: jest.fn(),
    default: () => ({
      setCrashlyticsCollectionEnabled: jest.fn(async () => undefined),
      setAttribute: jest.fn(async () => undefined),
      recordError: jest.fn(),
      crash: jest.fn(),
    }),
  };
});

jest.mock('@react-native-firebase/analytics', () => {
  const analyticsInstance = {};
  return {
    __esModule: true,
    getAnalytics: jest.fn(() => analyticsInstance),
    logEvent: jest.fn(async () => undefined),
    default: () => ({
      logEvent: jest.fn(async () => undefined),
    }),
  };
});
