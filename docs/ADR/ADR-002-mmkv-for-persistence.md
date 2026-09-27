# ADR-002: MMKV for Local Persistence

**Status**: Accepted  
**Date**: 2026-09-27  
**Deciders**: Engineering Team

## Context

We needed a local storage solution for ChatApp that:
- Handles complex normalized state (chats, messages, secondary indexes)
- Provides synchronous API for Zustand persist middleware
- Offers encrypted storage for sensitive data
- Performs well on low-end Android devices
- Supports data compression for large chat histories

We evaluated AsyncStorage, SQLite, Realm, MMKV, and WatermelonDB.

## Decision

We chose **MMKV** (via `react-native-mmkv`) for local persistence with the following architecture:
- **Raw MMKV**: For simple key-value storage (feature flags, UI state)
- **Encrypted MMKV Wrapper**: For sensitive data (tokens, messages)
- **Zustand Persist Middleware**: Automatic serialization/deserialization
- **JSON Storage Adapter**: Bridge between MMKV and Zustand

### Storage Schema

```
chat-storage_chats           → Normalized chat state
message-storage_messages     → Normalized message entities
message-storage_messagesByChatId → Secondary index
auth-storage_currentUser     → Current user profile
auth-storage_isAuthenticated → Auth status
sync-storage                 → Sync queue and metadata
ui-storage                   → UI preferences
feature-flags                → Feature flag overrides
```

## Consequences

### Positive
- **Performance**: 10-30x faster than AsyncStorage
- **Synchronous API**: Works seamlessly with Zustand persist
- **Encryption**: Built-in encryption support
- **Small bundle**: ~10KB gzipped
- **Multi-process**: Supports multiple app instances

### Negative
- **Native dependency**: Requires native compilation
- **Limited query capabilities**: No SQL-like queries
- **Memory usage**: Entire storage loaded into memory

### Neutral
- Migration path from AsyncStorage: Simple key migration
- Backup/restore: Export/import via JSON

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **AsyncStorage** | Simple, well-known | Slow, async, no encryption | Rejected |
| **SQLite** | Powerful queries | Complex, larger bundle | Rejected |
| **Realm** | Object-oriented, fast | Large bundle, licensing | Rejected |
| **WatermelonDB** | Great for large datasets | Overkill for chat app | Rejected |

## References

- [MMKV Documentation](https://github.com/mrousavy/react-native-mmkv)
- [MMKV vs AsyncStorage](https://blog.logrocket.com/mmkv-vs-asyncstorage-react-native/)

---

**Last Updated**: 2026-09-27  
**Review Date**: 2027-03-27
