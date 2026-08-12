/** Local + CI global gate. Soft historical floors kept only when COVERAGE_ENFORCE is unset (ad-hoc). */
const enforceGlobal90 = process.env.COVERAGE_ENFORCE !== '0';

module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  collectCoverageFrom: ['App.tsx', 'src/**/*.{ts,tsx}', '!src/types/**'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
  coverageThreshold: {
    global: enforceGlobal90
      ? { branches: 90, functions: 90, lines: 90, statements: 90 }
      : { branches: 24, functions: 30, lines: 35, statements: 34 },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-config$': '<rootDir>/__mocks__/react-native-config.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-async-storage|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-url-polyfill|@supabase|@tanstack)/)',
  ],
};
