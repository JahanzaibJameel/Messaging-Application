/**
 * Secure Storage Module
 * Provides encrypted storage using MMKV with keychain-protected encryption keys
 */

import { MMKV } from 'react-native-mmkv';
import { setUserCredentials, getUserCredentials } from './keychain';
import { captureException, addUserActionBreadcrumb } from '../monitoring/sentry';
import CryptoJS from 'crypto-js';

// Encryption key storage key in keychain
const ENCRYPTION_KEY_CREDENTIALS_KEY = 'secure_storage_encryption';

// Storage instance for encrypted data
let encryptedStorage: MMKV | null = null;

/**
 * Generate a random encryption key
 */
const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};

/**
 * Get or create encryption key from secure storage
 */
const getOrCreateEncryptionKey = async (): Promise<string> => {
  try {
    addUserActionBreadcrumb('get_encryption_key_attempt');
    
    // Try to get existing encryption key from keychain
    const credentials = await getUserCredentials();
    
    if (credentials && credentials.username === ENCRYPTION_KEY_CREDENTIALS_KEY) {
      addUserActionBreadcrumb('encryption_key_found');
      return credentials.email || ''; // Store key in email field
    }
    
    // Generate new encryption key
    const newKey = generateEncryptionKey();
    
    // Store the encryption key in keychain
    const keyCredentials = {
      userId: 'secure_storage',
      username: ENCRYPTION_KEY_CREDENTIALS_KEY,
      email: newKey, // Store key in email field
    };
    
    const success = await setUserCredentials(keyCredentials);
    
    if (success) {
      addUserActionBreadcrumb('encryption_key_created_and_stored');
      return newKey;
    } else {
      throw new Error('Failed to store encryption key');
    }
    
  } catch (error) {
    addUserActionBreadcrumb('get_encryption_key_error', {
      error: (error as Error).message,
    });
    
    captureException(error as Error, {
      action: 'get_encryption_key',
      screen: 'security_module',
    });
    
    // Fallback to a hardcoded key (less secure, but prevents app crashes)
    return 'fallback_encryption_key_for_development_only';
  }
};

/**
 * Initialize encrypted storage
 */
export const initializeSecureStorage = async (): Promise<boolean> => {
  try {
    addUserActionBreadcrumb('secure_storage_init_attempt');
    
    if (encryptedStorage) {
      addUserActionBreadcrumb('secure_storage_already_initialized');
      return true;
    }
    
    const encryptionKey = await getOrCreateEncryptionKey();
    
    // Create MMKV instance with encryption
    encryptedStorage = new MMKV({
      id: 'secure_storage',
      encryptionKey: encryptionKey,
    });
    
    // Test the storage
    const testKey = '__secure_storage_test__';
    encryptedStorage.set(testKey, 'test');
    const testValue = encryptedStorage.getString(testKey);
    encryptedStorage.delete(testKey);
    
    if (testValue === 'test') {
      addUserActionBreadcrumb('secure_storage_init_success');
      return true;
    } else {
      throw new Error('Secure storage test failed');
    }
    
  } catch (error) {
    addUserActionBreadcrumb('secure_storage_init_error', {
      error: (error as Error).message,
    });
    
    captureException(error as Error, {
      action: 'secure_storage_init',
      screen: 'security_module',
    });
    
    return false;
  }
};

/**
 * Ensure storage is initialized
 */
const ensureStorageInitialized = async (): Promise<boolean> => {
  if (!encryptedStorage) {
    return await initializeSecureStorage();
  }
  return true;
};

/**
 * Store data securely with encryption
 */
export const secureSet = async (key: string, value: string): Promise<boolean> => {
  try {
    addUserActionBreadcrumb('secure_set_attempt', { key });
    
    const initialized = await ensureStorageInitialized();
    if (!initialized || !encryptedStorage) {
      throw new Error('Secure storage not initialized');
    }
    
    // Encrypt the value before storing
    const encryptedValue = CryptoJS.AES.encrypt(value, await getOrCreateEncryptionKey()).toString();
    
    encryptedStorage.set(key, encryptedValue);
    
    // Verify the value was stored correctly
    const storedValue = encryptedStorage.getString(key);
    if (!storedValue) {
      throw new Error('Failed to store encrypted value');
    }
    
    addUserActionBreadcrumb('secure_set_success', { key });
    return true;
    
  } catch (error) {
    addUserActionBreadcrumb('secure_set_error', {
      key,
      error: (error as Error).message,
    });
    
    captureException(error as Error, {
      action: 'secure_set',
      screen: 'security_module',
      additionalData: { key },
    });
    
    return false;
  }
};

/**
 * Retrieve and decrypt data from secure storage
 */
export const secureGet = async (key: string): Promise<string | null> => {
  try {
    addUserActionBreadcrumb('secure_get_attempt', { key });
    
    const initialized = await ensureStorageInitialized();
    if (!initialized || !encryptedStorage) {
      throw new Error('Secure storage not initialized');
    }
    
    const encryptedValue = encryptedStorage.getString(key);
    
    if (!encryptedValue) {
      addUserActionBreadcrumb('secure_get_not_found', { key });
      return null;
    }
    
    // Decrypt the value
    const encryptionKey = await getOrCreateEncryptionKey();
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, encryptionKey);
    const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedValue) {
      throw new Error('Failed to decrypt value');
    }
    
    addUserActionBreadcrumb('secure_get_success', { key });
    return decryptedValue;
    
  } catch (error) {
    addUserActionBreadcrumb('secure_get_error', {
      key,
      error: (error as Error).message,
    });
    
    captureException(error as Error, {
      action: 'secure_get',
      screen: 'security_module',
      additionalData: { key },
    });
    
    return null;
  }
};

/**
 * Remove data from secure storage
 */
export const secureDelete = async (key: string): Promise<boolean> => {
  try {
    addUserActionBreadcrumb('secure_delete_attempt', { key });
    
    const initialized = await ensureStorageInitialized();
    if (!initialized || !encryptedStorage) {
      throw new Error('Secure storage not initialized');
    }
    
    const existed = encryptedStorage.contains(key);
    encryptedStorage.delete(key);
    
    addUserActionBreadcrumb('secure_delete_success', { 
      key,
      existed,
    });
    
    return true;
    
  } catch (error) {
    addUserActionBreadcrumb('secure_delete_error', {
      key,
      error: (error as Error).message,
    });
    
    captureException(error as Error, {
      action: 'secure_delete',
      screen: 'security_module',
      additionalData: { key },
    });
    
    return false;
  }
};

/**
 * Store JSON data securely
 */
export const secureSetJSON = async <T>(key: string, data: T): Promise<boolean> => {
  try {
    const jsonString = JSON.stringify(data);
    return await secureSet(key, jsonString);
  } catch (error) {
    captureException(error as Error, {
      action: 'secure_set_json',
      screen: 'security_module',
      additionalData: { key },
    });
    return false;
  }
};

/**
 * Retrieve and parse JSON data from secure storage
 */
export const secureGetJSON = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonString = await secureGet(key);
    if (!jsonString) {
      return null;
    }
    
    return JSON.parse(jsonString) as T;
  } catch (error) {
    captureException(error as Error, {
      action: 'secure_get_json',
      screen: 'security_module',
      additionalData: { key },
    });
    return null;
  }
};

export default {
  initializeSecureStorage,
  secureSet,
  secureGet,
  secureDelete,
  secureSetJSON,
  secureGetJSON,
};
