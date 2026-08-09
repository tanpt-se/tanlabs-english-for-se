module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  collectCoverageFrom: ['App.tsx', 'src/**/*.{ts,tsx}', '!src/types/**'],
  coverageThreshold: {
    global: { branches: 24, functions: 30, lines: 35, statements: 34 },
    './src/core/auth/AuthProvider.tsx': {
      branches: 50,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/core/notification/deviceService.ts': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/core/notification/mutations.ts': {
      branches: 50,
      functions: 60,
      lines: 80,
      statements: 75,
    },
    './src/core/supabase/secureStorage.ts': {
      branches: 80,
      functions: 95,
      lines: 90,
      statements: 90,
    },
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
