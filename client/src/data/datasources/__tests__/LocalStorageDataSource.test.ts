/**
 * Unit tests for LocalStorageDataSource
 * Testing local data storage operations
 */

import { LocalStorageDataSource } from "../LocalStorageDataSource";
import type { ChatModel, MessageModel, UserModel } from "../../models/MessageModel";

// Mock MMKV
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    contains: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

describe("LocalStorageDataSource", () => {
  let dataSource: LocalStorageDataSource;
  let mockMMKV: any;

  beforeEach(() => {
    mockMMKV = new (require("react-native-mmkv").MMKV)();
    dataSource = new LocalStorageDataSource();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize MMKV storage", () => {
      expect(dataSource).toBeInstanceOf(LocalStorageDataSource);
      expect(require("react-native-mmkv").MMKV).toHaveBeenCalled();
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

        mockMMKV.getString.mockReturnValue(JSON.stringify(chats));

        const result = await dataSource.getChats();

        expect(mockMMKV.getString).toHaveBeenCalledWith("chats");
        expect(result).toEqual(chats);
        expect(result).toHaveLength(2);
      });

      it("should return empty array when no chats exist", async () => {
        mockMMKV.getString.mockReturnValue(undefined);

        const result = await dataSource.getChats();

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it("should handle malformed JSON gracefully", async () => {
        mockMMKV.getString.mockReturnValue("invalid json");

        const result = await dataSource.getChats();

        expect(mockMMKV.getString).toHaveBeenCalledWith("chats");
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

        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveChats(chats);

        expect(mockMMKV.set).toHaveBeenCalledWith("chats", JSON.stringify(chats));
      });

      it("should handle save errors", async () => {
        const chats: ChatModel[] = [];

        mockMMKV.set.mockImplementation(() => {
          throw new Error("Storage error");
        });

        await expect(dataSource.saveChats(chats)).rejects.toThrow("Storage error");
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
        mockMMKV.getString.mockReturnValue(JSON.stringify(allChats));

        const result = await dataSource.getChatById("chat_456");

        expect(mockMMKV.getString).toHaveBeenCalledWith("chats");
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

        mockMMKV.getString.mockReturnValue(JSON.stringify(allChats));

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
        mockMMKV.getString.mockReturnValue(JSON.stringify(existingChats));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveChat(chat);

        expect(mockMMKV.getString).toHaveBeenCalledWith("chats");
        expect(mockMMKV.set).toHaveBeenCalledWith("chats", JSON.stringify([chat]));
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
        mockMMKV.getString.mockReturnValue(JSON.stringify([existingChat]));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveChat(updatedChat);

        expect(mockMMKV.set).toHaveBeenCalledWith("chats", JSON.stringify([updatedChat]));
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

        mockMMKV.getString.mockReturnValue(JSON.stringify([chat1, chat2]));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.deleteChat("chat_1");

        expect(mockMMKV.set).toHaveBeenCalledWith("chats", JSON.stringify([chat2]));
      });

      it("should handle delete errors", async () => {
        const error = new Error("Delete failed");
        mockMMKV.getString.mockImplementation(() => {
          throw error;
        });

        await expect(dataSource.deleteChat("chat_123")).rejects.toThrow("Delete failed");
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

        mockMMKV.getString.mockReturnValue(JSON.stringify(messages));

        const result = await dataSource.getMessages();

        expect(mockMMKV.getString).toHaveBeenCalledWith("messages");
        expect(result).toEqual(messages);
        expect(result).toHaveLength(2);
      });

      it("should return empty array when no messages exist", async () => {
        mockMMKV.getString.mockReturnValue(undefined);

        const result = await dataSource.getMessages();

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

        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveMessages(messages);

        expect(mockMMKV.set).toHaveBeenCalledWith("messages", JSON.stringify(messages));
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
        mockMMKV.getString.mockReturnValue(JSON.stringify(existingMessages));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveMessage(message);

        expect(mockMMKV.set).toHaveBeenCalledWith("messages", JSON.stringify([message]));
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
        mockMMKV.getString.mockReturnValue(JSON.stringify([existingMessage]));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveMessage(updatedMessage);

        expect(mockMMKV.set).toHaveBeenCalledWith("messages", JSON.stringify([updatedMessage]));
      });
    });

    describe("getMessagesByChatId", () => {
      it("should retrieve messages for specific chat", async () => {
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
          {
            id: "msg_3",
            chatId: "chat_789",
            senderId: "user_3",
            type: "text",
            text: "Different chat message",
            timestamp: "2024-01-01T02:00:00Z",
            status: "sent",
            reactions: [],
            edited: false,
            localOnly: false,
          },
        ];

        mockMMKV.getString.mockReturnValue(JSON.stringify(messages));

        const result = await dataSource.getMessagesByChatId("chat_456");

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe("msg_1");
        expect(result[1].id).toBe("msg_2");
      });

      it("should return empty array for chat with no messages", async () => {
        const messages: MessageModel[] = [
          {
            id: "msg_1",
            chatId: "chat_789",
            senderId: "user_3",
            type: "text",
            text: "Different chat message",
            timestamp: "2024-01-01T02:00:00Z",
            status: "sent",
            reactions: [],
            edited: false,
            localOnly: false,
          },
        ];

        mockMMKV.getString.mockReturnValue(JSON.stringify(messages));

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

        mockMMKV.getString.mockReturnValue(JSON.stringify([message1, message2]));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.deleteMessage("msg_1");

        expect(mockMMKV.set).toHaveBeenCalledWith("messages", JSON.stringify([message2]));
      });
    });

    describe("clearMessagesByChatId", () => {
      it("should clear all messages for specific chat", async () => {
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
            chatId: "chat_789",
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

        mockMMKV.getString.mockReturnValue(JSON.stringify(messages));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.clearMessagesByChatId("chat_456");

        expect(mockMMKV.set).toHaveBeenCalledWith("messages", JSON.stringify([messages[1]]));
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

        mockMMKV.getString.mockReturnValue(JSON.stringify(users));

        const result = await dataSource.getUsers();

        expect(mockMMKV.getString).toHaveBeenCalledWith("users");
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

        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveUsers(users);

        expect(mockMMKV.set).toHaveBeenCalledWith("users", JSON.stringify(users));
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
        mockMMKV.getString.mockReturnValue(JSON.stringify(allUsers));

        const result = await dataSource.getUserById("user_456");

        expect(mockMMKV.getString).toHaveBeenCalledWith("users");
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

        mockMMKV.getString.mockReturnValue(JSON.stringify(allUsers));

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
        mockMMKV.getString.mockReturnValue(JSON.stringify(existingUsers));
        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveUser(user);

        expect(mockMMKV.set).toHaveBeenCalledWith("users", JSON.stringify([user]));
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

        mockMMKV.getString.mockReturnValue(JSON.stringify(user));

        const result = await dataSource.getCurrentUser();

        expect(mockMMKV.getString).toHaveBeenCalledWith("current_user");
        expect(result).toEqual(user);
      });

      it("should return null when no current user", async () => {
        mockMMKV.getString.mockReturnValue(undefined);

        const result = await dataSource.getCurrentUser();

        expect(mockMMKV.getString).toHaveBeenCalledWith("current_user");
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

        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveCurrentUser(user);

        expect(mockMMKV.set).toHaveBeenCalledWith("current_user", JSON.stringify(user));
      });

      it("should clear current user when null", async () => {
        mockMMKV.delete.mockReturnValue(true);

        await dataSource.saveCurrentUser(null);

        expect(mockMMKV.delete).toHaveBeenCalledWith("current_user");
      });
    });
  });

  describe("Settings Operations", () => {
    describe("getSettings", () => {
      it("should retrieve settings from storage", async () => {
        const settings = { darkMode: true, fontSize: "large" };
        mockMMKV.getString.mockReturnValue(JSON.stringify(settings));

        const result = await dataSource.getSettings();

        expect(mockMMKV.getString).toHaveBeenCalledWith("settings");
        expect(result).toEqual(settings);
      });

      it("should return null when no settings exist", async () => {
        mockMMKV.getString.mockReturnValue(undefined);

        const result = await dataSource.getSettings();

        expect(result).toBeNull();
      });
    });

    describe("saveSettings", () => {
      it("should save settings to storage", async () => {
        const settings = { darkMode: false, fontSize: "small" };
        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveSettings(settings);

        expect(mockMMKV.set).toHaveBeenCalledWith("settings", JSON.stringify(settings));
      });
    });
  });

  describe("Sync State Operations", () => {
    describe("getSyncState", () => {
      it("should retrieve sync state from storage", async () => {
        const syncState = { lastSync: "2024-01-01T00:00:00Z" };
        mockMMKV.getString.mockReturnValue(JSON.stringify(syncState));

        const result = await dataSource.getSyncState();

        expect(mockMMKV.getString).toHaveBeenCalledWith("sync_state");
        expect(result).toEqual(syncState);
      });

      it("should return null when no sync state exists", async () => {
        mockMMKV.getString.mockReturnValue(undefined);

        const result = await dataSource.getSyncState();

        expect(result).toBeNull();
      });
    });

    describe("saveSyncState", () => {
      it("should save sync state to storage", async () => {
        const syncState = { lastSync: "2024-01-01T01:00:00Z" };
        mockMMKV.set.mockReturnValue(true);

        await dataSource.saveSyncState(syncState);

        expect(mockMMKV.set).toHaveBeenCalledWith("sync_state", JSON.stringify(syncState));
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle JSON parsing errors gracefully", async () => {
      mockMMKV.getString.mockReturnValue('{"invalid": json}');

      const result = await dataSource.getChats();

      expect(result).toEqual([]);
    });

    it("should handle storage write failures", async () => {
      const chats: ChatModel[] = [];

      mockMMKV.set.mockImplementation(() => {
        throw new Error("Storage full");
      });

      await expect(dataSource.saveChats(chats)).rejects.toThrow("Storage full");
    });

    it("should handle storage read failures", async () => {
      mockMMKV.getString.mockImplementation(() => {
        throw new Error("Storage corrupted");
      });

      await expect(dataSource.getChats()).rejects.toThrow("Storage corrupted");
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

      mockMMKV.getString.mockReturnValue(JSON.stringify(largeChats));

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
      mockMMKV.getString.mockReturnValue(JSON.stringify(allChats));
      mockMMKV.set.mockReturnValue(true);

      await dataSource.saveChat(chat);
      const result = await dataSource.getChatById("chat_consistency");

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
      mockMMKV.getString.mockReturnValue(JSON.stringify(allChats));
      mockMMKV.set.mockReturnValue(true);

      await dataSource.saveChat(chat);
      const result = await dataSource.getChatById("chat_special");

      expect(result).toEqual(chat);
    });
  });
});
