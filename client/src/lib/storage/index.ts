import { MMKV } from "react-native-mmkv";
import { Platform } from "react-native";
import { error as logError } from "@/utils/logger";

interface WebStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  hasKey: (key: string) => boolean;
  getAllKeys: () => string[];
}

const webStorage: WebStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
  hasKey: (key: string) => localStorage.getItem(key) !== null,
  getAllKeys: () => Object.keys(localStorage),
};

const isWeb = Platform.OS === "web";

const mmkv = isWeb ? null : new MMKV();

export const StorageService = {
  setItem: (key: string, value: unknown): void => {
    try {
      const jsonString = JSON.stringify(value);
      if (isWeb) {
        webStorage.setItem(key, jsonString);
      } else {
        mmkv!.set(key, jsonString);
      }
    } catch (error: unknown) {
      logError(`Storage: Failed to set item ${key}`, error, "storage");
    }
  },
  getItem: (key: string): unknown => {
    try {
      const value = isWeb ? webStorage.getItem(key) : mmkv!.getString(key);
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
  getString: (key: string): string | undefined => {
    try {
      const value = isWeb ? webStorage.getItem(key) : mmkv!.getString(key);
      return value ?? undefined;
    } catch (error: unknown) {
      logError(`Storage: Failed to get string ${key}`, error, "storage");
      return undefined;
    }
  },
  removeItem: (key: string): void => {
    try {
      if (isWeb) {
        webStorage.removeItem(key);
      } else {
        mmkv!.delete(key);
      }
    } catch (error: unknown) {
      logError(`Storage: Failed to remove item ${key}`, error, "storage");
    }
  },
  clear: (): void => {
    try {
      if (isWeb) {
        webStorage.clear();
      } else {
        mmkv!.clearAll();
      }
    } catch (error: unknown) {
      logError("Storage: Failed to clear all", error, "storage");
    }
  },
  getAllKeys: (): string[] => {
    try {
      if (isWeb) {
        return webStorage.getAllKeys();
      }
      return mmkv!.getAllKeys();
    } catch (error: unknown) {
      logError("Storage: Failed to get all keys", error, "storage");
      return [];
    }
  },
  hasKey: (key: string): boolean => {
    try {
      if (isWeb) {
        return webStorage.hasKey(key);
      }
      return mmkv!.contains(key);
    } catch (error: unknown) {
      logError(`Storage: Failed to check key ${key}`, error, "storage");
      return false;
    }
  },
};
export default StorageService;
