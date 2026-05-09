/**
 * Jest configuration for React Native testing
 */

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'client/**/*.{ts,tsx}',
    '!client/**/*.d.ts',
    '!client/**/*.stories.{ts,tsx}',
    '!client/**/__tests__/**',
    '!client/**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/$1',
    '^~/(.*)$': '<rootDir>/client/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|react-clone|@react-native|expo|@expo|@react-navigation|zustand|immer)',
  ],
  testEnvironment: 'node',
  resetMocks: false,
  restoreMocks: false,
  clearMocks: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
};
