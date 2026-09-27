# ADR-006: Immer Middleware for Zustand

**Status**: Accepted  
**Date**: 2026-09-27  
**Deciders**: Engineering Team

## Context

Zustand's default `setState` requires immutable updates, which leads to verbose spread operators:

```typescript
set((state) => ({
  ...state,
  chats: {
    ...state.chats,
    entities: {
      ...state.chats.entities,
      [chat.id]: chat,
    },
  },
}));
```

This is error-prone and hard to maintain with deeply nested normalized state.

## Decision

We adopted **Zustand Immer Middleware** to enable mutable update syntax:

```typescript
set((state) => {
  state.chats.entities[chat.id] = chat;
  if (!state.chats.ids.includes(chat.id)) {
    state.chats.ids.push(chat.id);
  }
});
```

### How It Works
- Immer wraps the state in a Proxy (draft)
- Mutations on the draft are recorded
- Immer produces the next immutable state automatically
- Works seamlessly with Zustand's `set` function

## Consequences

### Positive
- **Cleaner code**: ~40% less code for state updates
- **Less errors**: No manual spread operators
- **Better readability**: Intent is clear
- **Performance**: Immer uses structural sharing

### Negative
- **Bundle size**: Adds ~3KB gzipped
- **Learning curve**: Team needs to understand Immer concepts
- **Debugging**: Can be confusing when inspecting state

### Neutral
- Compatible with all Zustand middleware
- Works with TypeScript out of the box

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Manual spreads** | No dependencies | Verbose, error-prone | Rejected |
| **Immutable.js** | Immutable by default | Large bundle, different API | Rejected |
| **useReducer** | Built-in React | Too verbose for complex state | Rejected |

## References

- [Immer Documentation](https://immerjs.github.io/immer/)
- [Zustand Immer Middleware](https://docs.pmnd.rs/zustand/integrations/immer)

---

**Last Updated**: 2026-09-27  
**Review Date**: 2027-03-27
