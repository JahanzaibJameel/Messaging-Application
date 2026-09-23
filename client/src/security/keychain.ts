/**
 * Secure Keychain Storage
 * Handles secure storage of authentication tokens and sensitive data
 */

import * as Keychain from "react-native-keychain";
import { Platform } from "react-native";
import { captureException, addUserActionBreadcrumb } from "../monitoring/sentry";

const KEYCHAIN_SERVICE = "com.chatapp.auth";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_CREDENTIALS_KEY = "user_credentials";

interface KeyValueStorage {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
}

const webStorage: KeyValueStorage = {
  get: (key: string) => localStorage.getItem(`keychain_${key}`),
  set: (key: string, value: string) => localStorage.setItem(`keychain_${key}`, value),
  remove: (key: string) => localStorage.removeItem(`keychain_${key}`),
};

function isWeb(): boolean {
  return Platform.OS === "web";
}

/**
 * Secure token storage interface
 */
export interface TokenStorage {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * User credentials interface
 */
export interface UserCredentials {
  userId: string;
  email?: string;
  username?: string;
}

/**
 * Get authentication tokens from secure storage
 * Returns both accessToken and refreshToken in a single keychain operation
 */
export const getToken = async (): Promise<TokenStorage> => {
  if (isWeb()) {
    const accessToken = webStorage.get(ACCESS_TOKEN_KEY);
    const refreshToken = webStorage.get(REFRESH_TOKEN_KEY);
    return {
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
    };
  }
  try {
    addUserActionBreadcrumb("keychain_get_token_attempt");

    const [accessResult, refreshResult] = await Promise.all([
      Keychain.getGenericPassword({
        service: ACCESS_TOKEN_KEY,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      }),
      Keychain.getGenericPassword({
        service: REFRESH_TOKEN_KEY,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      }),
    ]);

    const result: TokenStorage = {
      accessToken:
        accessResult && accessResult.username === ACCESS_TOKEN_KEY ? accessResult.password : null,
      refreshToken:
        refreshResult && refreshResult.username === REFRESH_TOKEN_KEY
          ? refreshResult.password
          : null,
    };

    addUserActionBreadcrumb("keychain_get_token_success", {
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken,
    });

    return result;
  } catch (error) {
    addUserActionBreadcrumb("keychain_get_token_error", {
      error: (error as Error).message,
    });

    captureException(error as Error, {
      action: "keychain_get_token",
      screen: "security_module",
      additionalData: { service: KEYCHAIN_SERVICE },
    });

    return { accessToken: null, refreshToken: null };
  }
};

/**
 * Set authentication tokens in secure storage
 */
export const setToken = async (accessToken: string, refreshToken?: string): Promise<boolean> => {
  if (isWeb()) {
    try {
      webStorage.set(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        webStorage.set(REFRESH_TOKEN_KEY, refreshToken);
      }
      return true;
    } catch (error) {
      console.error("[Keychain Web] Failed to set token:", error);
      return false;
    }
  }
  try {
    addUserActionBreadcrumb("keychain_set_token_attempt", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    const accessResult = await Keychain.setGenericPassword(ACCESS_TOKEN_KEY, accessToken, {
      service: ACCESS_TOKEN_KEY,
    });

    let refreshResult: unknown = true;
    if (refreshToken) {
      refreshResult = await Keychain.setGenericPassword(REFRESH_TOKEN_KEY, refreshToken, {
        service: REFRESH_TOKEN_KEY,
      });
    }

    const success = !!accessResult && !!refreshResult;

    if (success) {
      addUserActionBreadcrumb("keychain_set_token_success");
    } else {
      addUserActionBreadcrumb("keychain_set_token_partial_failure", {
        accessResult,
        refreshResult,
      });
    }

    return success;
  } catch (error) {
    addUserActionBreadcrumb("keychain_set_token_error", {
      error: (error as Error).message,
    });

    captureException(error as Error, {
      action: "keychain_set_token",
      screen: "security_module",
      additionalData: { service: KEYCHAIN_SERVICE },
    });

    return false;
  }
};

/**
 * Reset/remove all authentication tokens from secure storage
 */
export const resetToken = async (): Promise<boolean> => {
  if (isWeb()) {
    try {
      webStorage.remove(ACCESS_TOKEN_KEY);
      webStorage.remove(REFRESH_TOKEN_KEY);
      return true;
    } catch (error) {
      console.error("[Keychain Web] Failed to reset token:", error);
      return false;
    }
  }
  try {
    addUserActionBreadcrumb("keychain_reset_token_attempt");

    const [accessResult, refreshResult] = await Promise.all([
      Keychain.resetGenericPassword({ service: ACCESS_TOKEN_KEY }),
      Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY }),
    ]);

    const success = !!accessResult && !!refreshResult;

    if (success) {
      addUserActionBreadcrumb("keychain_reset_token_success");
    } else {
      addUserActionBreadcrumb("keychain_reset_token_partial_failure", {
        accessResult,
        refreshResult,
      });
    }

    return success;
  } catch (error) {
    addUserActionBreadcrumb("keychain_reset_token_error", {
      error: (error as Error).message,
    });

    captureException(error as Error, {
      action: "keychain_reset_token",
      screen: "security_module",
      additionalData: { service: KEYCHAIN_SERVICE },
    });

    return false;
  }
};

/**
 * Store user credentials securely
 */
export const setUserCredentials = async (credentials: UserCredentials): Promise<boolean> => {
  if (isWeb()) {
    try {
      webStorage.set(USER_CREDENTIALS_KEY, JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error("[Keychain Web] Failed to set credentials:", error);
      return false;
    }
  }
  try {
    addUserActionBreadcrumb("keychain_set_credentials_attempt", {
      userId: credentials.userId,
      hasEmail: !!credentials.email,
      hasUsername: !!credentials.username,
    });

    const result = await Keychain.setGenericPassword(
      USER_CREDENTIALS_KEY,
      JSON.stringify(credentials),
      { service: KEYCHAIN_SERVICE }
    );

    const success = !!result;

    if (result) {
      addUserActionBreadcrumb("keychain_set_credentials_success");
    } else {
      addUserActionBreadcrumb("keychain_set_credentials_failure");
    }

    return success;
  } catch (error) {
    addUserActionBreadcrumb("keychain_set_credentials_error", {
      error: (error as Error).message,
    });

    captureException(error as Error, {
      action: "keychain_set_credentials",
      screen: "security_module",
      additionalData: { userId: credentials.userId },
    });

    return false;
  }
};

/**
 * Get user credentials from secure storage
 */
export const getUserCredentials = async (): Promise<UserCredentials | null> => {
  if (isWeb()) {
    try {
      const stored = webStorage.get(USER_CREDENTIALS_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as UserCredentials;
    } catch {
      return null;
    }
  }
  try {
    addUserActionBreadcrumb("keychain_get_credentials_attempt");

    const result = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    if (result && result.username === USER_CREDENTIALS_KEY && result.password) {
      try {
        const credentials = JSON.parse(result.password) as UserCredentials;
        addUserActionBreadcrumb("keychain_get_credentials_success", {
          userId: credentials.userId,
        });
        return credentials;
      } catch (parseError) {
        addUserActionBreadcrumb("keychain_get_credentials_parse_error", {
          error: (parseError as Error).message,
        });
        return null;
      }
    }

    addUserActionBreadcrumb("keychain_get_credentials_not_found");
    return null;
  } catch (error) {
    addUserActionBreadcrumb("keychain_get_credentials_error", {
      error: (error as Error).message,
    });

    captureException(error as Error, {
      action: "keychain_get_credentials",
      screen: "security_module",
    });

    return null;
  }
};

/**
 * Reset user credentials from secure storage
 */
export const resetUserCredentials = async (): Promise<boolean> => {
  if (isWeb()) {
    try {
      webStorage.remove(USER_CREDENTIALS_KEY);
      return true;
    } catch (error) {
      console.error("[Keychain Web] Failed to reset credentials:", error);
      return false;
    }
  }
  try {
    addUserActionBreadcrumb("keychain_reset_credentials_attempt");

    const result = await Keychain.resetGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    const success = !!result;

    if (result) {
      addUserActionBreadcrumb("keychain_reset_credentials_success");
    } else {
      addUserActionBreadcrumb("keychain_reset_credentials_failure");
    }

    return success;
  } catch (error) {
    addUserActionBreadcrumb("keychain_reset_credentials_error", {
      error: (error as Error).message,
    });

    captureException(error as Error, {
      action: "keychain_reset_credentials",
      screen: "security_module",
    });

    return false;
  }
};

/**
 * Check if any authentication data exists in keychain
 */
export const hasAuthenticationData = async (): Promise<boolean> => {
  try {
    const tokens = await getToken();
    return !!(tokens.accessToken || tokens.refreshToken);
  } catch (error) {
    addUserActionBreadcrumb("keychain_has_auth_data_error", {
      error: (error as Error).message,
    });
    return false;
  }
};

/**
 * Clear all authentication data from keychain
 */
export const clearAllAuthenticationData = async (): Promise<boolean> => {
  try {
    addUserActionBreadcrumb("keychain_clear_all_attempt");

    const [tokenResult, credentialsResult] = await Promise.all([
      resetToken(),
      resetUserCredentials(),
    ]);

    const success = tokenResult && credentialsResult;

    if (success) {
      addUserActionBreadcrumb("keychain_clear_all_success");
    } else {
      addUserActionBreadcrumb("keychain_clear_all_partial_failure", {
        tokenResult,
        credentialsResult,
      });
    }

    return success;
  } catch (error) {
    addUserActionBreadcrumb("keychain_clear_all_error", {
      error: (error as Error).message,
    });

    captureException(error as Error, {
      action: "keychain_clear_all",
      screen: "security_module",
    });

    return false;
  }
};

export default {
  getToken,
  setToken,
  resetToken,
  setUserCredentials,
  getUserCredentials,
  resetUserCredentials,
  hasAuthenticationData,
  clearAllAuthenticationData,
};
