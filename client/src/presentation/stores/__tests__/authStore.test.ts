/**
 * Unit tests for authStore
 * Tests the real authentication store API.
 */

import { useAuthStore } from "../authStore";
import { UserEntity } from "../../../domain/entities/User";

jest.mock("../../../monitoring/sentry", () => ({
  captureException: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
}));

function makeUser(overrides = {}) {
  return new UserEntity({
    id: "user_123",
    name: "Test User",
    phone: "+1234567890",
    isOnline: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any);
}

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });
  });

  describe("Initial State", () => {
    it("defaults to unauthenticated and loading", () => {
      const { currentUser, isAuthenticated, isLoading, error } = useAuthStore.getState();

      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(isLoading).toBe(true);
      expect(error).toBeNull();
    });
  });

  describe("Login", () => {
    it("clears error and resets loading when login completes", async () => {
      await useAuthStore.getState().login("+1234567890");

      const { isLoading, error } = useAuthStore.getState();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });

    it("does not authenticate on login alone", async () => {
      await useAuthStore.getState().login("+1234567890");

      const { isAuthenticated, currentUser } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(currentUser).toBeNull();
    });
  });

  describe("Verify OTP", () => {
    it("returns true and authenticates on a valid 6-digit OTP", async () => {
      const result = await useAuthStore.getState().verifyOtp("123456");

      expect(result).toBe(true);
      const { isAuthenticated, currentUser, isLoading } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(currentUser).not.toBeNull();
      expect(currentUser?.name).toBe("You");
      expect(isLoading).toBe(false);
    });

    it("rejects OTPs that are not exactly 6 digits", async () => {
      for (const otp of ["12345", "1234567", "abcdef", ""]) {
        useAuthStore.setState({ isLoading: false, error: null });
        const result = await useAuthStore.getState().verifyOtp(otp);
        expect(result).toBe(false);
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().error).toBe("Invalid OTP format");
      }
    });

    it("clears error before verifying", async () => {
      useAuthStore.setState({ error: "stale error" });
      await useAuthStore.getState().verifyOtp("123456");
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("Logout", () => {
    it("resets all auth state", async () => {
      useAuthStore.setState({ currentUser: makeUser(), isAuthenticated: true });
      await useAuthStore.getState().logout();

      const { currentUser, isAuthenticated, error } = useAuthStore.getState();
      expect(currentUser).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(error).toBeNull();
    });
  });

  describe("setUser / setAuthenticated / clearError", () => {
    it("setUser updates the current user", () => {
      const user = makeUser();
      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().currentUser).toBe(user);
    });

    it("setUser(null) clears the current user", () => {
      useAuthStore.getState().setUser(makeUser());
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().currentUser).toBeNull();
    });

    it("setAuthenticated toggles the flag", () => {
      useAuthStore.getState().setAuthenticated(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      useAuthStore.getState().setAuthenticated(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("clearError removes the error", () => {
      useAuthStore.setState({ error: "some error" });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
