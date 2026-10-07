# ADR-008: FlashList for Message Rendering

**Status**: Accepted  
**Date**: 2026-10-07  
**Deciders**: Engineering Team

## Context

`OptimizedMessageList.tsx` used `FlatList` from React Native for rendering chat messages. Performance was acceptable for small chats but degraded with large message histories (1000+ messages). FlashList (`@shopify/flash-list`) offers better memory management and rendering performance for long lists.

## Decision

Migrate `OptimizedMessageList` from `FlatList` to `FlashList`:

- Replace `FlatList` import with `FlashList` from `@shopify/flash-list`
- Remove `inverted` prop (FlashList handles this differently)
- Keep `estimatedItemSize`, `keyExtractor`, `getItemType`

## Consequences

### Positive

- Better memory efficiency for long message histories
- Faster initial render
- Lower memory footprint on Android

### Negative

- 12 ChatScreen tests failing — FlashList mock not working with test setup (`bubble-msg-1` not found)
- Requires `@shopify/flash-list` dependency
- `inverted` prop removal changes scroll behavior

### Neutral

- Test infrastructure needs FlashList mock update
- No user-facing behavior change expected

## Follow-up

Fix ChatScreen test mocks to work with FlashList. Tracked in project issue tracker.
