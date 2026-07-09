# Messaging Application

A modern, production-minded React Native + Expo messaging platform built with TypeScript, a clean architecture foundation, and security-aware engineering practices.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![React Native](https://img.shields.io/badge/React%20Native-0.82-61DAFB) ![Expo](https://img.shields.io/badge/Expo-54-000020) ![Jest](https://img.shields.io/badge/Tests-Jest-99424F)

## Overview

This repository is a polished starter for a messaging application that blends a high-quality mobile experience with a maintainable architecture. The project is structured to support scalability, clear separation of concerns, and future growth into a full real-time communication platform.

## Why this project stands out

- Modern cross-platform client built with React Native and Expo
- Strong TypeScript typing and modular code organization
- Clean architecture-inspired structure for maintainability
- Secure storage and monitoring foundations
- Internationalization support and a strong UI foundation
- Ready for further expansion into real-time chat, sync, and production hardening

## Core capabilities

The current implementation includes:

- A React Native Expo client under the client directory
- Navigation and app shell setup for a polished mobile experience
- State management and query infrastructure for scalable UI flows
- Localization support with English and Arabic resources
- Secure storage, keychain, and monitoring helpers
- A Node-based server foundation with WebSocket capabilities
- Test, lint, formatting, and validation tooling out of the box

## Architecture at a glance

The codebase is organized around a layered structure that separates:

- Presentation: screens, components, hooks, and UI state
- Domain: business logic and core entities
- Data: repositories, persistence, and remote communication
- Core: shared infrastructure, security, monitoring, and utilities

This approach makes the application easier to evolve, test, and maintain as features grow.

## Tech stack

### Client

- React Native
- Expo
- TypeScript
- React Navigation
- TanStack Query
- Zustand
- React Hook Form
- i18next

### Server

- Node.js
- Express-style server foundation
- WebSocket-based real-time communication

### Quality & reliability

- Jest
- ESLint
- Prettier
- TypeScript compiler
- Sentry integration helpers

## Project structure

```text
client/        # Expo client application
server/        # Server and real-time communication layer
shared/        # Shared schema and cross-cutting types
assets/        # Static assets and images
docs/          # Architecture and implementation documentation
scripts/       # Automation and validation utilities
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- Expo CLI (or use npx expo)
- Android Studio or Xcode for device/emulator testing
- Git

### Installation

```bash
git clone <repository-url>
cd Messaging-Application
npm install
npm run prepare
```

### Run the application

Start the Expo client:

```bash
npm run dev
```

Start the server:

```bash
npm run server:dev
```

Run on a specific platform:

```bash
npm run android
npm run ios
npm run web
```

## Environment variables

Create a .env file in the repository root with values similar to:

```env
EXPO_PUBLIC_DOMAIN=localhost:5000
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
EXPO_PUBLIC_VERSION=1.0.0
EXPO_PUBLIC_BUILD_NUMBER=1
EXPO_PUBLIC_APP_NAME=MessagingApp
JWT_SECRET=replace-with-a-strong-secret
```

## Available scripts

```bash
npm run dev            # Start Expo development server
npm run web            # Launch Expo web
npm run android        # Launch Android app
npm run ios            # Launch iOS app
npm run server:dev     # Start the server in development mode
npm run lint           # Lint the codebase
npm run type-check     # Run TypeScript checks
npm test               # Run Jest tests
npm run validate       # Run validation checks
```

## Quality and security

The project already includes strong engineering foundations, including:

- Type-safe application code
- Structured validation and testing setup
- Secure storage and monitoring scaffolding
- Environment validation scripts

Before production release, the following areas are worth hardening further:

- Replace placeholder security material where applicable
- Verify token storage and authentication flows
- Review network and transport security settings
- Ensure production secrets are injected securely

## Roadmap

The repository is positioned as a scalable foundation for:

- Real-time messaging
- Presence and typing indicators
- Message persistence and sync
- Enhanced media handling
- Production-grade authentication and authorization

## Contributing

Contributions are welcome. If you improve the architecture, user experience, reliability, or security of the project, feel free to open a pull request.

## License

This project is intended for learning, development, and internal use unless otherwise specified by the repository owner.
''''}