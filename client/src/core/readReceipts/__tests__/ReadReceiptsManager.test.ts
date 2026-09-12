/**
 * Read Receipts Manager Tests
 * Tests for tracking and managing read receipts
 */

import {
  ReadReceiptsManager,
  getReadReceiptsManager,
  resetReadReceiptsManager,
  markMessageAsRead,
  markChatAsRead,
  getUnreadCount,
  getTotalUnreadCount,
} from "../ReadReceiptsManager";
import { useMessageStore, useChatStore } from "../../../presentation/stores";
import { Message } from "../../../domain/entities/Message";

jest.mock("../../../core/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../../../presentation/stores", () => ({
  useMessageStore: {
    getState: jest.fn(),
  },
  useChatStore: {
    getState: jest.fn(),
  },
}));

describe("ReadReceiptsManager", () => {
  let manager: ReadReceiptsManager;
  let mockMessageStore: any;
  let mockChatStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    resetReadReceiptsManager();
    manager = new ReadReceiptsManager({
      enableReadReceipts: true,
      autoMarkAsRead: false,
      readDelay: 0,
    });
    mockMessageStore = {
      getMessageById: jest.fn(),
      getMessagesByChatId: jest.fn(),
      updateMessage: jest.fn(),
    };
    mockChatStore = {
      getChatById: jest.fn(),
      updateChat: jest.fn(),
      getAllChats: jest.fn(),
    };
    (useMessageStore.getState as jest.Mock).mockReturnValue(mockMessageStore);
    (useChatStore.getState as jest.Mock).mockReturnValue(mockChatStore);
  });

  describe("Constructor", () => {
    it("should initialize with default config", () => {
      const defaultManager = new ReadReceiptsManager();
      const config = defaultManager.getConfig();
      expect(config.enableReadReceipts).toBe(true);
      expect(config.autoMarkAsRead).toBe(true);
    });

    it("should accept custom config", () => {
      const customManager = new ReadReceiptsManager({ enableReadReceipts: false, readDelay: 5000 });
      const config = customManager.getConfig();
      expect(config.enableReadReceipts).toBe(false);
      expect(config.readDelay).toBe(5000);
    });
  });

  describe("markMessageAsRead", () => {
    it("should return early when read receipts are disabled", async () => {
      const disabledManager = new ReadReceiptsManager({ enableReadReceipts: false });
      await disabledManager.markMessageAsRead("msg_1", "user_1");
      expect(mockMessageStore.updateMessage).not.toHaveBeenCalled();
    });

    it("should return early when destroyed", async () => {
      manager.destroy();
      await manager.markMessageAsRead("msg_1", "user_1");
      expect(mockMessageStore.updateMessage).not.toHaveBeenCalled();
    });

    it("should return early when message not found", async () => {
      mockMessageStore.getMessageById.mockReturnValue(null);
      await manager.markMessageAsRead("msg_1", "user_1");
      expect(mockMessageStore.updateMessage).not.toHaveBeenCalled();
    });

    it("should return early when message is sent by the user", async () => {
      mockMessageStore.getMessageById.mockReturnValue({
        senderId: "user_1",
        status: "sent",
        chatId: "chat_1",
      });
      await manager.markMessageAsRead("msg_1", "user_1");
      expect(mockMessageStore.updateMessage).not.toHaveBeenCalled();
    });

    it("should return early when message is already read", async () => {
      mockMessageStore.getMessageById.mockReturnValue({
        senderId: "user_2",
        status: "read",
        chatId: "chat_1",
      });
      await manager.markMessageAsRead("msg_1", "user_1");
      expect(mockMessageStore.updateMessage).not.toHaveBeenCalled();
    });

    it("should mark message as read", async () => {
      mockMessageStore.getMessageById.mockReturnValue({
        senderId: "user_2",
        status: "sent",
        chatId: "chat_1",
      });
      await manager.markMessageAsRead("msg_1", "user_1");
      expect(mockMessageStore.updateMessage).toHaveBeenCalledWith("msg_1", { status: "read" });
    });

    it("should throw AppError.network on failure", async () => {
      mockMessageStore.getMessageById.mockReturnValue({
        senderId: "user_2",
        status: "sent",
        chatId: "chat_1",
      });
      mockMessageStore.updateMessage.mockImplementation(() => {
        throw new Error("Store error");
      });
      await expect(manager.markMessageAsRead("msg_1", "user_1")).rejects.toThrow();
    });
  });

  describe("markMessagesAsRead", () => {
    it("should return early when disabled", async () => {
      const disabledManager = new ReadReceiptsManager({ enableReadReceipts: false });
      await disabledManager.markMessagesAsRead(["msg_1"], "user_1");
      expect(mockMessageStore.updateMessage).not.toHaveBeenCalled();
    });

    it("should mark multiple messages as read", async () => {
      mockMessageStore.getMessageById
        .mockReturnValueOnce({ senderId: "user_2", status: "sent", id: "msg_1", chatId: "chat_1" })
        .mockReturnValueOnce({ senderId: "user_2", status: "read", id: "msg_2", chatId: "chat_1" });
      await manager.markMessagesAsRead(["msg_1", "msg_2"], "user_1");
      expect(mockMessageStore.updateMessage).toHaveBeenCalledWith("msg_1", { status: "read" });
    });

    it("should return early when no messages to read", async () => {
      mockMessageStore.getMessageById.mockReturnValue(null);
      await manager.markMessagesAsRead([], "user_1");
      expect(mockMessageStore.updateMessage).not.toHaveBeenCalled();
    });
  });

  describe("markChatAsRead", () => {
    it("should return early when autoMarkAsRead is false", async () => {
      const disabledManager = new ReadReceiptsManager({ autoMarkAsRead: false });
      await disabledManager.markChatAsRead("chat_1", "user_1");
      expect(mockMessageStore.getMessagesByChatId).not.toHaveBeenCalled();
    });

    it("should return early when user not in participants", async () => {
      mockChatStore.getChatById.mockReturnValue({ participantIds: ["user_2"] });
      await manager.markChatAsRead("chat_1", "user_1");
      expect(mockMessageStore.getMessagesByChatId).not.toHaveBeenCalled();
    });

    it("should return early when chat not found", async () => {
      mockChatStore.getChatById.mockReturnValue(null);
      await manager.markChatAsRead("chat_1", "user_1");
      expect(mockMessageStore.getMessagesByChatId).not.toHaveBeenCalled();
    });
  });

  describe("cancelPendingReads", () => {
    it("should cancel pending reads for a chat", () => {
      // Just verify no error
      expect(() => manager.cancelPendingReads("chat_1", "user_1")).not.toThrow();
    });
  });

  describe("getReadReceiptStatus", () => {
    it("should return isRead false for non-existent message", () => {
      mockMessageStore.getMessageById.mockReturnValue(null);
      const status = manager.getReadReceiptStatus("msg_1");
      expect(status.isRead).toBe(false);
      expect(status.readBy).toEqual([]);
    });

    it("should return isRead true for read message", () => {
      mockMessageStore.getMessageById.mockReturnValue({ status: "read" });
      const status = manager.getReadReceiptStatus("msg_1");
      expect(status.isRead).toBe(true);
      expect(status.readBy).toEqual(["recipient"]);
    });
  });

  describe("getUnreadCount", () => {
    it("should return count of unread messages", () => {
      mockMessageStore.getMessagesByChatId.mockReturnValue([
        { senderId: "user_2", status: "sent" },
        { senderId: "user_1", status: "sent" },
        { senderId: "user_2", status: "read" },
      ]);
      const count = manager.getUnreadCount("chat_1", "user_1");
      expect(count).toBe(1);
    });

    it("should return 0 when all messages are read", () => {
      mockMessageStore.getMessagesByChatId.mockReturnValue([
        { senderId: "user_2", status: "read" },
      ]);
      const count = manager.getUnreadCount("chat_1", "user_1");
      expect(count).toBe(0);
    });
  });

  describe("getTotalUnreadCount", () => {
    it("should return total unread across all chats", () => {
      mockChatStore.getAllChats.mockReturnValue([{ id: "chat_1" }, { id: "chat_2" }]);
      mockMessageStore.getMessagesByChatId
        .mockReturnValueOnce([{ senderId: "user_2", status: "sent" }])
        .mockReturnValueOnce([]);
      const count = manager.getTotalUnreadCount("user_1");
      expect(count).toBe(1);
    });
  });

  describe("updateConfig", () => {
    it("should update configuration", () => {
      manager.updateConfig({ enableReadReceipts: false });
      const config = manager.getConfig();
      expect(config.enableReadReceipts).toBe(false);
    });
  });

  describe("destroy and clearPendingReads", () => {
    it("should destroy and clear pending reads", () => {
      expect(() => manager.destroy()).not.toThrow();
    });

    it("should clear pending reads", () => {
      expect(() => manager.clearPendingReads()).not.toThrow();
    });
  });

  describe("Singleton functions", () => {
    it("should return singleton instance", () => {
      const instance = getReadReceiptsManager();
      expect(instance).toBeInstanceOf(ReadReceiptsManager);
    });

    it("should return same instance on subsequent calls", () => {
      const instance1 = getReadReceiptsManager();
      const instance2 = getReadReceiptsManager();
      expect(instance1).toBe(instance2);
    });

    it("should reset the singleton", () => {
      expect(() => resetReadReceiptsManager()).not.toThrow();
    });
  });

  describe("Convenience functions", () => {
    it("markMessageAsRead should work", async () => {
      mockMessageStore.getMessageById.mockReturnValue({
        senderId: "user_2",
        status: "sent",
        chatId: "chat_1",
      });
      await markMessageAsRead("msg_1", "user_1");
      expect(mockMessageStore.updateMessage).toHaveBeenCalled();
    });
  });
});
