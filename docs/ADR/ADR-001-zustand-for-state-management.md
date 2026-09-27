# ADR-001: Zustand for State Management

**Status**: Accepted  
**Date**: 2026-09-27  
**Deciders**: Engineering Team

## Context

We needed a state management solution for ChatApp that:
- Handles complex normalized state (chats, messages, users)
- Provides TypeScript-first API with excellent type inference
- Supports middleware for persistence, devtools, and time-travel
- Has minimal boilerplate compared to Redux
- Works well with React Native and Expo
- Supports offline-first architecture with MMKV persistence

We evaluated Redux Toolkit, MobX, Jotai, Recoil, and Zustand.

## Decision

We chose **Zustand v5** for state management with the following middleware stack:
- **Immer**: Immutable updates with mutable syntax
- **Persist**: MMKV-backed persistence for offline-first
- **DevTools**: Time-travel debugging in development

### State Architecture

```
useChatStore (Zustand + Immer + Persist)
  ├── chats: NormalizedState<Chat>
  │   ├── ids: string[]
  │   └── entities: Record<string, Chat>
  ├── messages: NormalizedState<Message>
  │   ├── ids: string[]
  │   ├── entities: Record<string, Message>
  │   └── messagesByChatId: Record<string, string[]> (secondary index)
  ├── activeChatId: string | null
  ├── isLoading: boolean
  └── error: string | null
```

## Consequences

### Positive
- **Minimal boilerplate**: ~80% less code than Redux Toolkit
- **Excellent TypeScript support**: Full type inference without manual typings
- **Flexible middleware**: Easy to add persistence, devtools, etc.
- **Small bundle size**: ~1KB gzipped vs Redux ~3KB
- **Native Immer integration**: No manual spread operators

### Negative
- **Smaller ecosystem**: Fewer middleware options than Redux
- **Less community knowledge**: Newer library, fewer tutorials
- **No built-in time-travel**: Requires manual devtools setup

### Neutral
- Team learning curve: ~2 days for Redux-experienced developers
- Migration path: Clear upgrade path from v4 to v5

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Redux Toolkit** | Mature, large ecosystem | More boilerplate, steeper learning curve | Rejected |
| **MobX** | Simple, reactive | Less TypeScript-friendly, mutable by default | Rejected |
| **Jotai** | Atomic, flexible | Too new, less suited for complex state | Rejected |
| **Recoil** | Facebook-backed, concurrent-safe | Deprecated by Meta, not recommended | Rejected |

## References

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Zustand vs Redux](https://docs.pmnd.rs/zustand/comparison)
- [Immer Documentation](https://immerjs.github.io/immer/)

---

**Last Updated**: 2026-09-27  
**Review Date**: 2027-03-27
