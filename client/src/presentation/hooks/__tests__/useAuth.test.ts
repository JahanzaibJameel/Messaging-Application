/**
 * Unit tests for useAuth hook
 * Tests authentication hook business logic against the real implementation,
 * which delegates to userRepository and the presentation stores.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useAuth } from "../useAuth";
import { UserEntity } from "../../../domain/entities/User";

// Mock the presentation stores barrel used by the hook
const mockSetUser = jest.fn();
const mockStoreLogout = jest.fn();
const mockShowToast = jest.fn();

jest.mock("../../stores", () => ({
  useAuthStore: jest.fn(() => ({
    currentUser: null,
    setUser: mockSetUser,
    logout: mockStoreLogout,
  })),
  useUIStore: jest.fn(() => ({
    showToast: mockShowToast,
  })),
}));

// Mock the repositories barrel used by the hook
const mockLogin = jest.fn();
const mockVerifyOtp = jest.fn();
const mockRepoLogout = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockUpdateProfile = jest.fn();
const mockIsAuthenticated = jest.fn();

jest.mock("../../../data/repositories", () => ({
  userRepository: {
    login: (...args: unknown[]) => mockLogin(...args),
    verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    logout: (...args: unknown[]) => mockRepoLogout(...args),
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    isAuthenticated: (...args: unknown[]) => mockIsAuthenticated(...args),
  },
}));

jest.mock("../../../core/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: "user_123",
    name: "John Doe",
    phone: "+1234567890",
    avatar: "",
    status: "available",
    lastSeen: new Date(),
    isOnline: true,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    ...overrides,
  } as UserEntity;
}

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Restore pristine store defaults (mock return values persist across tests)
    const { useAuthStore, useUIStore } = require("../../stores");
    (useAuthStore as jest.Mock).mockImplementation(() => ({
      currentUser: null,
      setUser: mockSetUser,
      logout: mockStoreLogout,
    }));
    (useUIStore as jest.Mock).mockImplementation(() => ({
      showToast: mockShowToast,
    }));
  });

  describe("Initial State", () => {
    it("exposes loading, error and step defaults plus store-derived auth state", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.step).toBe("phone");
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("reflects the current user from the store", () => {
      const { useAuthStore } = require("../../stores");
      const user = makeUser();
      (useAuthStore as jest.Mock).mockReturnValue({
        currentUser: user,
        setUser: mockSetUser,
        logout: mockStoreLogout,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.currentUser).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("Request OTP", () => {
    it("sends a normalized phone number and moves to the OTP step", async () => {
      mockLogin.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());
      let ok = false;
      await act(async () => {
        ok = await result.current.requestOtp("+1 (234) 567-8901");
      });

      expect(ok).toBe(true);
      expect(mockLogin).toHaveBeenCalledWith("+12345678901");
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
      expect(result.current.step).toBe("otp");
    });

    it("rejects phone numbers shorter than 10 digits without calling the repository", async () => {
      const { result } = renderHook(() => useAuth());
      let ok = true;
      await act(async () => {
        ok = await result.current.requestOtp("12345");
      });

      expect(ok).toBe(false);
      expect(mockLogin).not.toHaveBeenCalled();
      expect(result.current.error).toBe("Please enter a valid phone number");
    });

    it("surfaces repository errors as hook errors", async () => {
      mockLogin.mockRejectedValue(new Error("Network down"));

      const { result } = renderHook(() => useAuth());
      let ok = true;
      await act(async () => {
        ok = await result.current.requestOtp("+1234567890");
      });

      expect(ok).toBe(false);
      expect(result.current.error).toBe("Network down");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Verify OTP", () => {
    it("rejects malformed OTP codes before hitting the repository", async () => {
      const { result } = renderHook(() => useAuth());
      let ok = true;
      await act(async () => {
        ok = await result.current.verifyOtp("12ab");
      });

      expect(ok).toBe(false);
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(result.current.error).toContain("valid 6-digit OTP");
    });

    it("completes login when the code verifies and a user is returned", async () => {
      const user = makeUser();
      mockVerifyOtp.mockResolvedValue(true);
      mockGetCurrentUser.mockResolvedValue(user);

      const { result } = renderHook(() => useAuth());
      let ok = false;
      await act(async () => {
        ok = await result.current.verifyOtp("123456");
      });

      expect(ok).toBe(true);
      expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
      expect(mockSetUser).toHaveBeenCalledWith(user);
      expect(result.current.step).toBe("complete");
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    });

    it("reports invalid codes when verification fails", async () => {
      mockVerifyOtp.mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());
      let ok = true;
      await act(async () => {
        ok = await result.current.verifyOtp("999999");
      });

      expect(ok).toBe(false);
      expect(result.current.error).toBe("Invalid OTP. Please try again.");
    });
  });

  describe("Resend OTP", () => {
    it("requests a fresh OTP for the given phone", async () => {
      mockLogin.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());
      let ok = false;
      await act(async () => {
        ok = await result.current.resendOtp("+1234567890");
      });

      expect(ok).toBe(true);
      expect(mockLogin).toHaveBeenCalledWith("+1234567890");
    });
  });

  describe("Logout", () => {
    it("clears local session even when the server call fails", async () => {
      mockRepoLogout.mockRejectedValue(new Error("Server unreachable"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.logout();
      });

      expect(mockStoreLogout).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it("logs out through the repository and the store on success", async () => {
      mockRepoLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.logout();
      });

      expect(mockRepoLogout).toHaveBeenCalled();
      expect(mockStoreLogout).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    });
  });

  describe("Update Profile", () => {
    it("returns false when there is no current user", async () => {
      const { result } = renderHook(() => useAuth());
      let ok = true;
      await act(async () => {
        ok = await result.current.updateProfile({ name: "New Name" });
      });

      expect(ok).toBe(false);
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("pushes updates and refreshes the stored user", async () => {
      const user = makeUser();
      const updated = makeUser({ name: "Updated Name" });
      const { useAuthStore } = require("../../stores");
      (useAuthStore as jest.Mock).mockReturnValue({
        currentUser: user,
        setUser: mockSetUser,
        logout: mockStoreLogout,
      });
      mockUpdateProfile.mockResolvedValue(undefined);
      mockGetCurrentUser.mockResolvedValue(updated);

      const { result } = renderHook(() => useAuth());
      let ok = false;
      await act(async () => {
        ok = await result.current.updateProfile({ name: "Updated Name" });
      });

      expect(ok).toBe(true);
      expect(mockUpdateProfile).toHaveBeenCalledWith(user.id, { displayName: "Updated Name" });
      expect(mockSetUser).toHaveBeenCalledWith(updated);
    });
  });

  describe("Check Auth", () => {
    it("restores the session when the repository reports authentication", async () => {
      const user = makeUser();
      mockIsAuthenticated.mockResolvedValue(true);
      mockGetCurrentUser.mockResolvedValue(user);

      const { result } = renderHook(() => useAuth());
      let ok = false;
      await act(async () => {
        ok = await result.current.checkAuth();
      });

      expect(ok).toBe(true);
      expect(mockSetUser).toHaveBeenCalledWith(user);
    });

    it("returns false when not authenticated or on errors", async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());
      let ok = true;
      await act(async () => {
        ok = await result.current.checkAuth();
      });
      expect(ok).toBe(false);

      mockIsAuthenticated.mockRejectedValue(new Error("boom"));
      let ok2 = true;
      await act(async () => {
        ok2 = await result.current.checkAuth();
      });
      expect(ok2).toBe(false);
      expect(mockSetUser).not.toHaveBeenCalled();
    });
  });

  describe("Reset", () => {
    it("restores the default login state", async () => {
      mockLogin.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.requestOtp("+1234567890");
      });
      expect(result.current.step).toBe("otp");

      act(() => {
        result.current.reset();
      });

      expect(result.current.step).toBe("phone");
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
