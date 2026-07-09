# ChatApp

A React Native + Expo messaging application with a client/server structure, strict TypeScript, and a security-focused codebase.

## Project Overview

This repository includes a working Expo client app and a minimal Express/WebSocket server. The app is organized with a clean architecture intent, but several production-level integrations are still scaffolding or require hardening.

## What is implemented

- Expo-managed client app under `client/`
- App entry point in `client/src/App.tsx`
- Navigation using `@react-navigation/native` and native stack navigator
- React Query configuration in `client/lib/query-client.ts`
- Localized UI support using `react-i18next` with English and Arabic resources
- Encrypted storage helpers in `client/src/security/secureStorage.ts`
- Keychain helpers in `client/src/security/keychain.ts`
- SSL pinning configuration scaffolding in `client/src/security/sslPinningConfig.ts`
- Sentry integration helpers in `client/src/monitoring/sentry.ts`
- WebSocket server implementation with JWT auth in `server/websocket.ts`
- TypeScript strict mode, ESLint, Prettier, Jest, and lint-staged configured

## Important observations

- `server/routes.ts` is effectively empty. There are no defined REST routes in this codebase.
- `client/src/security/sslPinningConfig.ts` currently contains placeholder certificate hashes and must be replaced before production.
- `client/src/security/keychain.ts` uses identical Keychain calls for access and refresh tokens, which is likely incorrect.
- `client/src/security/secureStorage.ts` uses `Math.random()` as a fallback for key generation; that is not cryptographically secure for production.
- `server/index.ts` falls back to a hard-coded `JWT_SECRET` when none is provided.
- `app.json` includes local network ATS exceptions for iOS and development-only hostname exceptions; review these before publishing.
- `package.json` includes a `clean` script using `rm -rf`, which is not Windows-native.
- The current README claims features such as 15+ languages, voice messages, full message search, and production feature flags/A-B testing that are not clearly implemented in the current source.
- The client environment variable usage is inconsistent with the old README claims. `client/lib/query-client.ts` expects `EXPO_PUBLIC_DOMAIN`, not `EXPO_PUBLIC_API_URL`.

## Quick start

### Prerequisites

- Node.js >= 18
- npm >= 9
- Expo CLI installed or use `npx expo`
- Android Studio / Xcode for device/emulator testing
- Git

### Install dependencies

```bash
git clone <repository-url>
cd Messaging-Application
npm install
npm run prepare
```

### Run the client

```bash
npm run dev
```

### Run the server

```bash
npm run server:dev
```

### Run on targeted platforms

```bash
npm run android
npm run ios
npm run web
```

## Environment variables

Create a `.env` file in the repository root with values such as:

```env
EXPO_PUBLIC_DOMAIN=localhost:5000
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
EXPO_PUBLIC_VERSION=1.0.0
EXPO_PUBLIC_BUILD_NUMBER=1
EXPO_PUBLIC_APP_NAME=ChatApp
JWT_SECRET=replace-with-strong-secret
REPLIT_DEV_DOMAIN=optional-dev-domain
REPLIT_DOMAINS=optional-domain-list
```

## Scripts

- `npm run dev` — start Expo development server
- `npm run web` — launch Expo web
- `npm run android` — open Android emulator/device
- `npm run ios` — open iOS simulator/device
- `npm run server:dev` — start server in development
- `npm run lint` — run ESLint
- `npm run lint:fix` — fix lint issues
- `npm run format` — run Prettier
- `npm run type-check` — run TypeScript checks
- `npm test` — run Jest tests
- `npm run test:coverage` — run tests with coverage
- `npm run validate` — run type-check, lint, and format:check

## Repo layout

- `client/` — Expo client app source
- `server/` — Express server and WebSocket manager
- `shared/` — shared schema/types
- `assets/` — images, fonts, static assets
- `docs/` — architecture and documentation files
- `scripts/` — validation and utility scripts

## Recommended next steps

1. Fix token storage logic in `client/src/security/keychain.ts`.
2. Replace placeholder SSL pin hashes in `client/src/security/sslPinningConfig.ts`.
3. Add actual routes to `server/routes.ts` if you need REST endpoints.
4. Ensure `JWT_SECRET` is provided through secure environment configuration.
5. Replace the insecure random fallback in `client/src/security/secureStorage.ts` with a secure random source.
6. Validate mobile network security settings in `app.json` before releasing.

## Notes

This README now reflects the current implementation and highlights hardening tasks required before production use.
''''}