/**
 * Secure Storage Service using react-native-keychain
 * For storing sensitive data like auth tokens, API keys, etc.
 */

import * as Keychain from "react-native-keychain";
import { Platform } from "react-native";
import { error as logError } from "@/utils/logger";

const isWeb = Platform.OS === "web";

interface WebSecureStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => boolean;
  removeItem: (key: string) => boolean;
}

const webSecureStorage: WebSecureStorage = {
  getItem: (key: string) => localStorage.getItem(`secure_${key}`),
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(`secure_${key}`, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(`secure_${key}`);
      return true;
    } catch {
      return false;
    }
  },
};

export class SecureStorageService {
  private static instance: SecureStorageService;

  private constructor() {
    // Private constructor for singleton pattern - use getInstance() instead
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  async setItem(key: string, value: string): Promise<boolean> {
    if (isWeb) {
      return webSecureStorage.setItem(key, value);
    }
    try {
      const options = {
        service: "chatapp_secure",
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      };

      await Keychain.setInternetCredentials(key, key, value, options);
      return true;
    } catch (error: unknown) {
      logError("SecureStorage.setItem error", error, "secure_storage");
      return false;
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      return webSecureStorage.getItem(key);
    }
    try {
      const credentials = await Keychain.getInternetCredentials(key);

      if (credentials && typeof credentials !== "boolean") {
        return credentials.password;
      }
      return null;
    } catch (error: unknown) {
      logError("SecureStorage.getItem error", error, "secure_storage");
      return null;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    if (isWeb) {
      return webSecureStorage.removeItem(key);
    }
    try {
      await Keychain.resetInternetCredentials({ server: key });
      return true;
    } catch (error: unknown) {
      logError("SecureStorage.removeItem error", error, "secure_storage");
      return false;
    }
  }

  async isBiometryAvailable(): Promise<boolean> {
    if (isWeb) return false;
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error: unknown) {
      logError("SecureStorage.isBiometryAvailable error", error, "secure_storage");
      return false;
    }
  }

  async getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    if (isWeb) return null;
    try {
      return await Keychain.getSupportedBiometryType();
    } catch (error: unknown) {
      logError("SecureStorage.getBiometryType error", error, "secure_storage");
      return null;
    }
  }

  /**
   * Store authentication token with enhanced security
   */
  async setAuthToken(token: string, userId: string): Promise<boolean> {
    const authData = {
      token,
      userId,
      timestamp: Date.now(),
    };
    return this.setItem("auth_token", JSON.stringify(authData));
  }

  /**
   * Retrieve authentication token
   */
  async getAuthToken(): Promise<{ token: string; userId: string; timestamp: number } | null> {
    const authData = await this.getItem("auth_token");
    if (!authData) return null;

    try {
      return JSON.parse(authData);
    } catch (error: unknown) {
      logError("SecureStorage.getAuthToken parse error", error, "secure_storage");
      return null;
    }
  }

  /**
   * Remove authentication token
   */
  async removeAuthToken(): Promise<boolean> {
    return this.removeItem("auth_token");
  }

  /**
   * Store refresh token
   */
  async setRefreshToken(token: string): Promise<boolean> {
    return this.setItem("refresh_token", token);
  }

  /**
   * Retrieve refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return this.getItem("refresh_token");
  }

  /**
   * Remove refresh token
   */
  async removeRefreshToken(): Promise<boolean> {
    return this.removeItem("refresh_token");
  }

  /**
   * Store API key
   */
  async setApiKey(key: string, value: string): Promise<boolean> {
    return this.setItem(`api_key_${key}`, value);
  }

  /**
   * Retrieve API key
   */
  async getApiKey(key: string): Promise<string | null> {
    return this.getItem(`api_key_${key}`);
  }

  /**
   * Remove API key
   */
  async removeApiKey(key: string): Promise<boolean> {
    return this.removeItem(`api_key_${key}`);
  }

  /**
   * Clear all secure storage data
   */
  async clearAll(): Promise<boolean> {
    try {
      // Remove all known keys
      const keys = [
        "auth_token",
        "refresh_token",
        "user_credentials",
        "api_key_sentry",
        "api_key_analytics",
      ];

      for (const key of keys) {
        await this.removeItem(key);
      }

      return true;
    } catch (error: unknown) {
      logError("SecureStorage.clearAll error", error, "secure_storage");
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorageService.getInstance();
