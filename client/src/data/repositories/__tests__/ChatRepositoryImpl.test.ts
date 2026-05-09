/**
 * Unit tests for ChatRepositoryImpl
 * Testing chat repository business logic and data operations
 */

import { ChatRepositoryImpl } from "../ChatRepositoryImpl";
import { LocalStorageDataSource } from "../../datasources/LocalStorageDataSource";
import { RemoteApiDataSource } from "../../datasources/RemoteApiDataSource";
import { Chat, ChatType, ChatStatus } from "../../../domain/entities/Chat";
import { Message } from "../../../domain/entities/Message";

// Mock dependencies
jest.mock("../../datasources/LocalStorageDataSource");
jest.mock("../../datasources/RemoteApiDataSource");

describe("ChatRepositoryImpl", () => {
  let chatRepository: ChatRepositoryImpl;
  let mockLocalStorage: jest.Mocked<LocalStorageDataSource>;
  let mockRemoteApi: jest.Mocked<RemoteApiDataSource>;

  beforeEach(() => {
    mockLocalStorage = new LocalStorageDataSource() as jest.Mocked<LocalStorageDataSource>;
    mockRemoteApi = new RemoteApiDataSource() as jest.Mocked<RemoteApiDataSource>;

    chatRepository = new ChatRepositoryImpl(mockLocalStorage, mockRemoteApi);

    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with data sources", () => {
      expect(chatRepository).toBeInstanceOf(ChatRepositoryImpl);
    });
  });

  describe("getById", () => {
    it("should return chat when found", async () => {
      const mockChat: Chat = {
        id: "chat_123",
        name: "Test Chat",
        type: "direct",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getById.mockResolvedValue(mockChat);

      const result = await chatRepository.getById("chat_123");

      expect(mockLocalStorage.getById).toHaveBeenCalledWith("chat_123");
      expect(result).toEqual(mockChat);
    });

    it("should return null when chat not found", async () => {
      mockLocalStorage.getById.mockResolvedValue(null);

      const result = await chatRepository.getById("nonexistent");

      expect(mockLocalStorage.getById).toHaveBeenCalledWith("nonexistent");
      expect(result).toBeNull();
    });

    it("should handle storage errors gracefully", async () => {
      const error = new Error("Storage error");
      mockLocalStorage.getById.mockRejectedValue(error);

      await expect(chatRepository.getById("chat_123")).rejects.toThrow("Storage error");
    });
  });

  describe("getAll", () => {
    it("should return all chats", async () => {
      const mockChats: Chat[] = [
        {
          id: "chat_1",
          name: "Chat 1",
          type: "direct",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat_2",
          name: "Chat 2",
          type: "group",
          participantIds: ["user_1", "user_2", "user_3"],
          unreadCount: 5,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getAll.mockResolvedValue(mockChats);

      const result = await chatRepository.getAll();

      expect(mockLocalStorage.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockChats);
      expect(result).toHaveLength(2);
    });

    it("should handle empty chat list", async () => {
      mockLocalStorage.getAll.mockResolvedValue([]);

      const result = await chatRepository.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("save", () => {
    it("should save chat to local storage", async () => {
      const chat: Chat = {
        id: "chat_new",
        name: "New Chat",
        type: "direct",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.save.mockResolvedValue(chat);

      const result = await chatRepository.save(chat);

      expect(mockLocalStorage.save).toHaveBeenCalledWith(chat);
      expect(result).toEqual(chat);
    });

    it("should handle save errors", async () => {
      const chat: Chat = {
        id: "chat_error",
        name: "Error Chat",
        type: "direct",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const error = new Error("Save failed");
      mockLocalStorage.save.mockRejectedValue(error);

      await expect(chatRepository.save(chat)).rejects.toThrow("Save failed");
    });
  });

  describe("delete", () => {
    it("should delete chat from local storage", async () => {
      mockLocalStorage.delete.mockResolvedValue();

      await chatRepository.delete("chat_123");

      expect(mockLocalStorage.delete).toHaveBeenCalledWith("chat_123");
    });

    it("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      mockLocalStorage.delete.mockRejectedValue(error);

      await expect(chatRepository.delete("chat_123")).rejects.toThrow("Delete failed");
    });
  });

  describe("getByParticipantId", () => {
    it("should return chats for participant", async () => {
      const mockChats: Chat[] = [
        {
          id: "chat_1",
          name: "Chat 1",
          type: "direct",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat_2",
          name: "Chat 2",
          type: "direct",
          participantIds: ["user_3", "user_1"],
          unreadCount: 2,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getAll.mockResolvedValue(mockChats);

      const result = await chatRepository.getByParticipantId("user_1");

      expect(result).toHaveLength(2);
      expect(result![0].id).toBe("chat_1");
      expect(result![1].id).toBe("chat_2");
    });

    it("should return empty array for participant with no chats", async () => {
      const mockChats: Chat[] = [
        {
          id: "chat_1",
          name: "Chat 1",
          type: "direct",
          participantIds: ["user_2", "user_3"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getAll.mockResolvedValue(mockChats);

      const result = await chatRepository.getByParticipantId("user_1");

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("getUnreadCount", () => {
    it("should return total unread count", async () => {
      const mockChats: Chat[] = [
        {
          id: "chat_1",
          name: "Chat 1",
          type: "direct",
          participantIds: ["user_1", "user_2"],
          unreadCount: 3,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat_2",
          name: "Chat 2",
          type: "group",
          participantIds: ["user_1", "user_2", "user_3"],
          unreadCount: 5,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "chat_3",
          name: "Chat 3",
          type: "direct",
          participantIds: ["user_1", "user_4"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getAll.mockResolvedValue(mockChats);

      const result = await chatRepository.getUnreadCount();

      expect(result).toBe(8); // 3 + 5 + 0
    });

    it("should return 0 for no unread messages", async () => {
      const mockChats: Chat[] = [
        {
          id: "chat_1",
          name: "Chat 1",
          type: "direct",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockLocalStorage.getAll.mockResolvedValue(mockChats);

      const result = await chatRepository.getUnreadCount();

      expect(result).toBe(0);
    });
  });

  describe("updateUnreadCount", () => {
    it("should update unread count for existing chat", async () => {
      const existingChat: Chat = {
        id: "chat_123",
        name: "Test Chat",
        type: "direct",
        participantIds: ["user_1", "user_2"],
        unreadCount: 2,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const updatedChat = { ...existingChat, unreadCount: 5 };
      mockLocalStorage.getById.mockResolvedValue(existingChat);
      mockLocalStorage.save.mockResolvedValue(updatedChat);

      const result = await chatRepository.updateUnreadCount("chat_123", 5);

      expect(mockLocalStorage.getById).toHaveBeenCalledWith("chat_123");
      expect(mockLocalStorage.save).toHaveBeenCalledWith(updatedChat);
      expect(result).toEqual(updatedChat);
    });

    it("should handle updating non-existent chat", async () => {
      mockLocalStorage.getById.mockResolvedValue(null);

      await expect(chatRepository.updateUnreadCount("nonexistent", 5)).rejects.toThrow();
    });
  });

  describe("createGroup", () => {
    it("should create group chat and save locally", async () => {
      const groupChat = {
        id: "chat_group_new",
        name: "New Group",
        type: "group" as ChatType,
        participantIds: ["user_1", "user_2", "user_3"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active" as ChatStatus,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        description: "Test group chat",
        adminIds: ["user_1"],
      };

      const remoteGroup = {
        ...groupChat,
        id: "remote_group_123", // Server-generated ID
      };

      mockRemoteApi.createGroup.mockResolvedValue(remoteGroup);
      mockLocalStorage.delete.mockResolvedValue();
      mockLocalStorage.save.mockResolvedValue(remoteGroup);

      const result = await chatRepository.createGroup("New Group", ["user_1", "user_2", "user_3"]);

      expect(mockRemoteApi.createGroup).toHaveBeenCalledWith("New Group", [
        "user_1",
        "user_2",
        "user_3",
      ]);
      expect(mockLocalStorage.delete).toHaveBeenCalledWith("chat_group_new");
      expect(mockLocalStorage.save).toHaveBeenCalledWith(remoteGroup);
      expect(result).toEqual(remoteGroup);
    });

    it("should handle group creation failure", async () => {
      const error = new Error("Group creation failed");
      mockRemoteApi.createGroup.mockRejectedValue(error);

      await expect(chatRepository.createGroup("Test Group", ["user_1", "user_2"])).rejects.toThrow(
        "Group creation failed"
      );
    });
  });

  describe("addParticipant", () => {
    it("should add participant to group chat", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        name: "Test Group",
        type: "group",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const updatedChat = {
        ...existingChat,
        participantIds: ["user_1", "user_2", "user_3"],
      };

      mockLocalStorage.getById.mockResolvedValue(existingChat);
      mockRemoteApi.addParticipant.mockResolvedValue();
      mockLocalStorage.save.mockResolvedValue(updatedChat);

      await chatRepository.addParticipant("chat_group_123", "user_3");

      expect(mockLocalStorage.getById).toHaveBeenCalledWith("chat_group_123");
      expect(mockRemoteApi.addParticipant).toHaveBeenCalledWith("chat_group_123", "user_3");
      expect(mockLocalStorage.save).toHaveBeenCalledWith(updatedChat);
    });

    it("should handle adding participant to direct chat", async () => {
      const directChat: Chat = {
        id: "chat_direct_123",
        name: "Test Chat",
        type: "direct",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getById.mockResolvedValue(directChat);

      await expect(chatRepository.addParticipant("chat_direct_123", "user_3")).rejects.toThrow();
    });

    it("should handle adding existing participant", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        name: "Test Group",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getById.mockResolvedValue(existingChat);

      await chatRepository.addParticipant("chat_group_123", "user_3");

      expect(mockRemoteApi.addParticipant).not.toHaveBeenCalled();
      expect(mockLocalStorage.save).not.toHaveBeenCalled();
    });
  });

  describe("removeParticipant", () => {
    it("should remove participant from group chat", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        name: "Test Group",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const updatedChat = {
        ...existingChat,
        participantIds: ["user_1", "user_2"],
      };

      mockLocalStorage.getById.mockResolvedValue(existingChat);
      mockRemoteApi.removeParticipant.mockResolvedValue();
      mockLocalStorage.save.mockResolvedValue(updatedChat);

      await chatRepository.removeParticipant("chat_group_123", "user_3");

      expect(mockLocalStorage.getById).toHaveBeenCalledWith("chat_group_123");
      expect(mockRemoteApi.removeParticipant).toHaveBeenCalledWith("chat_group_123", "user_3");
      expect(mockLocalStorage.save).toHaveBeenCalledWith(updatedChat);
    });

    it("should handle removing non-existent participant", async () => {
      const existingChat: Chat = {
        id: "chat_group_123",
        name: "Test Group",
        type: "group",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.getById.mockResolvedValue(existingChat);

      await chatRepository.removeParticipant("chat_group_123", "user_3");

      expect(mockRemoteApi.removeParticipant).not.toHaveBeenCalled();
      expect(mockLocalStorage.save).not.toHaveBeenCalled();
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
            type: "direct",
            participantIds: ["user_1", "user_2"],
            unreadCount: 1,
            lastActivity: "2024-01-01T00:00:00Z",
            status: "active",
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
            type: "text",
            status: "sent",
            localOnly: false,
          },
        ],
        timestamp: "2024-01-01T00:00:00Z",
      };

      mockRemoteApi.syncChats.mockResolvedValue(remoteResult);

      const result = await chatRepository.syncWithRemote(lastSync);

      expect(mockRemoteApi.syncChats).toHaveBeenCalledWith(lastSync);
      expect(result).toEqual(remoteResult);
    });

    it("should handle sync without last sync timestamp", async () => {
      const remoteResult = {
        chats: [],
        messages: [],
        timestamp: "2024-01-01T00:00:00Z",
      };

      mockRemoteApi.syncChats.mockResolvedValue(remoteResult);

      const result = await chatRepository.syncWithRemote();

      expect(mockRemoteApi.syncChats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(remoteResult);
    });

    it("should handle sync errors", async () => {
      const error = new Error("Sync failed");
      mockRemoteApi.syncChats.mockRejectedValue(error);

      await expect(chatRepository.syncWithRemote()).rejects.toThrow("Sync failed");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty participant list", async () => {
      const chat: Chat = {
        id: "chat_empty_participants",
        name: "Empty Chat",
        type: "group",
        participantIds: [],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.save.mockResolvedValue(chat);

      const result = await chatRepository.save(chat);

      expect(result.participantIds).toEqual([]);
      expect(result.participantIds).toHaveLength(0);
    });

    it("should handle very large participant list", async () => {
      const manyParticipants = Array.from({ length: 1000 }, (_, i) => `user_${i}`);
      const chat: Chat = {
        id: "chat_large_group",
        name: "Large Group",
        type: "group",
        participantIds: manyParticipants,
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.save.mockResolvedValue(chat);

      const result = await chatRepository.save(chat);

      expect(result.participantIds).toHaveLength(1000);
      expect(result.participantIds[0]).toBe("user_0");
      expect(result.participantIds[999]).toBe("user_999");
    });

    it("should handle special characters in chat name", async () => {
      const chat: Chat = {
        id: "chat_special_name",
        name: "Chat 🌍 with émojis and àccénts",
        type: "group",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockLocalStorage.save.mockResolvedValue(chat);

      const result = await chatRepository.save(chat);

      expect(result.name).toBe("Chat 🌍 with émojis and àccénts");
    });
  });
});
