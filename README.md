# Messaging Application

![CI Status](https://github.com/YOUR_ORG/Messaging-Application/workflows/Build/badge.svg)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020)](https://expo.dev/)
[![Jest](https://img.shields.io/badge/Tests-Jest-99424F)](https://jestjs.io/)
[![Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen)](coverage)
[![Security](https://img.shields.io/badge/Security-Approved-green)](SECURITY.md)

## Overview

Enterprise-grade WhatsApp-style messaging app built with **Clean Architecture**, **offline-first sync**, and **premium UI**. This repo showcases a production-ready mobile platform that supports real-time communication, advanced state management, and enterprise security features.

Key highlights:

- Real-time chat with WebSocket backend
- Full offline-first capabilities with intelligent sync
- Multi-platform support (iOS, Android, Web)
- Advanced UI with animations and smooth interactions
- Internationalization (English & Arabic)
- Comprehensive security (SSL pinning, encrypted storage)
- TypeScript-first development with extensive testing

## 🎯 Why This Project

- **Clean Architecture**: Fully decoupled layers (Presentation, Domain, Data, Core) for maintainability and testability
- **Enterprise Security**: SSL pinning, Keychain storage, input validation, and secure token management
- **Offline-First**: Robust sync engine with conflict resolution and background synchronization
- **Performance Optimized**: FlashList for list rendering, lazy loading, and advanced bundle optimization
- **Developer Experience**: Extensive tooling, linting, formatting, and validation pipelines
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support and keyboard navigation
- **Future-Ready**: Modular architecture ready for AI integration, advanced moderation, and analytics

## 🚀 Key Features

| Feature               | Description                                          | Status         |
| --------------------- | ---------------------------------------------------- | -------------- |
| **Real‑time Chat**    | WebSocket-powered messaging with typing indicators   | ✅ Complete    |
| **Offline Sync**      | Intelligent background sync with conflict resolution | ✅ Complete    |
| **Voice Messages**    | Native recording, waveform visualization, playback   | ✅ Complete    |
| **Read Receipts**     | Chat‑level and individual message delivery tracking  | ✅ Complete    |
| **Typing Indicators** | Real‑time presence and typing notifications          | ✅ Complete    |
| **Media Handling**    | Images, videos, and document attachment support      | ✅ Complete    |
| **Cross‑Platform**    | iOS, Android, and Web with unified codebase          | ✅ Complete    |
| **Security**          | SSL pinning, encrypted storage, biometric auth       | 🔄 In Progress |
| **Analytics**         | User behavior tracking and performance monitoring    | 🔄 Planned     |

## 🏗️ Architecture Overview

The codebase follows a **layered Clean Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Screens   │ │ Components  │ │    Hooks    │ │ Stores  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │  Entities   │ │Repositories │ │  Use Cases  │ │  Events  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Models    │ │Repositories │ │ DataSources │ │ Mappers │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                     Core Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │    Sync     │ │   Errors    │ │     DI      │ │Network  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Presentation**: UI components, navigation, state management (Zustand), and user interactions
- **Domain**: Business rules, entities, use‑cases, and validation logic
- **Data**: API clients, local storage (MMKV), WebSocket connections, and data mapping
- **Core**: Synchronization engine, security utilities, dependency injection, and network monitoring

## 🛠️ Technology Stack

### Client (React Native Expo)

- **Framework**: React Native 0.81.5, Expo 54
- **State Management**: Zustand v5, TanStack Query v5, React Hook Form v8
- **UI**: React Navigation v7, FlashList, Reanimated 4, Gesture Handler
- **Internationalization**: i18next with English & Arabic support
- **Security**: react-native-keychain, native-spawn, ssl-pinning
- **Monitoring**: @sentry/react-native, React Native Device Info
- **Testing**: Jest, React Testing Library, Detox (E2E)

### Server (Node.js)

- **Runtime**: Node.js with TypeScript
- **Framework**: Express‑style architecture
- **Real‑time**: WebSocket (ws) for bidirectional communication
- **Database**: Drizzle ORM with PostgreSQL
- **Security**: Helmet, CORS, rate limiting, JWT authentication
- **Build**: esbuild for fast bundling

### Quality & Reliability

- **Linting**: ESLint + Prettier + TypeScript strict mode
- **Testing**: Jest (80%+ unit, 85%+ integration coverage)
- **Validation**: Zod schemas, environment validation scripts
- **CI/CD**: GitHub Actions with automated quality gates
- **Bundle Analysis**: react-native-bundle-visualizer

## 📂 Project Structure

```
client/          # Expo mobile application
  src/
    presentation/ # UI components & screens
    domain/       # Business logic & entities
    data/         # Repositories & data sources
    core/         # Sync engine, security, utilities
    shared/       # Cross‑cutting types & constants

server/          # Node.js real‑time backend
  src/
    api/          # Express routes & middleware
    services/     # Business services & WebSocket handlers
    repositories/ # Data access layer
    models/       # Database schemas (Drizzle)

shared/          # Cross‑platform types & schemas
assets/          # Static assets (icons, images)
docs/            # Architecture and implementation guides
scripts/         # Automation & validation utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Expo CLI (`npx expo`)
- iOS: Xcode 14+ (Mac)
- Android: Android Studio

### Quick Installation

```bash
# Clone the repository
git clone <repository-url>
cd Messaging-Application

# Install dependencies
npm install

# Run the development stack
npm run dev          # Starts Expo client
npm run server:dev   # Starts WebSocket server
```

### Platform Builds

```bash
npm run android   # Build & run on Android
npm run ios        # Build & run on iOS (Mac only)
npm run web        # Build for web
```

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.chatapp.com
EXPO_PUBLIC_BACKEND_DOMAIN=api.chatapp.com
EXPO_PUBLIC_BACKEND_WS_DOMAIN=ws.chatapp.com

# Auth
EXPO_PUBLIC_USE_MOCK_AUTH=true
JWT_SECRET=your-super-secret-key-here

# App Metadata
EXPO_PUBLIC_APP_NAME=MessagingApp
EXPO_PUBLIC_VERSION=3.0.0
EXPO_PUBLIC_BUILD_NUMBER=1

# Monitoring
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn-here

# Feature Flags
EXPO_PUBLIC_ENABLE_VOICE_MESSAGES=true
EXPO_PUBLIC_ENABLE_REACTIONS=true
EXPO_PUBLIC_ENABLE_ADVANCED_SEARCH=false
```

**Mock Auth** (`EXPO_PUBLIC_USE_MOCK_AUTH=true`) enables frontend‑only development with simulated login and OTP flows.

## 📜 Available Scripts

| Command                  | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `npm run dev`            | Start Expo development server                       |
| `npm run web`            | Launch Expo web build                               |
| `npm run android`        | Build & run Android app                             |
| `npm run ios`            | Build & run iOS app                                 |
| `npm run server:dev`     | Start WebSocket server in dev mode                  |
| `npm run lint`           | Run ESLint code quality checks                      |
| `npm run lint:fix`       | Auto‑fix ESLint issues                              |
| `npm run format`         | Format code with Prettier                           |
| `npm run type-check`     | TypeScript strict type checking                     |
| `npm run validate`       | Run all quality checks (lint + type-check + format) |
| `npm test`               | Run unit & integration tests                        |
| `npm run test:coverage`  | Run tests with coverage report                      |
| `npm run bundle:analyze` | Analyze bundle size                                 |
| `npm run security:check` | Run security audit & validation                     |
| `npm run prepare`        | Install Husky git hooks                             |

## 🛡️ Security Overview

The project implements **defense‑in‑depth** security:

- **Network**: SSL pinning, certificate validation, HTTPS‑only communication
- **Authentication**: JWT with refresh tokens, secure storage (Keychain), optional biometric support
- **Data Protection**: End‑to‑end encryption for messages, MMKV‑encrypted persistence
- **Input Validation**: Zod schemas for all API payloads and form data
- **Monitoring**: Sentry integration for error tracking and anomaly detection
- **CI Security**: Automated vulnerability scans, dependency updates, and secret detection

## 📊 Development Process

1. **Branching**: `feature/*`, `fix/*`, `docs/*`, `style/*`, `perf/*`, `test/*`, `chore/*`, `hotfix/*`
2. **Commits**: Conventional Commits format (`feat: add voice messages`)
3. **Reviews**: PR checklist includes code quality, test coverage (≥85%), accessibility, and security review
4. **Testing**: Unit tests (80%+), integration tests (85%+), E2E tests (planned)
5. **Deployment**: Multi‑stage CI/CD with automated quality gates and canary releases

## 📚 Documentation

- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Roadmap**: [ROADMAP.md](ROADMAP.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: [SECURITY.md](SECURITY.md)

## 🤝 Contributing

We welcome contributions! Whether it's fixing a bug, adding a feature, improving documentation, or enhancing security, your help makes this project better.

**Before contributing**:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
4. Ensure all tests pass and coverage meets requirements
5. Update documentation if needed
6. Submit a pull request with a clear description

**Code Style Guidelines**:

- Use TypeScript with strict mode
- Follow Prettier formatting
- Adhere to ESLint rules
- Write meaningful, testable unit tests
- Document public APIs
- Prioritize performance and accessibility

## 📈 Success Metrics

- **Test Coverage**: 85%+ overall, 90%+ for critical paths
- **Bundle Size**: < 2MB for mobile apps
- **Build Time**: < 2 minutes
- **WebSocket Latency**: < 100ms
- **Security**: 0 high‑severity vulnerabilities
- **Accessibility**: WCAG 2.1 AA compliant

## ⚠️ Known Limitations & Future Work

- **Security Enhancements**: End‑to‑end encryption, advanced biometric auth
- **Advanced Features**: Real‑time content moderation, AI‑powered chat suggestions
- **Platform**: iOS App Store & Google Play Store releases pending
- **Analytics**: User behavior tracking and insights platform
- **Performance**: Further bundle optimization and native code improvements

## 📞 Contact & Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Technical discussions in GitHub Discussions
- **Security**: Responsible disclosure to security@chatapp.com

## 📄 License

MIT © 2026 ChatApp Contributors

---

_Built with ❤️ for modern mobile development | Powered by Clean Architecture_
