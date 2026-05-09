/**
 * User Repository Implementation
 * Combines local and remote data sources
 */

import type { User, UserProfile, UserSettings } from "../../domain/entities/User";
import { UserEntity } from "../../domain/entities/User";
import type { UserRepository } from "../../domain/repositories/UserRepository";
import { LocalStorageDataSource } from "../datasources/LocalStorageDataSource";
import { RemoteApiDataSource } from "../datasources/RemoteApiDataSource";
import { UserMapper } from "../mappers";

export class UserRepositoryImpl implements UserRepository {
  private localDataSource: LocalStorageDataSource;
  private remoteDataSource: RemoteApiDataSource;

  constructor(localDataSource: LocalStorageDataSource, remoteDataSource: RemoteApiDataSource) {
    this.localDataSource = localDataSource;
    this.remoteDataSource = remoteDataSource;
  }

  // Queries
  async getById(id: string): Promise<User | null> {
    // Try local first
    const localUser = await this.localDataSource.getUserById(id);
    if (localUser) {
      return UserMapper.toDomain(localUser);
    }

    // Fetch from remote
    try {
      const remoteUser = await this.remoteDataSource.getUserById(id);
      await this.localDataSource.saveUser(remoteUser);
      return UserMapper.toDomain(remoteUser);
    } catch {
      return null;
    }
  }

  async getByPhone(phone: string): Promise<User | null> {
    const users = await this.localDataSource.getUsers();
    const user = users.find((u) => u.phone === phone);
    return user ? UserMapper.toDomain(user) : null;
  }

  async getByIds(ids: string[]): Promise<User[]> {
    const users: User[] = [];

    for (const id of ids) {
      const user = await this.getById(id);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  async getCurrentUser(): Promise<User | null> {
    const userModel = await this.localDataSource.getCurrentUser();
    return userModel ? UserMapper.toDomain(userModel) : null;
  }

  // Commands
  async save(user: User): Promise<void> {
    const userModel = UserMapper.toModel(user);
    await this.localDataSource.saveUser(userModel);
  }

  async saveCurrentUser(user: User): Promise<void> {
    const userModel = UserMapper.toModel(user);
    await this.localDataSource.saveCurrentUser(userModel);
    this.remoteDataSource.setAuthToken(user.id); // Use user ID as token for now
  }

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      // Apply updates
      Object.assign(user, profile);
      await this.save(user);

      // Sync with remote
      try {
        await this.remoteDataSource.updateProfile(userId, profile);
      } catch {
        // Will be synced later
      }
    }
  }

  async updateSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.localDataSource.getSettings<UserSettings>();
    const updatedSettings = { ...currentSettings, ...settings };
    await this.localDataSource.saveSettings(updatedSettings);
  }

  async updateStatus(userId: string, status: string): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      user.status = status;
      await this.save(user);
    }
  }

  async updateLastSeen(userId: string): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      user.lastSeen = new Date();
      await this.save(user);
    }
  }

  // Auth
  async login(phone: string): Promise<void> {
    await this.remoteDataSource.login(phone);
  }

  async verifyOtp(otp: string): Promise<boolean> {
    // In a real implementation, this would verify with the server
    // For now, simulate successful verification
    if (otp.length === 6) {
      const user = new UserEntity({
        id: `user_${Date.now()}`,
        name: "You",
        phone: "",
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.saveCurrentUser(user);
      return true;
    }

    return false;
  }

  async logout(): Promise<void> {
    await this.remoteDataSource.logout();
    await this.localDataSource.saveCurrentUser(null);
  }

  async isAuthenticated(): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    return currentUser !== null;
  }

  // Online status
  async setOnline(userId: string): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      user.isOnline = true;
      await this.save(user);
    }
  }

  async setOffline(userId: string): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await this.save(user);
    }
  }
}

// Singleton instance
export const userRepository = new UserRepositoryImpl(
  new LocalStorageDataSource(),
  new RemoteApiDataSource()
);
