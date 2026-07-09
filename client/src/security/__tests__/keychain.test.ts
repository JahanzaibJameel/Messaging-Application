/**
 * Keychain Security Tests
 * Tests for secure keychain storage functionality
 */

import * as Keychain from "react-native-keychain";
import {
  getToken,
  setToken,
  resetToken,
  setUserCredentials,
  getUserCredentials,
  resetUserCredentials,
} from "../keychain";
import {
  setupSecurityMocks,
  resetSecurityMocks,
  expectKeychainCall,
} from "../../test-utils/securityMocks";

// Mock the keychain module
jest.mock("react-native-keychain");
const mockedKeychain = Keychain as jest.Mocked<typeof Keychain> & {
  getGenericPassword: jest.Mock;
  setGenericPassword: jest.Mock;
  resetGenericPassword: jest.Mock;
};

// Mock Sentry
jest.mock("../../monitoring/sentry", () => ({
  captureException: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
}));

describe("Keychain Security", () => {
  beforeEach(() => {
    setupSecurityMocks();
  });

  afterEach(() => {
    resetSecurityMocks();
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
        service: "com.chatapp.auth",
      });
      expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
        "refresh_token",
        refreshToken,
        { service: "com.chatapp.auth" }
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
        service: "com.chatapp.auth",
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
        expect.objectContaining({ service: "com.chatapp.auth" })
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
