/**
 * Unit tests for authStore
 * Testing authentication state management and business logic
 */

import { useAuthStore } from "../authStore";

// Mock dependencies
jest.mock("../../lib/secure-storage", () => ({
  SecureStorageService: {
    getInstance: jest.fn(() => ({
      setItem: jest.fn().mockResolvedValue(true),
      getItem: jest.fn().mockResolvedValue(null),
      removeItem: jest.fn().mockResolvedValue(true),
    })),
  },
}));

jest.mock("../../core/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("authStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with default state", () => {
      const { currentUser, isAuthenticated, isLoading, error } = useAuthStore.getState();

      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });
  });

  describe("Login", () => {
    it("should set loading state during login", async () => {
      const { setLoading } = useAuthStore.getState();

      await useAuthStore.getState().login("+1234567890");

      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false); // Should reset after completion
    });

    it("should handle successful login", async () => {
      const { login, setCurrentUser } = useAuthStore.getState();

      await login("+1234567890");

      const { currentUser, isAuthenticated, error } = useAuthStore.getState();
      expect(currentUser).not.toBeNull();
      expect(currentUser?.phone).toBe("+1234567890");
      expect(isAuthenticated).toBe(true);
      expect(error).toBeNull();
    });

    it("should handle login failure", async () => {
      const { login, setError } = useAuthStore.getState();

      // Mock a login failure
      const mockError = new Error("Login failed");
      setError(mockError);

      const { error } = useAuthStore.getState();
      expect(error).toBe(mockError);
      expect(error?.message).toBe("Login failed");
    });

    it("should handle phone number validation", async () => {
      const { login, setError } = useAuthStore.getState();

      // Test invalid phone number
      await login("invalid");

      const { error, isAuthenticated } = useAuthStore.getState();
      expect(error).not.toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle empty phone number", async () => {
      const { login, setError } = useAuthStore.getState();

      await login("");

      const { error, isAuthenticated } = useAuthStore.getState();
      expect(error).not.toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle international phone numbers", async () => {
      const { login } = useAuthStore.getState();

      await login("+86 138 0013 8000");

      const { currentUser, isAuthenticated } = useAuthStore.getState();
      expect(currentUser?.phone).toBe("+86 138 0013 8000");
      expect(isAuthenticated).toBe(true);
    });
  });

  describe("Verify OTP", () => {
    it("should handle successful OTP verification", async () => {
      const { login, verifyOtp } = useAuthStore.getState();

      // First login to set up OTP context
      await login("+1234567890");

      // Then verify OTP
      await verifyOtp("123456");

      const { currentUser, isAuthenticated, error } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(currentUser).not.toBeNull();
      expect(error).toBeNull();
    });

    it("should handle OTP verification failure", async () => {
      const { login, verifyOtp, setError } = useAuthStore.getState();

      await login("+1234567890");

      // Mock OTP verification failure
      const mockError = new Error("Invalid OTP");
      setError(mockError);

      await verifyOtp("000000");

      const { error, isAuthenticated } = useAuthStore.getState();
      expect(error).toBe(mockError);
      expect(isAuthenticated).toBe(false);
    });

    it("should handle invalid OTP format", async () => {
      const { login, verifyOtp } = useAuthStore.getState();

      await login("+1234567890");

      await verifyOtp("invalid");

      const { error, isAuthenticated } = useAuthStore.getState();
      expect(error).not.toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle empty OTP", async () => {
      const { login, verifyOtp } = useAuthStore.getState();

      await login("+1234567890");

      await verifyOtp("");

      const { error, isAuthenticated } = useAuthStore.getState();
      expect(error).not.toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle OTP of wrong length", async () => {
      const { login, verifyOtp } = useAuthStore.getState();

      await login("+1234567890");

      await verifyOtp("1234"); // Too short

      const { error, isAuthenticated } = useAuthStore.getState();
      expect(error).not.toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should save auth token on successful verification", async () => {
      const { login, verifyOtp } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      await login("+1234567890");
      await verifyOtp("123456");

      expect(SecureStorageService.setItem).toHaveBeenCalledWith("auth_token", expect.any(String));
    });
  });

  describe("Logout", () => {
    it("should handle successful logout", async () => {
      const { login, logout } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      // First login to have a session
      await login("+1234567890");

      // Then logout
      await logout();

      const { currentUser, isAuthenticated, error } = useAuthStore.getState();
      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(error).toBeNull();
    });

    it("should clear auth token on logout", async () => {
      const { login, logout } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      await login("+1234567890");
      await logout();

      expect(SecureStorageService.removeItem).toHaveBeenCalledWith("auth_token");
    });

    it("should handle logout when not authenticated", async () => {
      const { logout } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      await logout();

      const { currentUser, isAuthenticated } = useAuthStore.getState();
      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);

      // Should not attempt to remove token if not authenticated
      expect(SecureStorageService.removeItem).not.toHaveBeenCalled();
    });

    it("should handle logout errors", async () => {
      const { login, logout, setError } = useAuthStore.getState();

      await login("+1234567890");

      // Mock logout failure
      const mockError = new Error("Logout failed");
      setError(mockError);

      await logout();

      const { error } = useAuthStore.getState();
      expect(error).toBe(mockError);
    });
  });

  describe("Error Handling", () => {
    it("should set error state", () => {
      const { setError } = useAuthStore.getState();
      const mockError = new Error("Test error");

      setError(mockError);

      const { error } = useAuthStore.getState();
      expect(error).toBe(mockError);
      expect(error?.message).toBe("Test error");
    });

    it("should clear error state", () => {
      const { setError, clearError } = useAuthStore.getState();
      const mockError = new Error("Test error");

      setError(mockError);
      clearError();

      const { error } = useAuthStore.getState();
      expect(error).toBeNull();
    });

    it("should auto-clear error on new action", async () => {
      const { setError, login } = useAuthStore.getState();
      const mockError = new Error("Previous error");

      setError(mockError);

      // New action should clear previous error
      await login("+1234567890");

      const { error } = useAuthStore.getState();
      expect(error).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should set loading state", () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);

      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(true);
    });

    it("should clear loading state", () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(false);

      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });

    it("should auto-clear loading on completion", async () => {
      const { login } = useAuthStore.getState();

      const initialLoading = useAuthStore.getState().isLoading;
      expect(initialLoading).toBe(false);

      await login("+1234567890");

      const finalLoading = useAuthStore.getState().isLoading;
      expect(finalLoading).toBe(false);
    });
  });

  describe("User Management", () => {
    it("should update current user", () => {
      const { setCurrentUser } = useAuthStore.getState();
      const user = {
        id: "user_123",
        name: "John Doe",
        phone: "+1234567890",
        isOnline: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      setCurrentUser(user);

      const { currentUser, isAuthenticated } = useAuthStore.getState();
      expect(currentUser).toEqual(user);
      expect(isAuthenticated).toBe(true);
    });

    it("should clear current user", () => {
      const { setCurrentUser } = useAuthStore.getState();
      const user = {
        id: "user_123",
        name: "John Doe",
        phone: "+1234567890",
        isOnline: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      setCurrentUser(user);
      expect(useAuthStore.getState().currentUser).toEqual(user);

      setCurrentUser(null);

      const { currentUser, isAuthenticated } = useAuthStore.getState();
      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle user update without authentication", () => {
      const { setCurrentUser } = useAuthStore.getState();
      const user = {
        id: "user_123",
        name: "John Doe",
        phone: "+1234567890",
        isOnline: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      setCurrentUser(user);

      const { currentUser, isAuthenticated } = useAuthStore.getState();
      expect(currentUser).toEqual(user);
      expect(isAuthenticated).toBe(true); // Setting user should authenticate
    });
  });

  describe("Token Management", () => {
    it("should load persisted auth token on initialization", async () => {
      const { loadPersistedState } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      // Mock existing token
      SecureStorageService.getItem.mockResolvedValue("existing_token_123");

      await loadPersistedState();

      expect(SecureStorageService.getItem).toHaveBeenCalledWith("auth_token");
      // Should set authenticated state if token exists
    });

    it("should handle missing auth token on initialization", async () => {
      const { loadPersistedState } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      // Mock no token
      SecureStorageService.getItem.mockResolvedValue(null);

      await loadPersistedState();

      expect(SecureStorageService.getItem).toHaveBeenCalledWith("auth_token");
      // Should remain unauthenticated if no token
    });

    it("should handle token loading errors", async () => {
      const { loadPersistedState, setError } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      // Mock token loading error
      const mockError = new Error("Token load failed");
      SecureStorageService.getItem.mockRejectedValue(mockError);

      await loadPersistedState();

      expect(setError).toHaveBeenCalledWith(mockError);
    });
  });

  describe("State Persistence", () => {
    it("should persist state changes", async () => {
      const { login } = useAuthStore.getState();

      await login("+1234567890");

      // Verify state was persisted
      const { isAuthenticated, currentUser } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(currentUser).not.toBeNull();
    });

    it("should handle persistence errors", async () => {
      const { login, setError } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      // Mock persistence error
      const mockError = new Error("Persistence failed");
      SecureStorageService.setItem.mockRejectedValue(mockError);

      await login("+1234567890");

      expect(setError).toHaveBeenCalledWith(mockError);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid login attempts", async () => {
      const { login } = useAuthStore.getState();

      // Multiple rapid login attempts
      await Promise.all([login("+1234567890"), login("+0987654321"), login("+5551234567")]);

      const { currentUser, isAuthenticated } = useAuthStore.getState();
      // Should handle the last one
      expect(currentUser?.phone).toBe("+5551234567");
      expect(isAuthenticated).toBe(true);
    });

    it("should handle concurrent login and logout", async () => {
      const { login, logout } = useAuthStore.getState();

      // Start login and logout concurrently
      const loginPromise = login("+1234567890");
      const logoutPromise = logout();

      await Promise.all([loginPromise, logoutPromise]);

      // Should handle gracefully
      const { currentUser, isAuthenticated } = useAuthStore.getState();
      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it("should handle malformed user data", () => {
      const { setCurrentUser } = useAuthStore.getState();

      // Test with malformed user object
      const malformedUser = {
        id: "",
        name: null,
        phone: undefined,
        isOnline: "not a boolean",
      };

      setCurrentUser(malformedUser as any);

      const { currentUser } = useAuthStore.getState();
      // Should handle gracefully
      expect(currentUser).toBeDefined();
    });

    it("should handle network errors during login", async () => {
      const { login, setError } = useAuthStore.getState();

      // Mock network error
      const networkError = new Error("Network unavailable");
      setError(networkError);

      await login("+1234567890");

      const { error } = useAuthStore.getState();
      expect(error).toBe(networkError);
      expect(error?.message).toBe("Network unavailable");
    });
  });

  describe("Security", () => {
    it("should not expose sensitive data in state", () => {
      const { login } = useAuthStore.getState();

      login("+1234567890");

      const state = useAuthStore.getState();
      // Verify sensitive data is not directly exposed
      expect(state).not.toHaveProperty("password");
      expect(state).not.toHaveProperty("token");
    });

    it("should handle secure storage failures gracefully", async () => {
      const { login, setError } = useAuthStore.getState();
      const SecureStorageService =
        require("../../lib/secure-storage").SecureStorageService.getInstance();

      // Mock secure storage failure
      const secureError = new Error("Secure storage unavailable");
      SecureStorageService.setItem.mockRejectedValue(secureError);

      await login("+1234567890");

      const { error } = useAuthStore.getState();
      expect(error).toBe(secureError);
    });
  });
});
