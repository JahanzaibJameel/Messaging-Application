# Keep a Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- FlashList migration: `OptimizedMessageList.tsx` switched from `FlatList` to `@shopify/flash-list`; `inverted` prop removed; 12 ChatScreen tests failing due to FlashList mock (in progress)
- LoginScreen test coverage: 78.26% stmts / 50% branches / 40% funcs / 81.81% lines (target ≥90%)
- Docs: ARCHITECTURE.md, README.md, DEPLOYMENT.md, SECURITY.md, ROADMAP.md updated with honest current state
- Version bumped to 3.0.1

### Fixed

- README.md stats: 1610 tests / 63 suites / 61.2% coverage / ~10MB bundle / 54 high audit / 22 eslint warnings
- ARCHITECTURE.md: status changed from "Production Ready" to "Active Development — not production ready"
- DEPLOYMENT.md: quality gates reflect actual values (22 eslint warnings, 61.2% coverage, 54 high audit)

### Known Issues

- ChatScreen: 12 tests failing (FlashList mock — `bubble-msg-1` not found)
- LoginScreen: error haptic test blocked by expo-haptics module instance mismatch (duplicate jest.mock)
- LoginScreen: focus/blur handlers unavailable via `fireEvent.focus` in react-native-testing-library
- Security audit: 54 high vulnerabilities (toolchain advisories accepted as RA-004/RA-005)

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
