/**
 * Unit tests for UserRepositoryImpl
 * Testing user repository business logic and data flow
 */

import { UserRepositoryImpl } from "../UserRepositoryImpl";
import { LocalStorageDataSource } from "../../datasources/LocalStorageDataSource";
import { RemoteApiDataSource } from "../../datasources/RemoteApiDataSource";
import { UserMapper } from "../../mappers";
import type { User, UserProfile, UserSettings } from "../../../domain/entities/User";

describe("UserRepositoryImpl", () => {
  let userRepository: UserRepositoryImpl;
  let mockLocalStorage: jest.Mocked<LocalStorageDataSource>;
  let mockRemoteApi: jest.Mocked<RemoteApiDataSource>;

  beforeEach(() => {
    // Mock dependencies
    mockLocalStorage = {
      getUserById: jest.fn(),
      getUsers: jest.fn(),
      saveUser: jest.fn(),
      saveUsers: jest.fn(),
      getCurrentUser: jest.fn(),
      saveCurrentUser: jest.fn(),
      getChats: jest.fn(),
      saveChats: jest.fn(),
      getChatById: jest.fn(),
      saveChat: jest.fn(),
      deleteChat: jest.fn(),
      getMessages: jest.fn(),
      saveMessages: jest.fn(),
      saveMessage: jest.fn(),
      deleteMessage: jest.fn(),
      clearMessagesByChatId: jest.fn(),
      getSettings: jest.fn(),
      saveSettings: jest.fn(),
      getSyncState: jest.fn(),
      saveSyncState: jest.fn(),
    } as any;

    mockRemoteApi = {
      getUserById: jest.fn(),
      getUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getChats: jest.fn(),
      getChatById: jest.fn(),
      createChat: jest.fn(),
      updateChat: jest.fn(),
      deleteChat: jest.fn(),
      getMessages: jest.fn(),
      createMessage: jest.fn(),
      updateMessage: jest.fn(),
      deleteMessage: jest.fn(),
      login: jest.fn(),
      verifyOtp: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      updateSettings: jest.fn(),
      isAuthenticated: jest.fn(),
      getCurrentUser: jest.fn(),
    } as any;

    userRepository = new UserRepositoryImpl(mockLocalStorage, mockRemoteApi);
  });

  describe("getById", () => {
    it("should return user from local storage", async () => {
      const mockLocalUser = {
        id: "user_123",
        name: "Local User",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getUserById.mockResolvedValue(mockLocalUser);

      const result = await userRepository.getById("user_123");

      expect(mockLocalStorage.getUserById).toHaveBeenCalledWith("user_123");
      expect(mockRemoteApi.getUserById).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: "user_123",
        name: "Local User",
        phone: "+1234567890",
        isOnline: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      });
    });

    it("should fetch user from remote when not in local storage", async () => {
      const mockRemoteUser = {
        id: "user_456",
        name: "Remote User",
        phone: "+0987654321",
        isOnline: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getUserById.mockResolvedValue(null);
      mockRemoteApi.getUserById.mockResolvedValue(mockRemoteUser);

      const result = await userRepository.getById("user_456");

      expect(mockLocalStorage.getUserById).toHaveBeenCalledWith("user_456");
      expect(mockRemoteApi.getUserById).toHaveBeenCalledWith("user_456");
      expect(mockLocalStorage.saveUser).toHaveBeenCalledWith(mockRemoteUser);
      expect(result).toEqual({
        id: "user_456",
        name: "Remote User",
        phone: "+0987654321",
        isOnline: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      });
    });

    it("should return null when user not found", async () => {
      mockLocalStorage.getUserById.mockResolvedValue(null);
      mockRemoteApi.getUserById.mockRejectedValue(new Error("User not found"));

      const result = await userRepository.getById("user_789");

      expect(result).toBeNull();
    });
  });

  describe("getByPhone", () => {
    it("should find user by phone number", async () => {
      const mockUsers = [
        {
          id: "user_123",
          name: "User One",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "user_456",
          name: "User Two",
          phone: "+0987654321",
          isOnline: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getUsers.mockResolvedValue(mockUsers);

      const result = await userRepository.getByPhone("+1234567890");

      expect(mockLocalStorage.getUsers).toHaveBeenCalled();
      expect(result).toEqual({
        id: "user_123",
        name: "User One",
        phone: "+1234567890",
        isOnline: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      });
    });

    it("should return null when phone not found", async () => {
      mockLocalStorage.getUsers.mockResolvedValue([]);

      const result = await userRepository.getByPhone("+1111111111");

      expect(result).toBeNull();
    });
  });

  describe("getByIds", () => {
    it("should return users by IDs", async () => {
      const mockUsers = [
        {
          id: "user_123",
          name: "User One",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "user_456",
          name: "User Two",
          phone: "+0987654321",
          isOnline: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getUsers.mockResolvedValue(mockUsers);

      const result = await userRepository.getByIds(["user_123", "user_456"]);

      expect(mockLocalStorage.getUsers).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("user_123");
      expect(result[1].id).toBe("user_456");
    });

    it("should return empty array for no matching IDs", async () => {
      mockLocalStorage.getUsers.mockResolvedValue([]);

      const result = await userRepository.getByIds(["user_123", "user_456"]);

      expect(result).toEqual([]);
    });
  });

  describe("save", () => {
    it("should save user to local storage", async () => {
      const user: User = {
        id: "user_123",
        name: "Test User",
        phone: "+1234567890",
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await userRepository.save(user);

      expect(mockLocalStorage.saveUser).toHaveBeenCalledWith({
        id: "user_123",
        name: "Test User",
        phone: "+1234567890",
        isOnline: true,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    });
  });

  describe("updateProfile", () => {
    it("should update user profile", async () => {
      const mockUser = {
        id: "user_123",
        name: "Test User",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const profile = {
        bio: "Updated bio",
        displayName: "Display Name",
      };

      mockLocalStorage.getUserById.mockResolvedValue(mockUser);

      await userRepository.updateProfile("user_123", profile);

      expect(mockLocalStorage.getUserById).toHaveBeenCalledWith("user_123");
      expect(mockLocalStorage.saveUser).toHaveBeenCalled();
    });
  });

  describe("updateSettings", () => {
    it("should update user settings", async () => {
      const settings: UserSettings = {
        darkMode: true,
        fontSize: "large",
        notifications: false,
        soundEnabled: false,
        showReadReceipts: false,
      };

      await userRepository.updateSettings("user_123", settings);

      expect(mockLocalStorage.saveUser).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle local storage errors", async () => {
      mockLocalStorage.getUserById.mockRejectedValue(new Error("Local storage error"));

      await expect(userRepository.getById("user_123")).rejects.toThrow("Local storage error");
    });

    it("should handle remote API errors", async () => {
      mockLocalStorage.getUserById.mockResolvedValue(null);
      mockRemoteApi.getUserById.mockRejectedValue(new Error("API error"));

      const result = await userRepository.getById("user_123");

      expect(result).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty user ID", async () => {
      const result = await userRepository.getById("");

      expect(mockLocalStorage.getUserById).toHaveBeenCalledWith("");
      expect(result).toBeNull();
    });

    it("should handle empty phone number", async () => {
      mockLocalStorage.getUsers.mockResolvedValue([]);

      const result = await userRepository.getByPhone("");

      expect(result).toBeNull();
    });

    it("should handle empty user IDs array", async () => {
      mockLocalStorage.getUsers.mockResolvedValue([]);

      const result = await userRepository.getByIds([]);

      expect(result).toEqual([]);
    });
  });

  describe("Performance", () => {
    it("should handle large user lists efficiently", async () => {
      const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
        id: `user_${i}`,
        name: `User ${i}`,
        phone: `+1234567${i.toString().padStart(4, "0")}`,
        isOnline: i % 2 === 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }));

      mockLocalStorage.getUsers.mockResolvedValue(largeUserList);

      const startTime = Date.now();
      const result = await userRepository.getByIds(
        Array.from({ length: 100 }, (_, i) => `user_${i}`)
      );
      const endTime = Date.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle concurrent requests", async () => {
      const mockUser = {
        id: "user_123",
        name: "Concurrent User",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getUserById.mockResolvedValue(mockUser);

      const promises = Array.from({ length: 100 }, () => userRepository.getById("user_123"));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result?.id).toBe("user_123");
      });
    });
  });

  describe("Data Consistency", () => {
    it("should maintain user data consistency", async () => {
      const user: User = {
        id: "user_123",
        name: "Consistency Test",
        phone: "+1234567890",
        isOnline: true,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };

      await userRepository.save(user);

      expect(mockLocalStorage.saveUser).toHaveBeenCalledWith({
        id: "user_123",
        name: "Consistency Test",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      });
    });

    it("should handle date conversion correctly", async () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const user: User = {
        id: "user_123",
        name: "Date Test",
        phone: "+1234567890",
        isOnline: true,
        createdAt: now,
        updatedAt: now,
      };

      await userRepository.save(user);

      expect(mockLocalStorage.saveUser).toHaveBeenCalledWith({
        id: "user_123",
        name: "Date Test",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T12:00:00Z",
        updatedAt: "2024-01-01T12:00:00Z",
      });
    });
  });

  describe("Security", () => {
    it("should handle malicious user data", async () => {
      const maliciousUser: User = {
        id: "user_123<script>",
        name: '<script>alert("xss")</script>',
        phone: '+1<script>alert("xss")</script>',
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await userRepository.save(maliciousUser);

      expect(mockLocalStorage.saveUser).toHaveBeenCalledWith({
        id: "user_123<script>",
        name: '<script>alert("xss")</script>',
        phone: '+1<script>alert("xss")</script>',
        isOnline: true,
        createdAt: maliciousUser.createdAt.toISOString(),
        updatedAt: maliciousUser.updatedAt.toISOString(),
      });
    });

    it("should handle extremely long user data", async () => {
      const longUser: User = {
        id: "user_123",
        name: "x".repeat(10000),
        phone: "+" + "1".repeat(100),
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await userRepository.save(longUser);

      expect(mockLocalStorage.saveUser).toHaveBeenCalledWith({
        id: "user_123",
        name: "x".repeat(10000),
        phone: "+" + "1".repeat(100),
        isOnline: true,
        createdAt: longUser.createdAt.toISOString(),
        updatedAt: longUser.updatedAt.toISOString(),
      });
    });
  });
});
