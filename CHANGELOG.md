# Keep a Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation overhaul with modern 2026 standards
- Architecture Decision Records (ADRs) for key technical decisions
- API reference documentation with OpenAPI specification
- Accessibility documentation with WCAG 2.1 AA compliance details

### Changed
- Updated all documentation to modern markdown standards with Mermaid diagrams
- Improved test determinism in `chatStore.test.ts`
- Fixed TypeScript configuration (`moduleResolution: bundler`, `module: esnext`)

### Fixed
- Resolved TypeScript build error: `TS5095` and `TS5098` related to `customConditions` and `bundler` module resolution
- Fixed ESLint prettier error in `biometricAuth.ts`

---

## [3.0.0] - 2026-09-27

### Added
- **Real-time Chat**: WebSocket-powered messaging with typing indicators
- **Offline-First Sync**: Intelligent background sync with conflict resolution
- **Voice Messages**: Native recording with waveform visualization
- **Read Receipts**: Chat-level and individual message delivery tracking
- **Typing Indicators**: Real-time presence and typing notifications
- **Media Handling**: Images, videos, and document attachment support
- **Cross-Platform**: iOS, Android, and Web with unified codebase
- **Security**: SSL pinning, encrypted storage, biometric auth
- **Internationalization**: i18next with English & Arabic support
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support

### Changed
- Migrated to Zustand v5 with Immer middleware
- Updated React Navigation to v7
- Migrated to Expo 54 with React Native 0.81.5
- Adopted Clean Architecture with Domain-Driven Design

### Fixed
- Chat store rehydration with proper date type restoration
- Message index maintenance for O(1) lookups
- State normalization for optimal performance

---

## [2.0.0] - 2026-08-15

### Added
- Initial Clean Architecture implementation
- Zustand state management with MMKV persistence
- WebSocket real-time communication
- Basic authentication flow (phone + OTP)
- Message sending and receiving
- Chat list with search

### Changed
- Complete UI redesign with WhatsApp-style interface
- Migrated from Redux to Zustand
- Implemented offline-first architecture

---

## [1.0.0] - 2026-07-01

### Added
- Initial project setup
- Basic chat functionality
- User authentication
- Message history

---

**Format Legend**:
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities
- `Performance` for performance improvements
