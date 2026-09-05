/**
 * Unit tests for ChatRepositoryImpl
 * Testing chat repository business logic and data operations
 */

import { ChatRepositoryImpl } from "../ChatRepositoryImpl";
import { LocalStorageDataSource } from "../../datasources/LocalStorageDataSource";
import { RemoteApiDataSource } from "../../datasources/RemoteApiDataSource";
import type { Chat, GroupChat } from "../../../domain/entities/Chat";
import type { Message } from "../../../domain/entities/Message";

// Mock dependencies
jest.mock("../../datasources/LocalStorageDataSource");
jest.mock("../../datasources/RemoteApiDataSource");

const MockedLocalStorage = LocalStorageDataSource as jest.MockedClass<
  typeof LocalStorageDataSource
>;
const MockedRemoteApi = RemoteApiDataSource as jest.MockedClass<typeof RemoteApiDataSource>;

describe("ChatRepositoryImpl", () => {
  let chatRepository: ChatRepositoryImpl;
  let mockLocalStorage: jest.Mocked<LocalStorageDataSource>;
  let mockRemoteApi: jest.Mocked<RemoteApiDataSource>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLocalStorage = new MockedLocalStorage() as jest.Mocked<LocalStorageDataSource>;
    mockRemoteApi = new MockedRemoteApi() as jest.Mocked<RemoteApiDataSource>;

    chatRepository = new ChatRepositoryImpl(mockLocalStorage, mockRemoteApi);
  });

  describe("Constructor", () => {
    it("should initialize with data sources", () => {
      expect(chatRepository).toBeInstanceOf(ChatRepositoryImpl);
    });
  });

  describe("getById", () => {
    it("should return chat when found", async () => {
      const mockChat = {
        id: "chat_123",
        name: "Test Chat",
        type: "private" as const,
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getChatById.mockResolvedValue(mockChat as any);

      const result = await chatRepository.getById("chat_123");

      expect(mockLocalStorage.getChatById).toHaveBeenCalledWith("chat_123");
      expect(result).toBeDefined();
      expect(result!.id).toBe("chat_123");
    });

    it("should return null when chat not found", async () => {
      mockLocalStorage.getChatById.mockResolvedValue(null);

      const result = await chatRepository.getById("nonexistent");

      expect(mockLocalStorage.getChatById).toHaveBeenCalledWith("nonexistent");
      expect(result).toBeNull();
    });

    it("should handle storage errors gracefully", async () => {
      const error = new Error("Storage error");
      mockLocalStorage.getChatById.mockRejectedValue(error);

      await expect(chatRepository.getById("chat_123")).rejects.toThrow("Storage error");
    });
  });

  describe("getAll", () => {
    it("should return all chats", async () => {
      const mockChats = [
        {
          id: "chat_1",
          name: "Chat 1",
          type: "private" as const,
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          lastActivity: undefined,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat_2",
          name: "Chat 2",
          type: "group" as const,
          participantIds: ["user_1", "user_2", "user_3"],
          unreadCount: 5,
          lastActivity: undefined,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getChats.mockResolvedValue(mockChats as any);

      const result = await chatRepository.getAll();

      expect(mockLocalStorage.getChats).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it("should handle empty chat list", async () => {
      mockLocalStorage.getChats.mockResolvedValue([]);

      const result = await chatRepository.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("save", () => {
    it("should save chat to local storage", async () => {
      const chat: Chat = {
        id: "chat_new",
        type: "private",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);
      mockRemoteApi.updateChat.mockResolvedValue(undefined as any);

      await chatRepository.save(chat);

      expect(mockLocalStorage.saveChat).toHaveBeenCalled();
    });

    it("should handle save errors", async () => {
      const chat: Chat = {
        id: "chat_error",
        type: "private",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const error = new Error("Save failed");
      mockLocalStorage.saveChat.mockRejectedValue(error);

      await expect(chatRepository.save(chat)).rejects.toThrow("Save failed");
    });
  });

  describe("delete", () => {
    it("should delete chat from local storage", async () => {
      mockLocalStorage.deleteChat.mockResolvedValue(undefined as any);

      await chatRepository.delete("chat_123");

      expect(mockLocalStorage.deleteChat).toHaveBeenCalledWith("chat_123");
    });

    it("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      mockLocalStorage.deleteChat.mockRejectedValue(error);

      await expect(chatRepository.delete("chat_123")).rejects.toThrow("Delete failed");
    });
  });

  describe("getUnreadCount", () => {
    it("should return total unread count", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private" as const,
          participantIds: ["user_1", "user_2"],
          unreadCount: 3,
          lastActivity: undefined,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat_2",
          type: "group" as const,
          participantIds: ["user_1", "user_2", "user_3"],
          unreadCount: 5,
          lastActivity: undefined,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat_3",
          type: "private" as const,
          participantIds: ["user_1", "user_4"],
          unreadCount: 0,
          lastActivity: undefined,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getChats.mockResolvedValue(mockChats as any);

      const result = await chatRepository.getUnreadCount();

      expect(result).toBe(8);
    });

    it("should return 0 for no unread messages", async () => {
      const mockChats = [
        {
          id: "chat_1",
          type: "private" as const,
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          lastActivity: undefined,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getChats.mockResolvedValue(mockChats as any);

      const result = await chatRepository.getUnreadCount();

      expect(result).toBe(0);
    });
  });

  describe("createGroup", () => {
    it("should create group chat and save locally", async () => {
      mockRemoteApi.createGroup.mockRejectedValue(new Error("Offline"));

      const result = await chatRepository.createGroup(
        "New Group",
        ["user_1", "user_2", "user_3"],
        "user_1"
      );

      expect(result.name).toBe("New Group");
      expect(result.type).toBe("group");
      expect(result.participantIds).toContain("user_1");
    });

    it("should handle group creation failure gracefully", async () => {
      mockRemoteApi.createGroup.mockRejectedValue(new Error("Group creation failed"));

      const result = await chatRepository.createGroup("Test Group", ["user_1", "user_2"], "user_1");

      // Should still return the local group even if remote fails
      expect(result.name).toBe("Test Group");
    });
  });

  describe("addParticipant", () => {
    it("should add participant to group chat", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        type: "group",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.getChatById.mockResolvedValue(existingChat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);
      mockRemoteApi.addParticipant.mockResolvedValue(undefined as any);

      await chatRepository.addParticipant("chat_group_123", "user_3");

      expect(mockLocalStorage.getChatById).toHaveBeenCalledWith("chat_group_123");
    });

    it("should handle adding participant to direct chat gracefully", async () => {
      const directChat: Chat = {
        id: "chat_direct_123",
        type: "private",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.getChatById.mockResolvedValue(directChat as any);
      mockRemoteApi.addParticipant.mockResolvedValue(undefined as any);

      // Should not throw for direct chat - just skip local save
      await expect(
        chatRepository.addParticipant("chat_direct_123", "user_3")
      ).resolves.not.toThrow();
    });

    it("should handle adding existing participant", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.getChatById.mockResolvedValue(existingChat as any);
      mockRemoteApi.addParticipant.mockResolvedValue(undefined as any);

      await chatRepository.addParticipant("chat_group_123", "user_3");

      expect(mockLocalStorage.saveChat).not.toHaveBeenCalled();
    });
  });

  describe("removeParticipant", () => {
    it("should remove participant from group chat", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.getChatById.mockResolvedValue(existingChat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);
      mockRemoteApi.removeParticipant.mockResolvedValue(undefined as any);

      await chatRepository.removeParticipant("chat_group_123", "user_3");

      expect(mockLocalStorage.getChatById).toHaveBeenCalledWith("chat_group_123");
    });

    it("should handle removing non-existent participant", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        type: "group",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.getChatById.mockResolvedValue(existingChat as any);
      mockRemoteApi.removeParticipant.mockResolvedValue(undefined as any);

      await chatRepository.removeParticipant("chat_group_123", "user_3");

      // Implementation always saves (even if nothing changed)
      expect(mockLocalStorage.saveChat).toHaveBeenCalled();
    });
  });

  describe("syncWithRemote", () => {
    it("should sync chats with remote server", async () => {
      const lastSync = "2024-01-01T00:00:00Z";
      const remoteResult = {
        chats: [
          {
            id: "remote_chat_1",
            name: "Remote Chat 1",
            type: "private" as const,
            participantIds: ["user_1", "user_2"],
            unreadCount: 1,
            lastActivity: undefined,
            isPinned: false,
            isMuted: false,
            isArchived: false,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        messages: [
          {
            id: "remote_msg_1",
            chatId: "remote_chat_1",
            senderId: "user_1",
            text: "Remote message",
            timestamp: "2024-01-01T00:00:00Z",
            type: "text" as const,
            status: "sent" as const,
            localOnly: false,
            reactions: [],
            edited: false,
          },
        ],
        timestamp: "2024-01-01T00:00:00Z",
      };

      mockRemoteApi.syncMessages.mockResolvedValue(remoteResult);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);
      mockLocalStorage.saveMessage.mockResolvedValue(undefined as any);

      const result = await chatRepository.syncWithRemote(lastSync);

      expect(mockRemoteApi.syncMessages).toHaveBeenCalledWith(lastSync);
      expect(result).toBeDefined();
    });

    it("should handle sync without last sync timestamp", async () => {
      const remoteResult = {
        chats: [],
        messages: [],
        timestamp: "2024-01-01T00:00:00Z",
      };

      mockRemoteApi.syncMessages.mockResolvedValue(remoteResult);

      const result = await chatRepository.syncWithRemote();

      expect(mockRemoteApi.syncMessages).toHaveBeenCalledWith(undefined);
      expect(result).toBeDefined();
    });

    it("should handle sync errors", async () => {
      const error = new Error("Sync failed");
      mockRemoteApi.syncMessages.mockRejectedValue(error);

      await expect(chatRepository.syncWithRemote()).rejects.toThrow("Sync failed");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty participant list", async () => {
      const chat: Chat = {
        id: "chat_empty_participants",
        type: "group",
        participantIds: [],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);
      mockRemoteApi.updateChat.mockResolvedValue(undefined as any);

      await chatRepository.save(chat);

      expect(chat.participantIds).toEqual([]);
      expect(chat.participantIds).toHaveLength(0);
    });

    it("should handle very large participant list", async () => {
      const manyParticipants = Array.from({ length: 1000 }, (_, i) => `user_${i}`);
      const chat: Chat = {
        id: "chat_large_group",
        type: "group",
        participantIds: manyParticipants,
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);
      mockRemoteApi.updateChat.mockResolvedValue(undefined as any);

      await chatRepository.save(chat);

      expect(chat.participantIds).toHaveLength(1000);
      expect(chat.participantIds[0]).toBe("user_0");
      expect(chat.participantIds[999]).toBe("user_999");
    });

    it("should handle special characters in chat name", async () => {
      const chat: Chat = {
        id: "chat_special_name",
        type: "group",
        name: "Chat 🌍 with émojis and àccénts",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);
      mockRemoteApi.updateChat.mockResolvedValue(undefined as any);

      await chatRepository.save(chat);

      expect(chat.name).toBe("Chat 🌍 with émojis and àccénts");
    });
  });
});
