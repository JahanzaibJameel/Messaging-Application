/**
 * Keychain Security Tests
 * Tests for secure keychain storage functionality
 */

import {
  getToken,
  setToken,
  resetToken,
  setUserCredentials,
  getUserCredentials,
  resetUserCredentials,
} from "../keychain";
import {
  authenticateAppLock,
  disableAppLock,
  enableAppLock,
  getAppLockEnabled,
  getAppLockType,
  isAppLockAvailable,
} from "../biometricAuth";

// Inline keychain mock (avoids stale moduleNameMapper transform caching)
const getGenericPassword = jest.fn();
const setGenericPassword = jest.fn();
const resetGenericPassword = jest.fn();
const hasGenericPassword = jest.fn();
const canImplyAuthentication = jest.fn();
const isPasscodeAuthAvailable = jest.fn();
const getSupportedBiometryType = jest.fn();

jest.mock("../secureStorage", () => ({
  secureGetJSON: jest.fn(),
  secureSetJSON: jest.fn(),
}));
const {
  secureGetJSON: mockSecureGetJSON,
  secureSetJSON: mockSecureSetJSON,
} = jest.requireMock("../secureStorage") as {
  secureGetJSON: jest.Mock;
  secureSetJSON: jest.Mock;
};

jest.mock("react-native-keychain", () => {
  const ggp = jest.fn();
  const sgp = jest.fn();
  const rgp = jest.fn();
  const hgp = jest.fn();
  const cia = jest.fn();
  const ipa = jest.fn();
  const gbt = jest.fn();
  return {
    __esModule: true,
    default: {
      getGenericPassword: ggp,
      setGenericPassword: sgp,
      resetGenericPassword: rgp,
      hasGenericPassword: hgp,
      canImplyAuthentication: cia,
      isPasscodeAuthAvailable: ipa,
      getSupportedBiometryType: gbt,
    },
    getGenericPassword: ggp,
    setGenericPassword: sgp,
    resetGenericPassword: rgp,
    hasGenericPassword: hgp,
    canImplyAuthentication: cia,
    isPasscodeAuthAvailable: ipa,
    getSupportedBiometryType: gbt,
    ACCESS_CONTROL: {
      BIOMETRY_ANY_OR_DEVICE_PASSCODE: "BiometryAnyOrDevicePasscode",
    },
    AUTHENTICATION_TYPE: {
      DEVICE_PASSCODE_OR_BIOMETRICS: "DevicePasscodeOrBiometrics",
    },
    BIOMETRY_TYPE: {
      FACE_ID: "FaceID",
      FINGERPRINT: "Fingerprint",
      IRIS: "Iris",
    },
    ACCESSIBLE: {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: "AccessibleWhenUnlockedThisDeviceOnly",
    },
    STORAGE_TYPE: {
      AES_GCM: "KeystoreAESGCM",
    },
  };
});

const mockedKeychain = jest.requireMock("react-native-keychain") as {
  getGenericPassword: jest.Mock;
  setGenericPassword: jest.Mock;
  resetGenericPassword: jest.Mock;
  hasGenericPassword: jest.Mock;
  canImplyAuthentication: jest.Mock;
  isPasscodeAuthAvailable: jest.Mock;
  getSupportedBiometryType: jest.Mock;
};
void getGenericPassword;
void setGenericPassword;
void resetGenericPassword;

// Mock Sentry
jest.mock("../../monitoring/sentry", () => ({
  captureException: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
}));

describe("Keychain Security", () => {
  afterEach(() => {
    const kc = jest.requireMock("react-native-keychain") as Record<string, jest.Mock>;
    kc.getGenericPassword?.mockReset();
    kc.setGenericPassword?.mockReset();
    kc.resetGenericPassword?.mockReset();
    kc.hasGenericPassword?.mockReset();
    kc.canImplyAuthentication?.mockReset();
    kc.isPasscodeAuthAvailable?.mockReset();
    kc.getSupportedBiometryType?.mockReset();
    mockSecureGetJSON.mockReset();
    mockSecureSetJSON.mockReset();
  });

  describe("Token Management", () => {
    it("should get authentication tokens successfully", async () => {
      // Arrange
      const mockTokens = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      };

      mockedKeychain.getGenericPassword
        .mockResolvedValueOnce({ username: "access_token", password: mockTokens.accessToken })
        .mockResolvedValueOnce({ username: "refresh_token", password: mockTokens.refreshToken });

      // Act
      const result = await getToken();

      // Assert
      expect(result).toEqual(mockTokens);
      expect(mockedKeychain.getGenericPassword).toHaveBeenCalledTimes(2);
    });

    it("should handle missing tokens gracefully", async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      // Act
      const result = await getToken();

      // Assert
      expect(result).toEqual({ accessToken: null, refreshToken: null });
    });

    it("should set authentication tokens successfully", async () => {
      // Arrange
      const accessToken = "new-access-token";
      const refreshToken = "new-refresh-token";

      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const result = await setToken(accessToken, refreshToken);

      // Assert
      expect(result).toBe(true);
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith("access_token", accessToken, {
        service: "access_token",
      });
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        "refresh_token",
        refreshToken,
        { service: "refresh_token" }
      );
    });

    it("should set access token without refresh token", async () => {
      // Arrange
      const accessToken = "access-token-only";
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const result = await setToken(accessToken);

      // Assert
      expect(result).toBe(true);
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1);
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith("access_token", accessToken, {
        service: "access_token",
      });
    });

    it("should reset authentication tokens successfully", async () => {
      // Arrange
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      const result = await resetToken();

      // Assert
      expect(result).toBe(true);
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledTimes(2);
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: "access_token",
      });
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: "refresh_token",
      });
    });

    it("should handle keychain errors gracefully", async () => {
      // Arrange
      const error = new Error("Keychain access denied");
      mockedKeychain.getGenericPassword.mockRejectedValue(error);

      // Act
      const result = await getToken();

      // Assert
      expect(result).toEqual({ accessToken: null, refreshToken: null });
    });
  });

  describe("User Credentials Management", () => {
    it("should store user credentials successfully", async () => {
      // Arrange
      const credentials = {
        userId: "user-123",
        email: "test@example.com",
        username: "testuser",
      };

      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const result = await setUserCredentials(credentials);

      // Assert
      expect(result).toBe(true);
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        "user_credentials",
        JSON.stringify(credentials),
        { service: "com.chatapp.auth" }
      );
    });

    it("should retrieve user credentials successfully", async () => {
      // Arrange
      const credentials = {
        userId: "user-123",
        email: "test@example.com",
        username: "testuser",
      };

      mockedKeychain.getGenericPassword.mockResolvedValue({
        username: "user_credentials",
        password: JSON.stringify(credentials),
      });

      // Act
      const result = await getUserCredentials();

      // Assert
      expect(result).toEqual(credentials);
    });

    it("should handle missing credentials gracefully", async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      // Act
      const result = await getUserCredentials();

      // Assert
      expect(result).toBeNull();
    });

    it("should handle malformed credentials data", async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue({
        username: "user_credentials",
        password: "invalid-json-data",
      });

      // Act
      const result = await getUserCredentials();

      // Assert
      expect(result).toBeNull();
    });

    it("should reset user credentials successfully", async () => {
      // Arrange
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);

      // Act
      const result = await resetUserCredentials();

      // Assert
      expect(result).toBe(true);
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: "com.chatapp.auth",
      });
    });
  });

  describe("Security Considerations", () => {
    it("should use correct service identifier", async () => {
      // Arrange
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      await setToken("test-token");

      // Assert
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ service: "access_token" })
      );
    });

    it("should handle concurrent operations", async () => {
      // Arrange
      mockedKeychain.getGenericPassword.mockResolvedValue({
        username: "access_token",
        password: "concurrent-token",
      });

      // Act
      const [result1, result2] = await Promise.all([getToken(), getToken()]);

      // Assert
      expect(result1).toEqual({ accessToken: "concurrent-token", refreshToken: null });
      expect(result2).toEqual({ accessToken: "concurrent-token", refreshToken: null });
    });

    it("should validate credential structure", async () => {
      // Arrange
      const invalidCredentials = { userId: "test" }; // Missing required fields
      mockedKeychain.setGenericPassword.mockResolvedValue(true);

      // Act
      const result = await setUserCredentials(invalidCredentials as any);

      // Assert
      expect(result).toBe(true); // Should still store, validation happens at usage
    });
  });

  describe("App Lock", () => {
    it("authenticates with the app-lock credential", async () => {
      mockedKeychain.getGenericPassword.mockResolvedValue({
        username: "app-lock",
        password: "enabled",
      });

      await expect(authenticateAppLock()).resolves.toBe(true);
      expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          service: "com.chatapp.app-lock",
          accessControl: "BiometryAnyOrDevicePasscode",
        })
      );
    });

    it("rejects an invalid app-lock credential", async () => {
      mockedKeychain.getGenericPassword.mockResolvedValue({
        username: "app-lock",
        password: "invalid",
      });

      await expect(authenticateAppLock()).resolves.toBe(false);
    });

    it("enables app lock only when biometric authentication is available", async () => {
      mockedKeychain.canImplyAuthentication.mockResolvedValue(true);
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);
      mockedKeychain.setGenericPassword.mockResolvedValue(true);
      mockSecureSetJSON.mockResolvedValue(undefined);
      await expect(enableAppLock()).resolves.toBe(true);
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        "app-lock",
        "enabled",
        expect.objectContaining({
          service: "com.chatapp.app-lock",
          accessControl: "BiometryAnyOrDevicePasscode",
          storage: "KeystoreAESGCM",
        })
      );
      expect(mockSecureSetJSON).toHaveBeenCalledWith("app_lock_enabled", true);
    });

    it("does not enable app lock when authentication is unavailable", async () => {
      mockedKeychain.canImplyAuthentication.mockResolvedValue(false);

      await expect(enableAppLock()).resolves.toBe(false);
      expect(mockedKeychain.setGenericPassword).not.toHaveBeenCalled();
    });

    it("requires authentication before disabling app lock", async () => {
      mockedKeychain.hasGenericPassword.mockResolvedValue(true);
      mockedKeychain.getGenericPassword.mockResolvedValue({
        username: "app-lock",
        password: "enabled",
      });
      mockedKeychain.resetGenericPassword.mockResolvedValue(true);
      mockSecureSetJSON.mockResolvedValue(undefined);

      await expect(disableAppLock()).resolves.toBe(true);
      expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
        service: "com.chatapp.app-lock",
      });
      expect(mockSecureSetJSON).toHaveBeenCalledWith("app_lock_enabled", false);
    });

    it("does not disable app lock when authentication fails", async () => {
      mockedKeychain.hasGenericPassword.mockResolvedValue(true);
      mockedKeychain.getGenericPassword.mockResolvedValue(false);

      await expect(disableAppLock()).resolves.toBe(false);
      expect(mockedKeychain.resetGenericPassword).not.toHaveBeenCalled();
      expect(mockSecureSetJSON).not.toHaveBeenCalled();
    });

    it("reads the app-lock preference from encrypted storage", async () => {
      mockSecureGetJSON.mockResolvedValue(true);

      await expect(getAppLockEnabled()).resolves.toBe(true);
      expect(mockSecureGetJSON).toHaveBeenCalledWith("app_lock_enabled");
    });

    it("reports the enrolled biometry type", async () => {
      mockedKeychain.getSupportedBiometryType.mockResolvedValue("FaceID");

      await expect(getAppLockType()).resolves.toBe("FaceID");
    });
  });

  describe("Error Handling", () => {
    it("should handle set token errors", async () => {
      // Arrange
      const error = new Error("Storage full");
      mockedKeychain.setGenericPassword.mockRejectedValue(error);

      // Act
      const result = await setToken("test-token");

      // Assert
      expect(result).toBe(false);
    });

    it("should handle reset token errors", async () => {
      // Arrange
      const error = new Error("Permission denied");
      mockedKeychain.resetGenericPassword.mockRejectedValue(error);

      // Act
      const result = await resetToken();

      // Assert
      expect(result).toBe(false);
    });

    it("should handle user credentials errors", async () => {
      // Arrange
      const error = new Error("Corrupted data");
      mockedKeychain.setGenericPassword.mockRejectedValue(error);

      // Act
      const result = await setUserCredentials({ userId: "test" });

      // Assert
      expect(result).toBe(false);
    });
  });
});
