# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for ChatApp 2026.

## What is an ADR?

An Architecture Decision Record captures important architectural decisions, along with their context and consequences.

## ADR Index

| ID                                                 | Title                                    | Status   | Date       |
| -------------------------------------------------- | ---------------------------------------- | -------- | ---------- |
| [ADR-001](ADR-001-zustand-for-state-management.md) | Zustand for State Management             | Accepted | 2026-09-27 |
| [ADR-002](ADR-002-mmkv-for-persistence.md)         | MMKV for Local Persistence               | Accepted | 2026-09-27 |
| [ADR-003](ADR-003-clean-architecture.md)           | Clean Architecture Pattern               | Accepted | 2026-09-27 |
| [ADR-004](ADR-004-websocket-for-realtime.md)       | WebSocket for Real-time Communication    | Accepted | 2026-09-27 |
| [ADR-005](ADR-005-ssl-pinning.md)                  | SSL Pinning for Network Security         | Accepted | 2026-09-27 |
| [ADR-006](ADR-006-immer-middleware.md)             | Immer Middleware for Zustand             | Accepted | 2026-09-27 |
| [ADR-007](ADR-007-service-locator-di.md)           | Service Locator for Dependency Injection | Accepted | 2026-09-27 |
| [ADR-008](ADR-008-flashlist-migration.md)          | FlashList for Message Rendering          | Accepted | 2026-10-07 |

## Creating a New ADR

1. Copy the template: `docs/ADR/adr-template.md`
2. Name it: `ADR-XXX-short-title.md`
3. Fill in the context, decision, and consequences
4. Submit a PR with the ADR
5. Team reviews and accepts/rejects

## ADR Template

```markdown
# ADR-XXX: Title

**Status**: Proposed | Accepted | Rejected | Deprecated | Superseded
**Date**: YYYY-MM-DD
**Deciders**: Names of decision makers

## Context

What is the issue we're trying to solve?
What are the constraints?
What are the requirements?

## Decision

What is the change we're proposing?
How does it address the issue?

## Consequences

### Positive

- Benefit 1
- Benefit 2

### Negative

- Trade-off 1
- Trade-off 2

### Neutral

- Impact 1
```

---

**Maintained by**: Architecture Team  
**Last Updated**: 2026-10-07
