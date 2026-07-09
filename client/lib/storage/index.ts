/**
 * Storage service using MMKV for high-performance local storage
 * MMKV is significantly faster than AsyncStorage for React Native apps
 * @module lib/storage
 */

import { MMKV } from "react-native-mmkv";
import { error as logError } from "../../src/utils/logger";

const storage = new MMKV();

export const StorageService = {
  /**
   * Set a value in storage
   */
  setItem: (key: string, value: unknown): void => {
    try {
      const jsonString = JSON.stringify(value);
      storage.set(key, jsonString);
    } catch (error: unknown) {
      logError(`Storage: Failed to set item ${key}`, error, "storage");
    }
  },

  /**
   * Get a value from storage
   */
  getItem: (key: string): unknown => {
    try {
      const value = storage.getString(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error: unknown) {
      logError(`Storage: Failed to get item ${key}`, error, "storage");
      return null;
    }
  },

  /**
   * Get a string value from storage
   */
  getString: (key: string): string | undefined => {
    try {
      return storage.getString(key);
    } catch (error: unknown) {
      logError(`Storage: Failed to get string ${key}`, error, "storage");
      return undefined;
    }
  },

  /**
   * Remove a value from storage
   */
  removeItem: (key: string): void => {
    try {
      storage.delete(key);
    } catch (error: unknown) {
      logError(`Storage: Failed to remove item ${key}`, error, "storage");
    }
  },

  /**
   * Clear all storage
   */
  clear: (): void => {
    try {
      storage.clearAll();
    } catch (error: unknown) {
      logError("Storage: Failed to clear all", error, "storage");
    }
  },

  /**
   * Get all keys in storage
   */
  getAllKeys: (): string[] => {
    try {
      return storage.getAllKeys();
    } catch (error: unknown) {
      logError("Storage: Failed to get all keys", error, "storage");
      return [];
    }
  },

  /**
   * Check if a key exists
   */
  hasKey: (key: string): boolean => {
    try {
      return storage.contains(key);
    } catch (error: unknown) {
      logError(`Storage: Failed to check key ${key}`, error, "storage");
      return false;
    }
  },
};

export default StorageService;
