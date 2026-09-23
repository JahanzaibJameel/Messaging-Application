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

export function createSecureStorageAdapter(storageName: string): StorageAdapter {
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
        initialized = true;
      } catch (error) {
        console.error(`[SecureStorageAdapter:${storageName}] Initialization failed:`, error);
        initialized = true;
      }
    })();

    await initPromise;
  }

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

export async function clearSecureStorageAdapter(_adapter: StorageAdapter): Promise<void> {
  await secureClear();
}

export default {
  createSecureStorageAdapter,
  createSecureStorageAdapterWithKeys,
  clearSecureStorageAdapter,
};
