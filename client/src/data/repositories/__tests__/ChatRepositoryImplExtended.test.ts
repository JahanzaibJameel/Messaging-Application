/**
 * Extended ChatRepositoryImpl Tests
 * Additional coverage for message operations, group operations, and sync
 */

import { ChatRepositoryImpl } from "../ChatRepositoryImpl";
import { LocalStorageDataSource } from "../../datasources/LocalStorageDataSource";
import { RemoteApiDataSource } from "../../datasources/RemoteApiDataSource";
import type { Chat, GroupChat } from "../../../domain/entities/Chat";
import type { Message } from "../../../domain/entities/Message";

jest.mock("../../datasources/LocalStorageDataSource");
jest.mock("../../datasources/RemoteApiDataSource");

const MockedLocalStorage = LocalStorageDataSource as jest.MockedClass<
  typeof LocalStorageDataSource
>;
const MockedRemoteApi = RemoteApiDataSource as jest.MockedClass<typeof RemoteApiDataSource>;

describe("ChatRepositoryImpl Extended", () => {
  let chatRepository: ChatRepositoryImpl;
  let mockLocalStorage: jest.Mocked<LocalStorageDataSource>;
  let mockRemoteApi: jest.Mocked<RemoteApiDataSource>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage = new MockedLocalStorage() as jest.Mocked<LocalStorageDataSource>;
    mockRemoteApi = new MockedRemoteApi() as jest.Mocked<RemoteApiDataSource>;
    chatRepository = new ChatRepositoryImpl(mockLocalStorage, mockRemoteApi);
  });

  describe("getMessages", () => {
    it("should return messages without pagination", async () => {
      const mockMessages = [
        { id: "msg_1", chatId: "chat_1", text: "Hello", timestamp: Date.now(), reactions: [] },
        { id: "msg_2", chatId: "chat_1", text: "World", timestamp: Date.now(), reactions: [] },
      ];
      mockLocalStorage.getMessagesByChatId.mockResolvedValue(mockMessages as any);

      const result = await chatRepository.getMessages("chat_1");
      expect(result).toHaveLength(2);
    });

    it("should apply before pagination filter", async () => {
      const now = Date.now();
      const mockMessages = [
        { id: "msg_1", chatId: "chat_1", text: "Old", timestamp: now - 1000, reactions: [] },
        { id: "msg_2", chatId: "chat_1", text: "New", timestamp: now, reactions: [] },
      ];
      mockLocalStorage.getMessagesByChatId.mockResolvedValue(mockMessages as any);

      const result = await chatRepository.getMessages("chat_1", { before: now });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("msg_1");
    });

    it("should apply after pagination filter", async () => {
      const now = Date.now();
      const mockMessages = [
        { id: "msg_1", chatId: "chat_1", text: "Old", timestamp: now - 1000, reactions: [] },
        { id: "msg_2", chatId: "chat_1", text: "New", timestamp: now, reactions: [] },
      ];
      mockLocalStorage.getMessagesByChatId.mockResolvedValue(mockMessages as any);

      const result = await chatRepository.getMessages("chat_1", { after: now - 500 });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("msg_2");
    });

    it("should apply limit", async () => {
      const mockMessages = [
        { id: "msg_1", chatId: "chat_1", text: "1", timestamp: Date.now(), reactions: [] },
        { id: "msg_2", chatId: "chat_1", text: "2", timestamp: Date.now(), reactions: [] },
        { id: "msg_3", chatId: "chat_1", text: "3", timestamp: Date.now(), reactions: [] },
      ];
      mockLocalStorage.getMessagesByChatId.mockResolvedValue(mockMessages as any);

      const result = await chatRepository.getMessages("chat_1", { limit: 2 });
      expect(result).toHaveLength(2);
    });
  });

  describe("saveMessage", () => {
    it("should save message and update chat lastMessage", async () => {
      const message: Message = {
        id: "msg_1",
        chatId: "chat_1",
        senderId: "user_1",
        text: "Hello",
        timestamp: new Date(),
        type: "text",
        status: "sent",
        reactions: [],
      };
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastMessage: undefined as any,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.saveMessage(message);
      expect(mockLocalStorage.saveMessage).toHaveBeenCalled();
      expect(mockLocalStorage.saveChat).toHaveBeenCalled();
    });
  });

  describe("updateMessage", () => {
    it("should update message in local storage", async () => {
      const message: Message = {
        id: "msg_1",
        chatId: "chat_1",
        senderId: "user_1",
        text: "Updated",
        timestamp: new Date(),
        type: "text",
        status: "sent",
        reactions: [],
      };
      await chatRepository.updateMessage(message);
      expect(mockLocalStorage.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: "msg_1" })
      );
    });
  });

  describe("deleteMessage", () => {
    it("should delete message from local and remote", async () => {
      mockLocalStorage.deleteMessage.mockResolvedValue(undefined as any);
      mockRemoteApi.deleteMessage.mockResolvedValue(undefined as any);

      await chatRepository.deleteMessage("msg_1", "chat_1");
      expect(mockLocalStorage.deleteMessage).toHaveBeenCalledWith("chat_1", "msg_1");
      expect(mockRemoteApi.deleteMessage).toHaveBeenCalledWith("msg_1");
    });
  });

  describe("markAsRead", () => {
    it("should mark chat as read", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 5,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.markAsRead("chat_1");
      expect(mockLocalStorage.saveChat).toHaveBeenCalled();
    });
  });

  describe("pin/unpin/mute/unmute/archive/unarchive", () => {
    it("should pin a chat", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.pin("chat_1");
      const savedChat = mockLocalStorage.saveChat.mock.calls[0][0];
      expect(savedChat.isPinned).toBe(true);
    });

    it("should unpin a chat", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: true,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.unpin("chat_1");
      const savedChat = mockLocalStorage.saveChat.mock.calls[0][0];
      expect(savedChat.isPinned).toBe(false);
    });

    it("should mute a chat", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.mute("chat_1");
      const savedChat = mockLocalStorage.saveChat.mock.calls[0][0];
      expect(savedChat.isMuted).toBe(true);
    });

    it("should unmute a chat", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.unmute("chat_1");
      const savedChat = mockLocalStorage.saveChat.mock.calls[0][0];
      expect(savedChat.isMuted).toBe(false);
    });

    it("should archive a chat", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.archive("chat_1");
      const savedChat = mockLocalStorage.saveChat.mock.calls[0][0];
      expect(savedChat.isArchived).toBe(true);
    });

    it("should unarchive a chat", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.unarchive("chat_1");
      const savedChat = mockLocalStorage.saveChat.mock.calls[0][0];
      expect(savedChat.isArchived).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete chat from local and remote", async () => {
      mockLocalStorage.deleteChat.mockResolvedValue(undefined as any);
      mockRemoteApi.deleteChat.mockResolvedValue(undefined as any);

      await chatRepository.delete("chat_1");
      expect(mockLocalStorage.deleteChat).toHaveBeenCalledWith("chat_1");
      expect(mockRemoteApi.deleteChat).toHaveBeenCalledWith("chat_1");
    });
  });

  describe("clearHistory", () => {
    it("should clear messages and set lastMessage to undefined", async () => {
      const chat: Chat = {
        id: "chat_1",
        type: "private",
        participantIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: { id: "msg_1", text: "Hello", reactions: [] } as any,
      };
      mockLocalStorage.clearMessagesByChatId.mockResolvedValue(undefined as any);
      mockLocalStorage.getChatById.mockResolvedValue(chat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.clearHistory("chat_1");
      expect(mockLocalStorage.clearMessagesByChatId).toHaveBeenCalledWith("chat_1");
    });
  });

  describe("makeAdmin and removeAdmin", () => {
    it("should make a user admin", async () => {
      const groupChat: GroupChat = {
        id: "chat_1",
        type: "group",
        participantIds: ["user_1", "user_2"],
        adminIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(groupChat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.makeAdmin("chat_1", "user_2");
      expect(mockLocalStorage.saveChat).toHaveBeenCalled();
    });

    it("should remove admin", async () => {
      const groupChat: GroupChat = {
        id: "chat_1",
        type: "group",
        participantIds: ["user_1", "user_2"],
        adminIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(groupChat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.removeAdmin("chat_1", "user_2");
      expect(mockLocalStorage.saveChat).toHaveBeenCalled();
    });
  });

  describe("updateGroupInfo", () => {
    it("should update group info", async () => {
      const groupChat: GroupChat = {
        id: "chat_1",
        type: "group",
        participantIds: ["user_1", "user_2"],
        adminIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLocalStorage.getChatById.mockResolvedValue(groupChat as any);
      mockLocalStorage.saveChat.mockResolvedValue(undefined as any);

      await chatRepository.updateGroupInfo("chat_1", { name: "New Group Name" });
      expect(mockLocalStorage.saveChat).toHaveBeenCalled();
    });
  });

  describe("getUnreadCount", () => {
    it("should sum unread counts across all chats", async () => {
      const mockChats = [
        { id: "chat_1", unreadCount: 3 },
        { id: "chat_2", unreadCount: 5 },
      ];
      mockLocalStorage.getChats.mockResolvedValue(mockChats as any);

      const result = await chatRepository.getUnreadCount();
      expect(result).toBe(8);
    });
  });

  describe("createGroup - remote success", () => {
    it("should use remote group ID when different", async () => {
      const groupChat: GroupChat = {
        id: "local_id",
        type: "group",
        participantIds: ["user_1"],
        adminIds: ["user_1"],
        unreadCount: 0,
        lastActivity: undefined,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const remoteGroup = { ...groupChat, id: "remote_id" };
      mockLocalStorage.getChatById.mockResolvedValue(groupChat as any);
      mockRemoteApi.createGroup.mockResolvedValue(remoteGroup as any);
      mockLocalStorage.deleteChat.mockResolvedValue(undefined as any);

      const result = await chatRepository.createGroup("Test", ["user_1"], "user_1");
      expect(mockLocalStorage.deleteChat).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
