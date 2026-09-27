# ADR-007: Service Locator for Dependency Injection

**Status**: Accepted  
**Date**: 2026-09-27  
**Deciders**: Engineering Team

## Context

ChatApp's Clean Architecture requires dependency injection to:
- Provide data source implementations to repositories
- Swap implementations (e.g., mock vs real) in tests
- Avoid circular dependencies between layers
- Maintain clean separation of concerns

## Decision

We implemented a **Service Locator** pattern as a lightweight DI container:

```typescript
class ServiceLocator {
  private static instance: ServiceLocator;
  private services = new Map<string, unknown>();

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }

  resolve<T>(token: string): T {
    const factory = this.services.get(token) as (() => T) | undefined;
    if (!factory) throw new Error(`Service not found: ${token}`);
    return factory();
  }
}
```

## Consequences

### Positive
- **Decoupling**: Layers don't directly instantiate dependencies
- **Testability**: Easy to swap implementations in tests
- **Singleton management**: Centralized lifecycle
- **Type safety**: Full TypeScript support

### Negative
- **Hidden dependencies**: Harder to trace at a glance
- **Runtime errors**: Missing registrations fail at runtime

### Neutral
- Trade-off: Service Locator vs Constructor Injection
- Team familiarity: Most team members understand pattern

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Constructor Injection** | Explicit dependencies | Verbose, complex setup | Rejected |
| **InversifyJS** | Powerful, decorators | Heavy, learning curve | Rejected |
| **Manual singletons** | Simple | Hard to test, tight coupling | Rejected |

## References

- [Service Locator Pattern](https://martinfowler.com/articles/injection.html)
- [Clean Architecture DI](https://betterprogramming.pub/dependency-injection-clean-architecture-9d5747ab3f84)

---

**Last Updated**: 2026-09-27  
**Review Date**: 2027-03-27
