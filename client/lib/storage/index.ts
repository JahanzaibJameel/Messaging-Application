/**
 * Storage service using MMKV for high-performance local storage
 * MMKV is significantly faster than AsyncStorage for React Native apps
 * @module lib/storage
 */

import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const StorageService = {
  /**
   * Set a value in storage
   */
  setItem: (key: string, value: unknown): void => {
    try {
      const jsonString = JSON.stringify(value);
      storage.set(key, jsonString);
    } catch (error) {
      console.error(`Storage: Failed to set item ${key}:`, error);
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
    } catch (error) {
      console.error(`Storage: Failed to get item ${key}:`, error);
      return null;
    }
  },

  /**
   * Get a string value from storage
   */
  getString: (key: string): string | undefined => {
    try {
      return storage.getString(key);
    } catch (error) {
      console.error(`Storage: Failed to get string ${key}:`, error);
      return undefined;
    }
  },

  /**
   * Remove a value from storage
   */
  removeItem: (key: string): void => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error(`Storage: Failed to remove item ${key}:`, error);
    }
  },

  /**
   * Clear all storage
   */
  clear: (): void => {
    try {
      storage.clearAll();
    } catch (error) {
      console.error("Storage: Failed to clear all:", error);
    }
  },

  /**
   * Get all keys in storage
   */
  getAllKeys: (): string[] => {
    try {
      return storage.getAllKeys();
    } catch (error) {
      console.error("Storage: Failed to get all keys:", error);
      return [];
    }
  },

  /**
   * Check if a key exists
   */
  hasKey: (key: string): boolean => {
    try {
      return storage.contains(key);
    } catch (error) {
      console.error(`Storage: Failed to check key ${key}:`, error);
      return false;
    }
  },
};

export default StorageService;
