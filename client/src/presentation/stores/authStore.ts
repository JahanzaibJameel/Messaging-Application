/**
 * Authentication store
 * Manages user authentication state with persistence
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import type { User } from "../../domain/entities/User";
import { UserEntity } from "../../domain/entities/User";
import { logger } from "../../core/logger";
import { remoteApiDataSource } from "../../data/datasources/RemoteApiDataSource";
import { setToken, resetToken } from "../../security/keychain";
import { createSecureStorageAdapterWithKeys } from "../../lib/secureStorageAdapter";
import type { AuthState, AuthActions } from "./types";

const STORAGE_KEYS = ["auth-storage_currentUser", "auth-storage_isAuthenticated"];

const secureStorage = createSecureStorageAdapterWithKeys("auth-storage", STORAGE_KEYS);

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  pendingPhone: undefined,
};

export const useAuthStore = create<AuthStore>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,

        login: async (phone: string) => {
          set((state: AuthState) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            logger.info("Sending OTP request", "Auth", { phone });

            const response = await remoteApiDataSource.login(phone);

            if (!response.success) {
              throw new Error("Failed to send OTP");
            }

            set((state: AuthState) => {
              state.pendingPhone = phone;
              state.isLoading = false;
            });
            logger.info("OTP request sent successfully", "Auth");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Login failed";
            logger.error("Login failed", error as Error, "Auth");

            set((state: AuthState) => {
              state.isLoading = false;
              state.error = message;
            });
          }
        },

        verifyOtp: async (otp: string, phone?: string): Promise<boolean> => {
          set((state: AuthState) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            logger.info("Verifying OTP", "Auth");

            // Validate OTP format
            if (otp.length !== 6 || !/^\d+$/.test(otp)) {
              set((state: AuthState) => {
                state.isLoading = false;
                state.error = "Invalid OTP format";
              });
              return false;
            }

            // Use provided phone, or fallback to pendingPhone from state
            const phoneToUse = phone ?? get().pendingPhone;

            if (!phoneToUse) {
              logger.error(
                "No pending phone number found",
                new Error("pendingPhone is missing"),
                "verifyOtp"
              );
              set((state: AuthState) => {
                state.isLoading = false;
                state.error = "No pending phone number found. Please request OTP again.";
              });
              return false;
            }

            const { token, user } = await remoteApiDataSource.verifyOtp(phoneToUse, otp);

            // Store token securely (ignore errors from keychain in development)
            await setToken(token).catch((error) => {
              console.error("[Auth] Failed to store token:", error);
            });

            // Create user entity from API response
            const userEntity = new UserEntity({
              id: user.id,
              name: user.name,
              phone: user.phone,
              avatar: user.avatar,
              isOnline: user.isOnline,
              lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined,
              status: user.status,
              createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
              updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
            });

            set((state: AuthState) => {
              state.currentUser = userEntity;
              state.isAuthenticated = true;
              state.isLoading = false;
            });

            logger.info("OTP verified successfully", "Auth", { userId: userEntity.id });
            return true;
          } catch (error) {
            const message = error instanceof Error ? error.message : "Verification failed";
            logger.error("OTP verification failed", error as Error, "Auth");

            set((state: AuthState) => {
              state.isLoading = false;
              state.error = message;
            });
            return false;
          }
        },

        logout: async () => {
          set((state: AuthState) => {
            state.isLoading = true;
          });

          try {
            logger.info("Logging out", "Auth");

            await remoteApiDataSource.logout();

            // Clear tokens from secure storage (ignore errors in development)
            await resetToken().catch((error) => {
              console.error("[Auth] Failed to reset token:", error);
            });

            set((state: AuthState) => {
              state.currentUser = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
            });

            logger.info("Logout successful", "Auth");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Logout failed";
            logger.error("Logout failed", error as Error, "Auth");

            set((state: AuthState) => {
              state.isLoading = false;
              state.error = message;
            });
          }
        },

        setUser: (user: User | null) => {
          set((state: AuthState) => {
            state.currentUser = user;
          });

          if (user) {
            logger.setUserId(user.id);
          }
        },

        setAuthenticated: (value: boolean) => {
          set((state: AuthState) => {
            state.isAuthenticated = value;
          });
        },

        clearError: () => {
          set((state: AuthState) => {
            state.error = null;
          });
        },
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => secureStorage),
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
