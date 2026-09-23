/**
 * Secure Storage
 *
 * Single encryption layer: MMKV's native AES-256 encryption, keyed by a
 * randomly-generated key stored in the OS keychain (Keychain on iOS,
 * Android Keystore via react-native-keychain on Android).
 *
 * Design decisions:
 * - No CryptoJS double-encryption. MMKV's built-in AES-256 is sufficient
 *   and avoids the overhead of two encrypt/decrypt passes per operation.
 * - No static fallback key. If the keychain is unavailable the function
 *   throws — callers must handle the error. Silently degrading to a known
 *   key is worse than an explicit failure.
 * - The MMKV instance is created lazily and memoised per storage ID.
 *   Subsequent calls reuse the same instance without re-reading the keychain.
 */

import { Platform } from "react-native";
import { MMKV } from "react-native-mmkv";
import * as Keychain from "react-native-keychain";
import { captureException, addUserActionBreadcrumb } from "../monitoring/sentry";

const STORAGE_ID = "secure-storage";
const KEYCHAIN_SERVICE = "com.chatapp.securestorage";
const KEYCHAIN_ACCOUNT = "mmkv-encryption-key";

const _storages = new Map<string, MMKV>();
const _webStorages = new Map<string, StorageAdapter>();

interface StorageAdapter {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

function getWebStorage(keyPrefix: string): StorageAdapter {
  if (!_webStorages.has(keyPrefix)) {
    const storageKey = (name: string) => `${keyPrefix}_${name}`;
    _webStorages.set(keyPrefix, {
      getItem: (name: string) => {
        try {
          return localStorage.getItem(storageKey(name));
        } catch {
          return null;
        }
      },
      setItem: (name: string, value: string) => {
        try {
          localStorage.setItem(storageKey(name), value);
        } catch {
          // Storage unavailable
        }
      },
      removeItem: (name: string) => {
        try {
          localStorage.removeItem(storageKey(name));
        } catch {
          // Storage unavailable
        }
      },
    });
  }
  const existing = _webStorages.get(keyPrefix);
  if (!existing) {
    throw new Error(`Failed to create web storage for ${keyPrefix}`);
  }
  return existing;
}

function generateKey(byteLength = 32): string {
  return Array.from({ length: byteLength }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("");
}

async function getOrCreateEncryptionKey(): Promise<string> {
  addUserActionBreadcrumb("secure_storage_key_attempt");

  const storageKey = "secure_storage_encryption_key";

  if (Platform.OS === "web") {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      addUserActionBreadcrumb("secure_storage_key_found");
      return stored;
    }
    const newKey = generateKey(32);
    localStorage.setItem(storageKey, newKey);
    addUserActionBreadcrumb("secure_storage_key_created");
    return newKey;
  }

  let existing: Keychain.UserCredentials | false;
  try {
    existing = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch (err) {
    captureException(err as Error, { action: "keychain_read", screen: "security_module" });
    throw new Error(
      "Secure storage is unavailable: keychain read failed. " +
        "The app cannot safely store sensitive data on this device."
    );
  }

  if (existing && existing.username === KEYCHAIN_ACCOUNT) {
    addUserActionBreadcrumb("secure_storage_key_found");
    return existing.password;
  }

  const newKey = generateKey(32);
  try {
    await Keychain.setGenericPassword(KEYCHAIN_ACCOUNT, newKey, {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    addUserActionBreadcrumb("secure_storage_key_created");
    return newKey;
  } catch (err) {
    captureException(err as Error, { action: "keychain_write", screen: "security_module" });
    throw new Error(
      "Secure storage is unavailable: keychain write failed. " +
        "The app cannot safely store sensitive data on this device."
    );
  }
}

async function getStorage(storageId?: string): Promise<MMKV> {
  const id = storageId ?? STORAGE_ID;
  const existing = _storages.get(id);
  if (existing) return existing;

  const encryptionKey = await getOrCreateEncryptionKey();

  const storage = new MMKV({
    id,
    encryptionKey,
  });

  _storages.set(id, storage);
  addUserActionBreadcrumb("secure_storage_initialized");
  return storage;
}

function isWebStorage(): boolean {
  return Platform.OS === "web";
}

function getWebStorageAdapter(storageId?: string): StorageAdapter {
  const id = storageId ?? STORAGE_ID;
  if (!_webStorages.has(id)) {
    _webStorages.set(id, getWebStorage(id));
  }
  const existing = _webStorages.get(id);
  if (!existing) {
    throw new Error(`Failed to get web storage adapter for ${id}`);
  }
  return existing;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function secureSet(key: string, value: string, storageId?: string): Promise<void> {
  if (isWebStorage()) {
    const adapter = getWebStorageAdapter(storageId);
    adapter.setItem(key, value);
    return;
  }
  try {
    addUserActionBreadcrumb("secure_set_attempt", { key });
    const instance = await getStorage(storageId);
    instance.set(key, value);
    addUserActionBreadcrumb("secure_set_success", { key });
  } catch (error) {
    captureException(error as Error, {
      action: "secure_set",
      screen: "security_module",
      additionalData: { key },
    });
    throw error;
  }
}

export async function secureGet(key: string, storageId?: string): Promise<string | undefined> {
  if (isWebStorage()) {
    const adapter = getWebStorageAdapter(storageId);
    const value = adapter.getItem(key);
    return value ?? undefined;
  }
  try {
    addUserActionBreadcrumb("secure_get_attempt", { key });
    const instance = await getStorage(storageId);
    const value = instance.getString(key);
    addUserActionBreadcrumb("secure_get_success", { key, found: value !== undefined });
    return value;
  } catch (error) {
    captureException(error as Error, {
      action: "secure_get",
      screen: "security_module",
      additionalData: { key },
    });
    throw error;
  }
}

export async function secureDelete(key: string, storageId?: string): Promise<void> {
  if (isWebStorage()) {
    const adapter = getWebStorageAdapter(storageId);
    adapter.removeItem(key);
    return;
  }
  try {
    addUserActionBreadcrumb("secure_delete_attempt", { key });
    const instance = await getStorage(storageId);
    instance.delete(key);
    addUserActionBreadcrumb("secure_delete_success", { key });
  } catch (error) {
    captureException(error as Error, {
      action: "secure_delete",
      screen: "security_module",
      additionalData: { key },
    });
    throw error;
  }
}

export async function secureClear(): Promise<void> {
  if (isWebStorage()) {
    try {
      for (const key of Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_ID))) {
        localStorage.removeItem(key);
      }
      localStorage.removeItem("secure_storage_encryption_key");
    } catch {
      // Ignore errors on web
    }
    return;
  }
  try {
    addUserActionBreadcrumb("secure_clear_attempt");
    const instance = await getStorage();
    instance.clearAll();
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    _storages.delete(STORAGE_ID);
    addUserActionBreadcrumb("secure_clear_success");
  } catch (error) {
    captureException(error as Error, {
      action: "secure_clear",
      screen: "security_module",
    });
    throw error;
  }
}

export async function secureSetJSON<T>(key: string, data: T, storageId?: string): Promise<void> {
  await secureSet(key, JSON.stringify(data), storageId);
}

export async function secureGetJSON<T>(key: string, storageId?: string): Promise<T | undefined> {
  const raw = await secureGet(key, storageId);
  if (raw === undefined) return undefined;
  return JSON.parse(raw) as T;
}

export default {
  secureSet,
  secureGet,
  secureDelete,
  secureClear,
  secureSetJSON,
  secureGetJSON,
};
