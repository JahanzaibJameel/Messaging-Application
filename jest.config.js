/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/__tests__/**/*.(ts|tsx)"],
  collectCoverageFrom: ["client/src/presentation/stores/chatStore.ts"],
};