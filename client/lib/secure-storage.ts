/**
 * Secure Storage Service using react-native-keychain
 * For storing sensitive data like auth tokens, API keys, etc.
 */

import * as Keychain from "react-native-keychain";

export class SecureStorageService {
  private static instance: SecureStorageService;

  private constructor() {}

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Store sensitive data securely
   */
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      const options = {
        service: "chatapp_secure",
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      };

      await Keychain.setInternetCredentials(key, key, value, options);
      return true;
    } catch (error) {
      console.error("SecureStorage.setItem error:", error);
      return false;
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);

      if (credentials && typeof credentials !== "boolean") {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error("SecureStorage.getItem error:", error);
      return null;
    }
  }

  /**
   * Remove sensitive data securely
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials(key);
      return true;
    } catch (error) {
      console.error("SecureStorage.removeItem error:", error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometryAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error) {
      console.error("SecureStorage.isBiometryAvailable error:", error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  async getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    try {
      return await Keychain.getSupportedBiometryType();
    } catch (error) {
      console.error("SecureStorage.getBiometryType error:", error);
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
    } catch (error) {
      console.error("SecureStorage.getAuthToken parse error:", error);
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
    } catch (error) {
      console.error("SecureStorage.clearAll error:", error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorageService.getInstance();
