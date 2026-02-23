/**
 * Dependency Injection Container
 * Service locator pattern for Clean Architecture
 */

import type { ChatRepository } from '../../domain/repositories/ChatRepository';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { ChatRepositoryImpl } from '../../data/repositories/ChatRepositoryImpl';
import { UserRepositoryImpl } from '../../data/repositories/UserRepositoryImpl';
import { LocalStorageDataSource } from '../../data/datasources/LocalStorageDataSource';
import { RemoteApiDataSource } from '../../data/datasources/RemoteApiDataSource';

// Service tokens for type-safe resolution
export const TOKENS = {
  ChatRepository: Symbol.for('ChatRepository'),
  UserRepository: Symbol.for('UserRepository'),
  LocalStorage: Symbol.for('LocalStorage'),
  RemoteApi: Symbol.for('RemoteApi'),
} as const;

// Type mapping for services
type ServiceMap = {
  [TOKENS.ChatRepository]: ChatRepository;
  [TOKENS.UserRepository]: UserRepository;
  [TOKENS.LocalStorage]: LocalStorageDataSource;
  [TOKENS.RemoteApi]: RemoteApiDataSource;
};

class DIContainer {
  private services = new Map<symbol, unknown>();
  private factories = new Map<symbol, () => unknown>();

  // Register a singleton instance
  register<K extends keyof ServiceMap>(token: K, instance: ServiceMap[K]): void {
    this.services.set(token, instance);
  }

  // Register a factory for lazy initialization
  registerFactory<K extends keyof ServiceMap>(token: K, factory: () => ServiceMap[K]): void {
    this.factories.set(token, factory);
  }

  // Resolve a service
  resolve<K extends keyof ServiceMap>(token: K): ServiceMap[K] {
    // Check for existing instance
    const existing = this.services.get(token);
    if (existing) {
      return existing as ServiceMap[K];
    }

    // Check for factory
    const factory = this.factories.get(token);
    if (factory) {
      const instance = factory() as ServiceMap[K];
      this.services.set(token, instance); // Cache as singleton
      return instance;
    }

    throw new Error(`Service not registered: ${token.toString()}`);
  }

  // Check if service is registered
  has(token: symbol): boolean {
    return this.services.has(token) || this.factories.has(token);
  }

  // Clear all services (useful for testing)
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// Singleton container instance
export const container = new DIContainer();

// Initialize default registrations
export function initializeContainer(): void {
  // Data sources
  container.registerFactory(TOKENS.LocalStorage, () => new LocalStorageDataSource());
  container.registerFactory(TOKENS.RemoteApi, () => new RemoteApiDataSource());

  // Repositories
  container.registerFactory(TOKENS.ChatRepository, () => {
    const local = container.resolve(TOKENS.LocalStorage);
    const remote = container.resolve(TOKENS.RemoteApi);
    return new ChatRepositoryImpl(local, remote);
  });

  container.registerFactory(TOKENS.UserRepository, () => {
    const local = container.resolve(TOKENS.LocalStorage);
    const remote = container.resolve(TOKENS.RemoteApi);
    return new UserRepositoryImpl(local, remote);
  });
}

// Convenience hooks for React
export function useChatRepository(): ChatRepository {
  return container.resolve(TOKENS.ChatRepository);
}

export function useUserRepository(): UserRepository {
  return container.resolve(TOKENS.UserRepository);
}
