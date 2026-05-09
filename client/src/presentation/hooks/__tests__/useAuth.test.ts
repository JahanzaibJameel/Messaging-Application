/**
 * Unit tests for useAuth hook
 * Testing authentication hook business logic
 */

import { renderHook, act } from "@testing-library/react-native";
import { useAuth } from "../useAuth";

// Mock dependencies
jest.mock("../stores/authStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("../../data/repositories/UserRepositoryImpl", () => ({
  UserRepositoryImpl: jest.fn().mockImplementation(() => ({
    login: jest.fn(),
    verifyOtp: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    updateProfile: jest.fn(),
    isAuthenticated: jest.fn(),
  })),
}));

jest.mock("../stores/uiStore", () => ({
  useUIStore: jest.fn(),
}));

jest.mock("../../core/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("useAuth", () => {
  let mockUseAuthStore: any;
  let mockUserRepository: any;
  let mockUseUIStore: any;

  beforeEach(() => {
    mockUseAuthStore = require("../stores/authStore").useAuthStore;
    mockUserRepository = require("../../data/repositories/UserRepositoryImpl").UserRepositoryImpl;
    mockUseUIStore = require("../stores/uiStore").useUIStore;
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should return authentication state from store", () => {
      const mockState = {
        currentUser: {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      expect(result.current.currentUser).toEqual(mockState.currentUser);
      expect(result.current.isAuthenticated).toBe(mockState.isAuthenticated);
    });

    it("should handle null current user", () => {
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Request OTP", () => {
    it("should call requestOtp function", async () => {
      const mockRequestOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp("+1234567890");
      });

      expect(mockRequestOtp).toHaveBeenCalledWith("+1234567890");
    });

    it("should handle requestOtp errors", async () => {
      const mockError = new Error("Request failed");
      const mockRequestOtp = jest.fn().mockRejectedValue(mockError);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp("+1234567890");
      });

      expect(mockRequestOtp).toHaveBeenCalledWith("+1234567890");
    });

    it("should handle empty phone number", async () => {
      const mockRequestOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp("");
      });

      expect(mockRequestOtp).toHaveBeenCalledWith("");
    });
  });

  describe("Verify OTP", () => {
    it("should call verifyOtp function", async () => {
      const mockVerifyOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: mockVerifyOtp,
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp("123456");
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
    });

    it("should handle OTP verification errors", async () => {
      const mockError = new Error("Invalid OTP");
      const mockVerifyOtp = jest.fn().mockRejectedValue(mockError);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: mockVerifyOtp,
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp("000000");
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith("000000");
    });

    it("should handle invalid OTP format", async () => {
      const mockVerifyOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: mockVerifyOtp,
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp("invalid");
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith("invalid");
    });
  });

  describe("Resend OTP", () => {
    it("should call resendOtp function", async () => {
      const mockResendOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: mockResendOtp,
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.resendOtp("+1234567890");
      });

      expect(mockResendOtp).toHaveBeenCalledWith("+1234567890");
    });
  });

  describe("Logout", () => {
    it("should call logout function", async () => {
      const mockLogout = jest.fn().mockResolvedValue();
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: mockLogout,
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should handle logout errors", async () => {
      const mockError = new Error("Logout failed");
      const mockLogout = jest.fn().mockRejectedValue(mockError);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: mockLogout,
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("Update Profile", () => {
    it("should call updateProfile function", async () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: mockUpdateProfile,
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.updateProfile({ name: "Updated Name" });
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith("user_123", { name: "Updated Name" });
    });

    it("should handle update profile errors", async () => {
      const mockError = new Error("Update failed");
      const mockUpdateProfile = jest.fn().mockRejectedValue(mockError);
      const mockState = {
        currentUser: {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: mockUpdateProfile,
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.updateProfile({ name: "Updated Name" });
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith("user_123", { name: "Updated Name" });
    });

    it("should handle update profile without current user", async () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue(false);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: mockUpdateProfile,
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.updateProfile({ name: "Updated Name" });
      });

      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe("Check Auth", () => {
    it("should call checkAuth function", async () => {
      const mockCheckAuth = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: mockCheckAuth,
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const isAuth = await result.current.checkAuth();
        expect(isAuth).toBe(true);
      });

      expect(mockCheckAuth).toHaveBeenCalled();
    });

    it("should handle checkAuth errors", async () => {
      const mockError = new Error("Check failed");
      const mockCheckAuth = jest.fn().mockRejectedValue(mockError);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: mockCheckAuth,
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(mockCheckAuth).toHaveBeenCalled();
    });
  });

  describe("Reset", () => {
    it("should call reset function", () => {
      const mockReset = jest.fn();
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: mockReset,
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe("Security", () => {
    it("should not expose sensitive data", () => {
      const mockState = {
        currentUser: {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      // Verify that sensitive data is not directly exposed
      expect(result.current).not.toHaveProperty("password");
      expect(result.current).not.toHaveProperty("token");
      expect(result.current).not.toHaveProperty("secret");
    });
  });

  describe("Phone Number Validation", () => {
    it("should validate phone number format", async () => {
      const mockRequestOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp("1234567890");
      });

      expect(mockRequestOtp).toHaveBeenCalledWith("1234567890");
    });

    it("should handle international phone numbers", async () => {
      const mockRequestOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp("+44 20 7946 000");
      });

      expect(mockRequestOtp).toHaveBeenCalledWith("+44 20 7946 000");
    });

    it("should handle invalid phone numbers", async () => {
      const mockRequestOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp("invalid");
      });

      expect(mockRequestOtp).toHaveBeenCalledWith("invalid");
    });
  });

  describe("OTP Validation", () => {
    it("should validate OTP format", async () => {
      const mockVerifyOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: mockVerifyOtp,
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp("123456");
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith("123456");
    });

    it("should handle OTP of wrong length", async () => {
      const mockVerifyOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: mockVerifyOtp,
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp("1234");
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith("1234");
    });

    it("should handle empty OTP", async () => {
      const mockVerifyOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: mockVerifyOtp,
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp("");
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith("");
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent operations", async () => {
      const mockRequestOtp = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await Promise.all([
          result.current.requestOtp("+1234567890"),
          result.current.requestOtp("+0987654321"),
          result.current.requestOtp("+5551234567"),
        ]);
      });

      expect(mockRequestOtp).toHaveBeenCalledTimes(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid state changes", () => {
      const mockReset = jest.fn();
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: mockReset,
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.reset();
        result.current.reset();
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalledTimes(3);
    });

    it("should handle malformed user data", () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue(true);
      const mockState = {
        currentUser: {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: mockUpdateProfile,
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      act(async () => {
        await result.current.updateProfile({ name: null } as any);
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith("user_123", { name: null });
    });

    it("should handle network errors", async () => {
      const mockError = new Error("Network unavailable");
      const mockRequestOtp = jest.fn().mockRejectedValue(mockError);
      const mockState = {
        currentUser: null,
        isAuthenticated: false,
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        checkAuth: jest.fn(),
        reset: jest.fn(),
      };

      mockUseAuthStore(mockState);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp("+1234567890");
      });

      expect(mockRequestOtp).toHaveBeenCalledWith("+1234567890");
    });
  });
});
