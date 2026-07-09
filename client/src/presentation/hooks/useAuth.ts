/**
 * Auth Hook
 * Provides authentication operations for React components
 */

import { useCallback, useState } from "react";
import { useAuthStore, useUIStore } from "../stores";
import { userRepository } from "../../data/repositories";
import { logger } from "../../core/logger";
import { UserEntity } from "../../domain/entities/User";

interface LoginState {
  isLoading: boolean;
  error: string | null;
  step: "phone" | "otp" | "complete";
}

export function useAuth() {
  const [loginState, setLoginState] = useState<LoginState>({
    isLoading: false,
    error: null,
    step: "phone",
  });

  const { currentUser, setUser, logout: storeLogout } = useAuthStore();
  const { showToast } = useUIStore();

  const setLoading = useCallback((isLoading: boolean) => {
    setLoginState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setLoginState((prev) => ({ ...prev, error }));
  }, []);

  const setStep = useCallback((step: LoginState["step"]) => {
    setLoginState((prev) => ({ ...prev, step }));
  }, []);

  // Request OTP
  const requestOtp = useCallback(
    async (phone: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Validate phone number
        const cleanedPhone = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
        if (cleanedPhone.length < 10) {
          setError("Please enter a valid phone number");
          return false;
        }

        await userRepository.login(cleanedPhone);
        setStep("otp");

        showToast({
          type: "success",
          message: "OTP sent to your phone",
          duration: 3000,
        });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send OTP";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setStep, showToast]
  );

  // Verify OTP
  const verifyOtp = useCallback(
    async (otp: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
          setError("Please enter a valid 6-digit OTP");
          return false;
        }

        const success = await userRepository.verifyOtp(otp);

        if (success) {
          // Get current user from repository
          const user = await userRepository.getCurrentUser();
          if (user) {
            setUser(user);
            setStep("complete");

            showToast({
              type: "success",
              message: "Welcome back!",
              duration: 3000,
            });
          }
          return true;
        } else {
          setError("Invalid OTP. Please try again.");
          return false;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to verify OTP";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setStep, setUser, showToast]
  );

  // Resend OTP
  const resendOtp = useCallback(
    async (phone: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await userRepository.login(phone);

        showToast({
          type: "success",
          message: "OTP resent successfully",
          duration: 3000,
        });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resend OTP";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, showToast]
  );

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      await userRepository.logout();
      storeLogout();

      showToast({
        type: "success",
        message: "Logged out successfully",
        duration: 2000,
      });
    } catch (error) {
      logger.error("Logout error", error as Error, "useAuth");
      // Still logout locally even if server fails
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [storeLogout, setLoading, showToast]);

  // Update profile
  const updateProfile = useCallback(
    async (updates: { name?: string; avatar?: string; status?: string }): Promise<boolean> => {
      if (!currentUser) return false;

      setLoading(true);

      try {
        await userRepository.updateProfile(currentUser.id, {
          displayName: updates.name,
        });

        // Update local user
        const updatedUser = await userRepository.getCurrentUser();
        if (updatedUser) {
          setUser(updatedUser);
        }

        showToast({
          type: "success",
          message: "Profile updated",
          duration: 2000,
        });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile";
        showToast({
          type: "error",
          message,
          duration: 3000,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, setUser, setLoading, showToast]
  );

  // Check if authenticated
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const isAuth = await userRepository.isAuthenticated();
      if (isAuth) {
        const user = await userRepository.getCurrentUser();
        if (user) {
          setUser(user);
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error("Auth check error", error as Error, "useAuth");
      return false;
    }
  }, [setUser]);

  // Reset login state
  const reset = useCallback(() => {
    setLoginState({
      isLoading: false,
      error: null,
      step: "phone",
    });
  }, []);

  return {
    // State
    ...loginState,
    isAuthenticated: !!currentUser,
    currentUser,

    // Actions
    requestOtp,
    verifyOtp,
    resendOtp,
    logout,
    updateProfile,
    checkAuth,
    reset,
  };
}
