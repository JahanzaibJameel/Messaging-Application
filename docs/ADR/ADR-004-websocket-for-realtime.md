# ADR-004: WebSocket for Real-time Communication

**Status**: Accepted  
**Date**: 2026-09-27  
**Deciders**: Engineering Team

## Context

ChatApp requires real-time features:
- Instant message delivery
- Typing indicators
- Read receipts
- Online presence
- Push notifications

Options: WebSocket, Server-Sent Events (SSE), long-polling, Firebase Cloud Messaging.

## Decision

We chose **WebSocket** (via `ws` library) for real-time communication with the following architecture:

```
Client (React Native) ←→ WebSocket Server (Node.js + ws)
                                ↓
                         Redis Pub/Sub
                                ↓
                         PostgreSQL
```

### Features
- Full-duplex communication for instant messaging
- Heartbeat/ping-pong for connection health
- Automatic reconnection with exponential backoff
- Message queuing during disconnection
- Event-based architecture with typed payloads

## Consequences

### Positive
- **Low latency**: <100ms message delivery
- **Full duplex**: Bi-directional communication
- **Efficient**: Single TCP connection, minimal overhead
- **Scalable**: Horizontal scaling via Redis Pub/Sub

### Negative
- **Complexity**: More complex than REST API
- **Connection management**: Need to handle reconnections
- **Server resources**: Persistent connections consume memory

### Neutral
- Fallback to REST API if WebSocket unavailable
- Message queuing ensures no message loss

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **SSE** | Simple, auto-reconnect | Unidirectional only | Rejected |
| **Long-polling** | Works everywhere | Higher latency, more overhead | Rejected |
| **Firebase Cloud Messaging** | Managed service | Vendor lock-in, limited control | Rejected |

## References

- [WebSocket RFC 6455](https://datatracker.ietf.org/doc/html/rfc6455)
- [ws Library Documentation](https://github.com/websockets/ws)

---

**Last Updated**: 2026-09-27  
**Review Date**: 2027-03-27
