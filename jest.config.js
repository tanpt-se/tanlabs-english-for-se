module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-config$': '<rootDir>/__mocks__/react-native-config.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-async-storage|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-url-polyfill|react-native-svg|@gluestack-ui|@gluestack-style|@supabase|@tanstack)/)',
  ],
};
