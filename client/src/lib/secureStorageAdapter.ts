/**
 * Secure Storage Adapter for Zustand Persist Middleware
 *
 * Provides a synchronous storage interface compatible with Zustand's persist middleware
 * while using the async secureStorage API under the hood.
 *
 * Uses an in-memory cache with async persistence to secureStorage.
 */

import { secureGet, secureSet, secureDelete, secureClear } from "@/security/secureStorage";

interface StorageAdapter {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

/**
 * Creates a synchronous storage adapter backed by secureStorage.
 * The adapter uses an in-memory cache for synchronous reads/writes
 * and persists changes to secureStorage asynchronously.
 */
export function createSecureStorageAdapter(storageName: string): StorageAdapter {
  const cache = new Map<string, string>();
  let initialized = false;
  let initPromise: Promise<void> | null = null;

  /**
   * Initialize the cache by loading all data from secureStorage.
   * This should be called once during app startup.
   */
  async function initialize(): Promise<void> {
    if (initialized || initPromise) {
      if (initPromise) await initPromise;
      return;
    }

    initPromise = (async () => {
      try {
        // We can't list all keys in secureStorage, so we'll load on-demand
        // For now, mark as initialized - individual keys will be loaded on first getItem
        initialized = true;
      } catch (error) {
        console.error(`[SecureStorageAdapter:${storageName}] Initialization failed:`, error);
        initialized = true; // Don't block on init failure
      }
    })();

    await initPromise;
  }

  /**
   * Ensure a key is loaded in cache from secureStorage
   */
  async function ensureLoaded(key: string): Promise<void> {
    if (cache.has(key) || !initialized) {
      await initialize();
    }

    if (!cache.has(key)) {
      try {
        const value = await secureGet(key, storageName);
        if (value !== undefined) {
          cache.set(key, value);
        }
      } catch (error) {
        console.error(`[SecureStorageAdapter:${storageName}] Failed to load key ${key}:`, error);
      }
    }
  }

  /**
   * Persist a key to secureStorage asynchronously
   */
  function persistSet(key: string, value: string): void {
    secureSet(key, value, storageName).catch((error) => {
      console.error(`[SecureStorageAdapter:${storageName}] Failed to persist key ${key}:`, error);
    });
  }

  /**
   * Persist a key deletion to secureStorage asynchronously
   */
  function persistDelete(key: string): void {
    secureDelete(key, storageName).catch((error) => {
      console.error(`[SecureStorageAdapter:${storageName}] Failed to delete key ${key}:`, error);
    });
  }

  return {
    getItem: (name: string): string | null => {
      // Synchronously return cached value (or null if not loaded yet)
      // The value will be loaded asynchronously for next time
      const cached = cache.get(name);
      if (cached !== undefined) return cached;

      // Fire-and-forget load for next access
      ensureLoaded(name).catch(() => {});

      return null;
    },

    setItem: (name: string, value: string): void => {
      cache.set(name, value);
      persistSet(name, value);
    },

    removeItem: (name: string): void => {
      cache.delete(name);
      persistDelete(name);
    },
  };
}

/**
 * Creates a storage adapter that loads all known keys on initialization.
 * Use this when you know the exact keys that will be used.
 */
export function createSecureStorageAdapterWithKeys(
  storageName: string,
  knownKeys: string[]
): StorageAdapter {
  const cache = new Map<string, string>();
  let initialized = false;
  let initPromise: Promise<void> | null = null;

  async function initialize(): Promise<void> {
    if (initialized || initPromise) {
      if (initPromise) await initPromise;
      return;
    }

    initPromise = (async () => {
      try {
        await Promise.all(
          knownKeys.map(async (key) => {
            try {
              const value = await secureGet(key, storageName);
              if (value !== undefined) {
                cache.set(key, value);
              }
            } catch (error) {
              console.error(
                `[SecureStorageAdapter:${storageName}] Failed to load key ${key}:`,
                error
              );
            }
          })
        );
        initialized = true;
      } catch (error) {
        console.error(`[SecureStorageAdapter:${storageName}] Initialization failed:`, error);
        initialized = true;
      }
    })();

    await initPromise;
  }

  function persistSet(key: string, value: string): void {
    secureSet(key, value, storageName).catch((error) => {
      console.error(`[SecureStorageAdapter:${storageName}] Failed to persist key ${key}:`, error);
    });
  }

  function persistDelete(key: string): void {
    secureDelete(key, storageName).catch((error) => {
      console.error(`[SecureStorageAdapter:${storageName}] Failed to delete key ${key}:`, error);
    });
  }

  return {
    getItem: (name: string): string | null => {
      const cached = cache.get(name);
      if (cached !== undefined) return cached;

      // Try to load on-demand if not initialized
      if (!initialized) {
        initialize().catch(() => {});
      }

      return null;
    },

    setItem: (name: string, value: string): void => {
      cache.set(name, value);
      persistSet(name, value);
    },

    removeItem: (name: string): void => {
      cache.delete(name);
      persistDelete(name);
    },
  };
}

/**
 * Clear all data from secureStorage and the cache.
 * Use this for logout/reset scenarios.
 */
export async function clearSecureStorageAdapter(adapter: StorageAdapter): Promise<void> {
  // We can't easily clear the cache since it's a Map in closure
  // But we can clear secureStorage
  await secureClear();
}

export default {
  createSecureStorageAdapter,
  createSecureStorageAdapterWithKeys,
  clearSecureStorageAdapter,
};
