/**
 * Authentication store
 * Manages user authentication state with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';

import type { User } from '../../domain/entities/User';
import { UserEntity } from '../../domain/entities/User';
import type { AuthState, AuthActions } from './types';
import { logger } from '../../core/logger';

const storage = new MMKV({ id: 'auth-storage' });

const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
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
            logger.info('Sending OTP request', 'Auth', { phone });
            
            // TODO: Replace with actual API call when backend is ready
            // const response = await apiClient.post('/auth/login', { phone });
            
            set((state: AuthState) => {
              state.isLoading = false;
            });
            
            logger.info('OTP request sent successfully', 'Auth');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            logger.error('Login failed', error as Error, 'Auth');
            
            set((state: AuthState) => {
              state.isLoading = false;
              state.error = message;
            });
          }
        },

        verifyOtp: async (otp: string): Promise<boolean> => {
          set((state: AuthState) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            logger.info('Verifying OTP', 'Auth');
            
            // TODO: Replace with actual API call when backend is ready
            // const response = await apiClient.post('/auth/verify', { phone, otp });
            
            // Validate OTP format
            if (otp.length !== 6 || !/^\d+$/.test(otp)) {
              set((state: AuthState) => {
                state.isLoading = false;
                state.error = 'Invalid OTP format';
              });
              return false;
            }

            // Create user entity (in production, this comes from API)
            const user = new UserEntity({
              id: `user_${Date.now()}`,
              name: 'You',
              phone: get().currentUser?.phone || '',
              isOnline: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            set((state: AuthState) => {
              state.currentUser = user;
              state.isAuthenticated = true;
              state.isLoading = false;
            });

            logger.info('OTP verified successfully', 'Auth', { userId: user.id });
            return true;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Verification failed';
            logger.error('OTP verification failed', error as Error, 'Auth');
            
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
            logger.info('Logging out', 'Auth');
            
            // TODO: Replace with actual API call when backend is ready
            // await apiClient.post('/auth/logout');

            set((state: AuthState) => {
              state.currentUser = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
            });
            
            logger.info('Logout successful', 'Auth');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Logout failed';
            logger.error('Logout failed', error as Error, 'Auth');
            
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
        name: 'auth-storage',
        storage: createJSONStorage(() => mmkvStorage),
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
