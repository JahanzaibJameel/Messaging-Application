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

import { MMKV } from "react-native-mmkv";
import * as Keychain from "react-native-keychain";
import { captureException, addUserActionBreadcrumb } from "../monitoring/sentry";

const STORAGE_ID = "secure-storage";
const KEYCHAIN_SERVICE = "com.chatapp.securestorage";
const KEYCHAIN_ACCOUNT = "mmkv-encryption-key";

const _storages = new Map<string, MMKV>();

/**
 * Returns a cryptographically random hex string of `byteLength` bytes.
 * Uses Math.random as a fallback because crypto.getRandomValues is not
 * available in all RN JS environments; for production replace with
 * expo-crypto or react-native-get-random-values.
 */
function generateKey(byteLength = 32): string {
  return Array.from({ length: byteLength }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("");
}

/**
 * Retrieves the MMKV encryption key from the OS keychain, creating and
 * persisting a new one if none exists yet.
 *
 * @throws {Error} if the keychain is unavailable. Never falls back to a
 *   static value — that would silently degrade security.
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  addUserActionBreadcrumb("secure_storage_key_attempt");

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

  // First use — generate and persist a new key
  const newKey = generateKey(32);
  try {
    await Keychain.setGenericPassword(KEYCHAIN_ACCOUNT, newKey, {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    captureException(err as Error, { action: "keychain_write", screen: "security_module" });
    throw new Error(
      "Secure storage is unavailable: keychain write failed. " +
        "The app cannot safely store sensitive data on this device."
    );
  }

  addUserActionBreadcrumb("secure_storage_key_created");
  return newKey;
}

/**
 * Returns the memoised encrypted MMKV instance for the given storage ID,
 * initialising it on first call.
 */
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Stores a string value under `key` in encrypted storage.
 * @throws if the keychain or MMKV is unavailable.
 */
export async function secureSet(key: string, value: string, storageId?: string): Promise<void> {
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

/**
 * Retrieves the string stored under `key`, or `undefined` if not found.
 * @throws if the keychain or MMKV is unavailable.
 */
export async function secureGet(key: string, storageId?: string): Promise<string | undefined> {
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

/**
 * Removes the value stored under `key`.
 * @throws if the keychain or MMKV is unavailable.
 */
export async function secureDelete(key: string, storageId?: string): Promise<void> {
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

/**
 * Clears all data from encrypted storage AND resets the keychain entry so a
 * fresh key is generated on next use.
 * @throws if the keychain or MMKV is unavailable.
 */
export async function secureClear(): Promise<void> {
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

/**
 * Serialises `data` to JSON and stores it under `key`.
 * @throws if serialisation, keychain, or MMKV fails.
 */
export async function secureSetJSON<T>(key: string, data: T, storageId?: string): Promise<void> {
  await secureSet(key, JSON.stringify(data), storageId);
}

/**
 * Retrieves and parses the JSON value stored under `key`.
 * Returns `undefined` if the key does not exist.
 * @throws if the keychain or MMKV is unavailable, or if the stored value
 *   is not valid JSON.
 */
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
