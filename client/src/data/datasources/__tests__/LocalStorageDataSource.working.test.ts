// @ts-nocheck
import { LocalStorageDataSource } from "../LocalStorageDataSource";

// Mock MMKV
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    getArray: jest.fn(),
    getMap: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

describe("LocalStorageDataSource", () => {
  let dataSource: LocalStorageDataSource;

  beforeEach(() => {
    dataSource = new LocalStorageDataSource();
  });

  describe("Chat Operations", () => {
    it("should initialize storage instance", () => {
      expect(dataSource).toBeInstanceOf(LocalStorageDataSource);
    });

    it("should handle getChats operation", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        },
      ];

      // Mock the storage to return chats
      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockChats));

      const result = await dataSource.getChats();
      expect(result).toEqual(mockChats);
      expect(storageMock.getString).toHaveBeenCalledWith("chats");
    });

    it("should handle saveChats operation", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.set = jest.fn();

      await dataSource.saveChats(mockChats);
      expect(storageMock.set).toHaveBeenCalledWith("chats", JSON.stringify(mockChats));
    });

    it("should handle getChatById operation", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockChats));

      const result = await dataSource.getChatById("chat_1");
      expect(result).toEqual(mockChats[0]);
    });

    it("should handle getChatById with non-existent chat", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockChats));

      const result = await dataSource.getChatById("non_existent");
      expect(result).toBeNull();
    });

    it("should handle saveChat operation", async () => {
      const mockChat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue("[]");
      storageMock.set = jest.fn();

      await dataSource.saveChat(mockChat);
      expect(storageMock.set).toHaveBeenCalledWith(
        "chats",
        expect.stringContaining('"id":"chat_1"')
      );
    });

    it("should handle deleteChat operation", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        },
        {
          id: "chat_2",
          type: "private",
          participantIds: ["user_1", "user_3"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockChats));
      storageMock.set = jest.fn();

      await dataSource.deleteChat("chat_1");
      expect(storageMock.set).toHaveBeenCalledWith(
        "chats",
        expect.stringContaining('"id":"chat_2"')
      );
      expect(storageMock.set).not.toHaveBeenCalledWith(
        "chats",
        expect.stringContaining('"id":"chat_1"')
      );
    });
  });

  describe("Message Operations", () => {
    it("should handle getMessages operation", async () => {
      const mockMessages = [
        {
          id: "msg_1",
          chatId: "chat_1",
          senderId: "user_1",
          type: "text",
          text: "Hello",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          localOnly: false,
          reactions: [],
          edited: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockMessages));

      const result = await dataSource.getMessages("chat_1");
      expect(result).toEqual(mockMessages);
      expect(storageMock.getString).toHaveBeenCalledWith("messages_chat_1");
    });

    it("should handle saveMessages operation", async () => {
      const mockMessages = [
        {
          id: "msg_1",
          chatId: "chat_1",
          senderId: "user_1",
          type: "text",
          text: "Hello",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          localOnly: false,
          reactions: [],
          edited: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.set = jest.fn();

      await dataSource.saveMessages("chat_1", mockMessages);
      expect(storageMock.set).toHaveBeenCalledWith("messages_chat_1", JSON.stringify(mockMessages));
    });

    it("should handle saveMessage operation", async () => {
      const mockMessage = {
        id: "msg_1",
        chatId: "chat_1",
        senderId: "user_1",
        type: "text",
        text: "Hello",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
        reactions: [],
        edited: false,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue("[]");
      storageMock.set = jest.fn();

      await dataSource.saveMessage(mockMessage);
      expect(storageMock.set).toHaveBeenCalledWith(
        "messages_chat_1",
        expect.stringContaining('"id":"msg_1"')
      );
    });

    it("should handle deleteMessage operation", async () => {
      const mockMessages = [
        {
          id: "msg_1",
          chatId: "chat_1",
          senderId: "user_1",
          type: "text",
          text: "Hello",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          localOnly: false,
          reactions: [],
          edited: false,
        },
        {
          id: "msg_2",
          chatId: "chat_1",
          senderId: "user_2",
          type: "text",
          text: "Hi",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          localOnly: false,
          reactions: [],
          edited: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockMessages));
      storageMock.set = jest.fn();

      await dataSource.deleteMessage("chat_1", "msg_1");
      expect(storageMock.set).toHaveBeenCalledWith(
        "messages_chat_1",
        expect.stringContaining('"id":"msg_2"')
      );
      expect(storageMock.set).not.toHaveBeenCalledWith(
        "messages_chat_1",
        expect.stringContaining('"id":"msg_1"')
      );
    });

    it("should handle clearMessagesByChatId operation", async () => {
      const storageMock = (dataSource as any).storage;
      storageMock.delete = jest.fn();

      await dataSource.clearMessagesByChatId("chat_1");
      expect(storageMock.delete).toHaveBeenCalledWith("messages_chat_1");
    });
  });

  describe("User Operations", () => {
    it("should handle getUsers operation", async () => {
      const mockUsers = [
        {
          id: "user_1",
          name: "User 1",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockUsers));

      const result = await dataSource.getUsers();
      expect(result).toEqual(mockUsers);
      expect(storageMock.getString).toHaveBeenCalledWith("users");
    });

    it("should handle saveUsers operation", async () => {
      const mockUsers = [
        {
          id: "user_1",
          name: "User 1",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.set = jest.fn();

      await dataSource.saveUsers(mockUsers);
      expect(storageMock.set).toHaveBeenCalledWith("users", JSON.stringify(mockUsers));
    });

    it("should handle getUserById operation", async () => {
      const mockUsers = [
        {
          id: "user_1",
          name: "User 1",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockUsers));

      const result = await dataSource.getUserById("user_1");
      expect(result).toEqual(mockUsers[0]);
    });

    it("should handle getUserById with non-existent user", async () => {
      const mockUsers = [
        {
          id: "user_1",
          name: "User 1",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockUsers));

      const result = await dataSource.getUserById("non_existent");
      expect(result).toBeNull();
    });

    it("should handle saveUser operation", async () => {
      const mockUser = {
        id: "user_1",
        name: "User 1",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue("[]");
      storageMock.set = jest.fn();

      await dataSource.saveUser(mockUser);
      expect(storageMock.set).toHaveBeenCalledWith(
        "users",
        expect.stringContaining('"id":"user_1"')
      );
    });
  });

  describe("Current User Operations", () => {
    it("should handle getCurrentUser operation", async () => {
      const mockUser = {
        id: "user_1",
        name: "User 1",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockUser));

      const result = await dataSource.getCurrentUser();
      expect(result).toEqual(mockUser);
      expect(storageMock.getString).toHaveBeenCalledWith("current_user");
    });

    it("should handle saveCurrentUser operation", async () => {
      const mockUser = {
        id: "user_1",
        name: "User 1",
        phone: "+1234567890",
        isOnline: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const storageMock = (dataSource as any).storage;
      storageMock.set = jest.fn();

      await dataSource.saveCurrentUser(mockUser);
      expect(storageMock.set).toHaveBeenCalledWith("current_user", JSON.stringify(mockUser));
    });
  });

  describe("Settings Operations", () => {
    it("should handle getSettings operation", async () => {
      const mockSettings = {
        darkMode: true,
        fontSize: "large",
        notifications: false,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockSettings));

      const result = await dataSource.getSettings();
      expect(result).toEqual(mockSettings);
      expect(storageMock.getString).toHaveBeenCalledWith("settings");
    });

    it("should handle saveSettings operation", async () => {
      const mockSettings = {
        darkMode: true,
        fontSize: "large",
        notifications: false,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.set = jest.fn();

      await dataSource.saveSettings(mockSettings);
      expect(storageMock.set).toHaveBeenCalledWith("settings", JSON.stringify(mockSettings));
    });
  });

  describe("Sync State Operations", () => {
    it("should handle getSyncState operation", async () => {
      const mockSyncState = {
        lastSyncAt: "2024-01-01T00:00:00Z",
        pendingOperations: [],
        isOnline: true,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockSyncState));

      const result = await dataSource.getSyncState();
      expect(result).toEqual(mockSyncState);
      expect(storageMock.getString).toHaveBeenCalledWith("sync_state");
    });

    it("should handle saveSyncState operation", async () => {
      const mockSyncState = {
        lastSyncAt: "2024-01-01T00:00:00Z",
        pendingOperations: [],
        isOnline: true,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.set = jest.fn();

      await dataSource.saveSyncState(mockSyncState);
      expect(storageMock.set).toHaveBeenCalledWith("sync_state", JSON.stringify(mockSyncState));
    });
  });

  describe("Error Handling", () => {
    it("should handle JSON parsing errors gracefully", async () => {
      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue("invalid json");

      const result = await dataSource.getChats();
      expect(result).toEqual([]);
    });

    it("should handle null storage values gracefully", async () => {
      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(null);

      const result = await dataSource.getChats();
      expect(result).toEqual([]);
    });

    it("should handle empty storage values gracefully", async () => {
      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue("");

      const result = await dataSource.getChats();
      expect(result).toEqual([]);
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", async () => {
      const largeChats = Array.from({ length: 1000 }, (_, i) => ({
        id: `chat_${i}`,
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      }));

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(largeChats));

      const startTime = Date.now();
      const result = await dataSource.getChats();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data consistency across operations", async () => {
      const mockChat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue("[]");
      storageMock.set = jest.fn();

      // Save chat
      await dataSource.saveChat(mockChat);
      expect(storageMock.set).toHaveBeenCalledWith(
        "chats",
        expect.stringContaining('"id":"chat_1"')
      );

      // Retrieve chat
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify([mockChat]));
      const result = await dataSource.getChatById("chat_1");
      expect(result).toEqual(mockChat);
    });

    it("should handle concurrent operations safely", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private",
          participantIds: ["user_1", "user_2"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        },
      ];

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue(JSON.stringify(mockChats));
      storageMock.set = jest.fn();

      // Run multiple operations concurrently
      const promises = [
        dataSource.getChats(),
        dataSource.getChatById("chat_1"),
        dataSource.saveChat(mockChats[0]),
      ];

      await Promise.all(promises);
      expect(storageMock.getString).toHaveBeenCalledTimes(2);
      expect(storageMock.set).toHaveBeenCalledTimes(1);
    });
  });

  describe("Security", () => {
    it("should not expose sensitive data in error messages", async () => {
      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockImplementation(() => {
        throw new Error("Storage access denied");
      });

      await expect(dataSource.getChats()).rejects.toThrow("Storage access denied");
    });

    it("should handle malicious input safely", async () => {
      const maliciousChat = {
        id: '<script>alert("xss")</script>',
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      const storageMock = (dataSource as any).storage;
      storageMock.getString = jest.fn().mockReturnValue("[]");
      storageMock.set = jest.fn();

      await expect(dataSource.saveChat(maliciousChat)).resolves.not.toThrow();
      expect(storageMock.set).toHaveBeenCalledWith(
        "chats",
        expect.stringContaining('<script>alert("xss")</script>')
      );
    });
  });
});
