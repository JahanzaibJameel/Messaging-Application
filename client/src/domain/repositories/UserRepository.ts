/**
 * User repository interface
 * Defines the contract for user data access
 */

import type { User, UserProfile, UserSettings } from '../entities/User';

export interface UserRepository {
  // Queries
  getById(id: string): Promise<User | null>;
  getByPhone(phone: string): Promise<User | null>;
  getByIds(ids: string[]): Promise<User[]>;
  getCurrentUser(): Promise<User | null>;
  
  // Commands
  save(user: User): Promise<void>;
  saveCurrentUser(user: User): Promise<void>;
  updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void>;
  updateSettings(userId: string, settings: Partial<UserSettings>): Promise<void>;
  updateStatus(userId: string, status: string): Promise<void>;
  updateLastSeen(userId: string): Promise<void>;
  
  // Auth
  login(phone: string): Promise<void>;
  verifyOtp(otp: string): Promise<boolean>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  
  // Online status
  setOnline(userId: string): Promise<void>;
  setOffline(userId: string): Promise<void>;
}
