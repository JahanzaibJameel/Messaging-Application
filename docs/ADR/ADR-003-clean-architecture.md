# ADR-003: Clean Architecture Pattern

**Status**: Accepted  
**Date**: 2026-09-27  
**Deciders**: Engineering Team

## Context

ChatApp needed an architecture that:
- Separates business logic from framework concerns
- Enables independent testing of each layer
- Supports multiple platforms (iOS, Android, Web)
- Allows swapping implementations (e.g., local vs remote data sources)
- Scales to a large codebase with multiple features

## Decision

We adopted **Clean Architecture** with Domain-Driven Design principles:

```
┌─────────────────────────────────────────┐
│     Presentation Layer (React Native)   │
│  - UI, Navigation, State Management     │
└─────────────────────────────────────────┘
                  ↓ depends on
┌─────────────────────────────────────────┐
│          Domain Layer (Pure TypeScript) │
│  - Entities, Use Cases, Repository I/Fs │
└─────────────────────────────────────────┘
                  ↓ depends on
┌─────────────────────────────────────────┐
│          Data Layer (Implementations)   │
│  - Repositories, Data Sources, Mappers │
└─────────────────────────────────────────┘
                  ↓ depends on
┌─────────────────────────────────────────┐
│       Core Layer (Infrastructure)       │
│  - Sync Engine, Security, DI, Logging   │
└─────────────────────────────────────────┘
```

### Layer Rules
- Inner layers never depend on outer layers
- All dependencies point inward
- Domain layer has zero external dependencies
- Data and Core layers implement Domain interfaces

## Consequences

### Positive
- **Testability**: Each layer independently testable
- **Maintainability**: Clear boundaries, easy to refactor
- **Flexibility**: Swap implementations without changing business logic
- **Scalability**: New features added without modifying existing code

### Negative
- **More files**: More directories and boilerplate
- **Learning curve**: New developers need to understand layers
- **Initial setup time**: More upfront design required

### Neutral
- Code navigation: Clear mental model for file locations
- Documentation: Architecture well-documented

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Feature-based** | Simple, colocated | Hard to share logic, poor testability | Rejected |
| **MVC/MVVM** | Familiar patterns | Tight coupling, hard to test | Rejected |
| **Hexagonal/Ports & Adapters** | Similar benefits | Less common in React Native | Rejected (similar) |

## References

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)

---

**Last Updated**: 2026-09-27  
**Review Date**: 2027-03-27
