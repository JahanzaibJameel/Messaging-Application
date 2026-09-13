/**
 * Unit tests for LocalStorageDataSource
 * Testing local data storage operations with secureStorage
 */

import { LocalStorageDataSource } from "../LocalStorageDataSource";
import type { ChatModel, MessageModel, UserModel } from "../../models/MessageModel";

import * as secureStorage from "@/security/secureStorage";

// Mock secureStorage
interface MockSecureStorage {
  secureGetJSON: jest.Mock;
  secureSetJSON: jest.Mock;
  secureDelete: jest.Mock;
  secureClear: jest.Mock;
  secureGet: jest.Mock;
  secureSet: jest.Mock;
}

jest.mock("@/security/secureStorage", () => {
  const mockSecureStorage: MockSecureStorage = {
    secureGetJSON: jest.fn(),
    secureSetJSON: jest.fn(),
    secureDelete: jest.fn(),
    secureClear: jest.fn(),
    secureGet: jest.fn(),
    secureSet: jest.fn(),
  };
  return {
    secureGetJSON: mockSecureStorage.secureGetJSON,
    secureSetJSON: mockSecureStorage.secureSetJSON,
    secureDelete: mockSecureStorage.secureDelete,
    secureClear: mockSecureStorage.secureClear,
    secureGet: mockSecureStorage.secureGet,
    secureSet: mockSecureStorage.secureSet,
    __mockStorage: mockSecureStorage,
  };
});

describe("LocalStorageDataSource", () => {
  let dataSource: LocalStorageDataSource;
  let mockSecureStorage: MockSecureStorage;

  beforeEach(() => {
    mockSecureStorage = (secureStorage as any).__mockStorage;
    dataSource = new LocalStorageDataSource();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize", () => {
      expect(dataSource).toBeInstanceOf(LocalStorageDataSource);
    });
  });

  describe("Chat Operations", () => {
    describe("getChats", () => {
      it("should retrieve all chats from storage", async () => {
        const chats: ChatModel[] = [
          {
            id: "chat_1",
            type: "private",
            participantIds: ["user_1", "user_2"],
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isArchived: false,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "chat_2",
            type: "group",
            participantIds: ["user_1", "user_2", "user_3"],
            unreadCount: 5,
            isPinned: true,
            isMuted: false,
            isArchived: false,
            lastActivity: "2024-01-01T00:00:00Z",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockSecureStorage.secureGetJSON.mockResolvedValue(chats);

        const result = await dataSource.getChats();

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("chats");
        expect(result).toEqual(chats);
        expect(result).toHaveLength(2);
      });

      it("should return empty array when no chats exist", async () => {
        mockSecureStorage.secureGetJSON.mockResolvedValue(undefined);

        const result = await dataSource.getChats();

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it("should handle malformed JSON gracefully", async () => {
        mockSecureStorage.secureGetJSON.mockRejectedValue(new SyntaxError("Invalid JSON"));

        const result = await dataSource.getChats();

        expect(result).toEqual([]);
      });
    });

    describe("saveChats", () => {
      it("should save chats to storage", async () => {
        const chats: ChatModel[] = [
          {
            id: "chat_123",
            type: "private",
            participantIds: ["user_1", "user_2"],
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isArchived: false,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveChats(chats);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("chats", chats);
      });

      it("should handle save errors", async () => {
        const chats: ChatModel[] = [];

        mockSecureStorage.secureSetJSON.mockRejectedValue(new Error("Storage error"));

        await expect(dataSource.saveChats(chats)).rejects.toThrow(
          "Failed to save chats to local storage"
        );
      });
    });

    describe("getChatById", () => {
      it("should retrieve chat by id", async () => {
        const chat: ChatModel = {
          id: "chat_456",
          type: "private",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastActivity: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const allChats = [chat];
        mockSecureStorage.secureGetJSON.mockResolvedValue(allChats);

        const result = await dataSource.getChatById("chat_456");

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("chats");
        expect(result).toEqual(chat);
      });

      it("should return null when chat not found", async () => {
        const allChats: ChatModel[] = [
          {
            id: "chat_other",
            type: "private",
            participantIds: ["user_1", "user_2"],
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isArchived: false,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockSecureStorage.secureGetJSON.mockResolvedValue(allChats);

        const result = await dataSource.getChatById("nonexistent");

        expect(result).toBeNull();
      });
    });

    describe("saveChat", () => {
      it("should save single chat", async () => {
        const chat: ChatModel = {
          id: "chat_new",
          type: "private",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastActivity: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const existingChats: ChatModel[] = [];
        mockSecureStorage.secureGetJSON.mockResolvedValue(existingChats);
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveChat(chat);

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("chats");
        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("chats", [chat]);
      });

      it("should update existing chat", async () => {
        const existingChat: ChatModel = {
          id: "chat_existing",
          type: "private",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastActivity: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const updatedChat = { ...existingChat, unreadCount: 5 };
        mockSecureStorage.secureGetJSON.mockResolvedValue([existingChat]);
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveChat(updatedChat);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("chats", [updatedChat]);
      });
    });

    describe("deleteChat", () => {
      it("should delete chat from storage", async () => {
        const chat1: ChatModel = {
          id: "chat_1",
          type: "private",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastActivity: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
        const chat2: ChatModel = {
          id: "chat_2",
          type: "private",
          participantIds: ["user_1", "user_3"],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastActivity: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        mockSecureStorage.secureGetJSON.mockResolvedValue([chat1, chat2]);
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.deleteChat("chat_1");

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("chats", [chat2]);
      });

      it("should handle delete errors", async () => {
        const error = new Error("Delete failed");
        mockSecureStorage.secureGetJSON.mockImplementation(() => {
          throw error;
        });

        await expect(dataSource.deleteChat("chat_123")).rejects.toThrow("Failed to delete chat");
      });
    });
  });

  describe("Message Operations", () => {
    describe("getMessages", () => {
      it("should retrieve all messages from storage", async () => {
        const messages: MessageModel[] = [
          {
            id: "msg_1",
            chatId: "chat_456",
            senderId: "user_1",
            type: "text",
            text: "Message 1",
            timestamp: "2024-01-01T00:00:00Z",
            status: "sent",
            reactions: [],
            edited: false,
            localOnly: false,
          },
          {
            id: "msg_2",
            chatId: "chat_456",
            senderId: "user_2",
            type: "text",
            text: "Message 2",
            timestamp: "2024-01-01T01:00:00Z",
            status: "sent",
            reactions: [],
            edited: false,
            localOnly: false,
          },
        ];

        mockSecureStorage.secureGetJSON.mockResolvedValue(messages);

        const result = await dataSource.getMessages("chat_456");

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("messages_chat_456");
        expect(result).toEqual(messages);
        expect(result).toHaveLength(2);
      });

      it("should return empty array when no messages exist", async () => {
        mockSecureStorage.secureGetJSON.mockResolvedValue(undefined);

        const result = await dataSource.getMessages("chat_456");

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe("saveMessages", () => {
      it("should save messages to storage", async () => {
        const messages: MessageModel[] = [
          {
            id: "msg_123",
            chatId: "chat_456",
            senderId: "user_1",
            type: "text",
            text: "Hello world",
            timestamp: "2024-01-01T00:00:00Z",
            status: "sent",
            reactions: [],
            edited: false,
            localOnly: false,
          },
        ];

        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveMessages("chat_456", messages);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("messages_chat_456", messages);
      });
    });

    describe("saveMessage", () => {
      it("should save single message", async () => {
        const message: MessageModel = {
          id: "msg_new",
          chatId: "chat_456",
          senderId: "user_1",
          type: "text",
          text: "New message",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          reactions: [],
          edited: false,
          localOnly: false,
        };

        const existingMessages: MessageModel[] = [];
        mockSecureStorage.secureGetJSON.mockResolvedValue(existingMessages);
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveMessage(message);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("messages_chat_456", [
          message,
        ]);
      });

      it("should update existing message", async () => {
        const existingMessage: MessageModel = {
          id: "msg_existing",
          chatId: "chat_456",
          senderId: "user_1",
          type: "text",
          text: "Original message",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          reactions: [],
          edited: false,
          localOnly: false,
        };

        const updatedMessage = { ...existingMessage, text: "Updated message", edited: true };
        mockSecureStorage.secureGetJSON.mockResolvedValue([existingMessage]);
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveMessage(updatedMessage);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("messages_chat_456", [
          updatedMessage,
        ]);
      });
    });

    describe("getMessagesByChatId", () => {
      it("should retrieve messages for specific chat", async () => {
        const message1: MessageModel = {
          id: "msg_1",
          chatId: "chat_456",
          senderId: "user_1",
          type: "text",
          text: "Message 1",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          reactions: [],
          edited: false,
          localOnly: false,
        };
        const message2: MessageModel = {
          id: "msg_2",
          chatId: "chat_456",
          senderId: "user_2",
          type: "text",
          text: "Message 2",
          timestamp: "2024-01-01T01:00:00Z",
          status: "sent",
          reactions: [],
          edited: false,
          localOnly: false,
        };

        mockSecureStorage.secureGetJSON.mockResolvedValue([message1, message2]);

        const result = await dataSource.getMessagesByChatId("chat_456");

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("messages_chat_456");
        expect(result).toEqual([message1, message2]);
        expect(result).toHaveLength(2);
      });

      it("should return empty array for chat with no messages", async () => {
        mockSecureStorage.secureGetJSON.mockResolvedValue(undefined);

        const result = await dataSource.getMessagesByChatId("chat_456");

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe("deleteMessage", () => {
      it("should delete message from storage", async () => {
        const message1: MessageModel = {
          id: "msg_1",
          chatId: "chat_456",
          senderId: "user_1",
          type: "text",
          text: "Message 1",
          timestamp: "2024-01-01T00:00:00Z",
          status: "sent",
          reactions: [],
          edited: false,
          localOnly: false,
        };
        const message2: MessageModel = {
          id: "msg_2",
          chatId: "chat_456",
          senderId: "user_2",
          type: "text",
          text: "Message 2",
          timestamp: "2024-01-01T01:00:00Z",
          status: "sent",
          reactions: [],
          edited: false,
          localOnly: false,
        };

        mockSecureStorage.secureGetJSON.mockResolvedValue([message1, message2]);
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.deleteMessage("chat_456", "msg_1");

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("messages_chat_456", [
          message2,
        ]);
      });
    });

    describe("clearMessagesByChatId", () => {
      it("should clear all messages for specific chat", async () => {
        mockSecureStorage.secureDelete.mockResolvedValue(undefined);

        await dataSource.clearMessagesByChatId("chat_456");

        expect(mockSecureStorage.secureDelete).toHaveBeenCalledWith("messages_chat_456");
      });
    });
  });

  describe("User Operations", () => {
    describe("getUsers", () => {
      it("should retrieve all users from storage", async () => {
        const users: UserModel[] = [
          {
            id: "user_1",
            name: "User 1",
            phone: "+1234567890",
            isOnline: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "user_2",
            name: "User 2",
            phone: "+0987654321",
            isOnline: false,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockSecureStorage.secureGetJSON.mockResolvedValue(users);

        const result = await dataSource.getUsers();

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("users");
        expect(result).toEqual(users);
        expect(result).toHaveLength(2);
      });
    });

    describe("saveUsers", () => {
      it("should save users to storage", async () => {
        const users: UserModel[] = [
          {
            id: "user_123",
            name: "John Doe",
            phone: "+1234567890",
            isOnline: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveUsers(users);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("users", users);
      });
    });

    describe("getUserById", () => {
      it("should retrieve user by id", async () => {
        const user: UserModel = {
          id: "user_456",
          name: "Jane Doe",
          phone: "+0987654321",
          isOnline: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const allUsers = [user];
        mockSecureStorage.secureGetJSON.mockResolvedValue(allUsers);

        const result = await dataSource.getUserById("user_456");

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("users");
        expect(result).toEqual(user);
      });

      it("should return null when user not found", async () => {
        const allUsers: UserModel[] = [
          {
            id: "user_other",
            name: "Other User",
            phone: "+1122334455",
            isOnline: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockSecureStorage.secureGetJSON.mockResolvedValue(allUsers);

        const result = await dataSource.getUserById("nonexistent");

        expect(result).toBeNull();
      });
    });

    describe("saveUser", () => {
      it("should save single user", async () => {
        const user: UserModel = {
          id: "user_new",
          name: "New User",
          phone: "+5551234567",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const existingUsers: UserModel[] = [];
        mockSecureStorage.secureGetJSON.mockResolvedValue(existingUsers);
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveUser(user);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("users", [user]);
      });
    });

    describe("getCurrentUser", () => {
      it("should retrieve current user from storage", async () => {
        const user: UserModel = {
          id: "user_current",
          name: "Current User",
          phone: "+1122334455",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        mockSecureStorage.secureGetJSON.mockResolvedValue(user);

        const result = await dataSource.getCurrentUser();

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("current_user");
        expect(result).toEqual(user);
      });

      it("should return null when no current user", async () => {
        mockSecureStorage.secureGetJSON.mockResolvedValue(undefined);

        const result = await dataSource.getCurrentUser();

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("current_user");
        expect(result).toBeNull();
      });
    });

    describe("saveCurrentUser", () => {
      it("should set current user in storage", async () => {
        const user: UserModel = {
          id: "user_new_current",
          name: "New Current User",
          phone: "+5551234567",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveCurrentUser(user);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("current_user", user);
      });

      it("should clear current user when null", async () => {
        mockSecureStorage.secureDelete.mockResolvedValue(undefined);

        await dataSource.saveCurrentUser(null);

        expect(mockSecureStorage.secureDelete).toHaveBeenCalledWith("current_user");
      });
    });
  });

  describe("Settings Operations", () => {
    describe("getSettings", () => {
      it("should retrieve settings from storage", async () => {
        const settings = { darkMode: true, fontSize: "large" };
        mockSecureStorage.secureGetJSON.mockResolvedValue(settings);

        const result = await dataSource.getSettings();

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("settings");
        expect(result).toEqual(settings);
      });

      it("should return null when no settings exist", async () => {
        mockSecureStorage.secureGetJSON.mockResolvedValue(undefined);

        const result = await dataSource.getSettings();

        expect(result).toBeNull();
      });
    });

    describe("saveSettings", () => {
      it("should save settings to storage", async () => {
        const settings = { darkMode: false, fontSize: "small" };
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveSettings(settings);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("settings", settings);
      });
    });
  });

  describe("Sync State Operations", () => {
    describe("getSyncState", () => {
      it("should retrieve sync state from storage", async () => {
        const syncState = { lastSync: "2024-01-01T00:00:00Z" };
        mockSecureStorage.secureGetJSON.mockResolvedValue(syncState);

        const result = await dataSource.getSyncState();

        expect(mockSecureStorage.secureGetJSON).toHaveBeenCalledWith("sync_state");
        expect(result).toEqual(syncState);
      });

      it("should return null when no sync state exists", async () => {
        mockSecureStorage.secureGetJSON.mockResolvedValue(undefined);

        const result = await dataSource.getSyncState();

        expect(result).toBeNull();
      });
    });

    describe("saveSyncState", () => {
      it("should save sync state to storage", async () => {
        const syncState = { lastSync: "2024-01-01T01:00:00Z" };
        mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

        await dataSource.saveSyncState(syncState);

        expect(mockSecureStorage.secureSetJSON).toHaveBeenCalledWith("sync_state", syncState);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle JSON parsing errors gracefully", async () => {
      mockSecureStorage.secureGetJSON.mockRejectedValue(new SyntaxError("Invalid JSON"));

      const result = await dataSource.getChats();

      expect(result).toEqual([]);
    });

    it("should handle storage write failures", async () => {
      const chats: ChatModel[] = [];

      mockSecureStorage.secureSetJSON.mockRejectedValue(new Error("Storage full"));

      await expect(dataSource.saveChats(chats)).rejects.toThrow(
        "Failed to save chats to local storage"
      );
    });

    it("should handle storage read failures", async () => {
      mockSecureStorage.secureGetJSON.mockRejectedValue(new Error("Storage corrupted"));

      await expect(dataSource.getChats()).rejects.toThrow("Failed to get chats from local storage");
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", async () => {
      const largeChats: ChatModel[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `chat_${i}`,
        type: "private",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        lastActivity: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }));

      mockSecureStorage.secureGetJSON.mockResolvedValue(largeChats);

      const startTime = Date.now();
      const result = await dataSource.getChats();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data type consistency", async () => {
      const chat: ChatModel = {
        id: "chat_consistency",
        type: "private",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        lastActivity: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const allChats = [chat];
      mockSecureStorage.secureGetJSON.mockResolvedValue(allChats);
      mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

      await dataSource.saveChat(chat);
      const result = await dataSource.getChatById("chat_consistency");
      if (!result) throw new Error("Expected chat to be defined");

      expect(result).toEqual(chat);
      expect(typeof result.id).toBe("string");
      expect(typeof result.type).toBe("string");
      expect(Array.isArray(result.participantIds)).toBe(true);
    });

    it("should handle special characters in data", async () => {
      const chat: ChatModel = {
        id: "chat_special",
        type: "group",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        lastActivity: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const allChats = [chat];
      mockSecureStorage.secureGetJSON.mockResolvedValue(allChats);
      mockSecureStorage.secureSetJSON.mockResolvedValue(undefined);

      await dataSource.saveChat(chat);
      const result = await dataSource.getChatById("chat_special");

      expect(result).toEqual(chat);
    });
  });

  describe("Clear All", () => {
    it("should clear all data", async () => {
      mockSecureStorage.secureClear.mockResolvedValue(undefined);

      await dataSource.clearAll();

      expect(mockSecureStorage.secureClear).toHaveBeenCalled();
    });

    it("should handle clear errors", async () => {
      mockSecureStorage.secureClear.mockRejectedValue(new Error("Clear failed"));

      await expect(dataSource.clearAll()).rejects.toThrow("Failed to clear all data");
    });
  });

  describe("getAllKeys", () => {
    it("should return empty array (not supported in secureStorage)", () => {
      const result = dataSource.getAllKeys();
      expect(result).toEqual([]);
    });
  });
});
