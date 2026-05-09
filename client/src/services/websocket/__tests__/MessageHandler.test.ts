/**
 * Unit tests for MessageHandler
 * Testing message processing and routing logic
 */

import { getMessageHandler } from "../MessageHandler";

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockChatStore = {
  addMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  getMessagesByChatId: jest.fn(),
};

const mockAuthStore = {
  getCurrentUser: jest.fn(),
};

const mockUIStore = {
  showToast: jest.fn(),
  showNotification: jest.fn(),
};

describe("MessageHandler", () => {
  let handler: any;
  let mockWebSocketClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocketClient = {
      send: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
    };
    handler = getMessageHandler(mockWebSocketClient);
  });

  describe("Initialization", () => {
    it("should initialize with WebSocket client", () => {
      expect(handler).toBeDefined();
      expect(typeof handler).toBe("object");
    });

    it("should require WebSocket client", () => {
      expect(() => getMessageHandler(null as any)).toThrow(
        "WebSocketClient required for MessageHandler initialization"
      );
    });
  });

  describe("Message Processing", () => {
    it("should process text messages", () => {
      const message = {
        id: "msg_123",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Hello world",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Message processed", { messageId: message.id });
    });

    it("should process image messages", () => {
      const message = {
        id: "msg_124",
        chatId: "chat_456",
        senderId: "user_789",
        type: "image",
        attachment: {
          uri: "file://image.jpg",
          width: 800,
          height: 600,
        },
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Image message processed", {
        messageId: message.id,
      });
    });

    it("should process video messages", () => {
      const message = {
        id: "msg_125",
        chatId: "chat_456",
        senderId: "user_789",
        type: "video",
        attachment: {
          uri: "file://video.mp4",
          width: 1920,
          height: 1080,
          duration: 30,
        },
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Video message processed", {
        messageId: message.id,
      });
    });

    it("should process document messages", () => {
      const message = {
        id: "msg_126",
        chatId: "chat_456",
        senderId: "user_789",
        type: "document",
        attachment: {
          uri: "file://document.pdf",
          fileName: "document.pdf",
          fileSize: 1024000,
        },
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Document message processed", {
        messageId: message.id,
      });
    });

    it("should process audio messages", () => {
      const message = {
        id: "msg_127",
        chatId: "chat_456",
        senderId: "user_789",
        type: "audio",
        attachment: {
          uri: "file://audio.mp3",
          duration: 15,
        },
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Audio message processed", {
        messageId: message.id,
      });
    });
  });

  describe("Message Validation", () => {
    it("should reject messages without ID", () => {
      const message = {
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Hello world",
        timestamp: Date.now(),
      };

      handler.handleMessage(message as any);

      expect(mockChatStore.addMessage).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid message: missing ID",
        expect.any(Object)
      );
    });

    it("should reject messages without chat ID", () => {
      const message = {
        id: "msg_123",
        senderId: "user_789",
        type: "text",
        text: "Hello world",
        timestamp: Date.now(),
      };

      handler.handleMessage(message as any);

      expect(mockChatStore.addMessage).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid message: missing chat ID",
        expect.any(Object)
      );
    });

    it("should reject messages without sender ID", () => {
      const message = {
        id: "msg_123",
        chatId: "chat_456",
        type: "text",
        text: "Hello world",
        timestamp: Date.now(),
      };

      handler.handleMessage(message as any);

      expect(mockChatStore.addMessage).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid message: missing sender ID",
        expect.any(Object)
      );
    });

    it("should reject messages without type", () => {
      const message = {
        id: "msg_123",
        chatId: "chat_456",
        senderId: "user_789",
        text: "Hello world",
        timestamp: Date.now(),
      };

      handler.handleMessage(message as any);

      expect(mockChatStore.addMessage).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid message: missing type",
        expect.any(Object)
      );
    });

    it("should reject messages without timestamp", () => {
      const message = {
        id: "msg_123",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Hello world",
      };

      handler.handleMessage(message as any);

      expect(mockChatStore.addMessage).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Invalid message: missing timestamp",
        expect.any(Object)
      );
    });
  });

  describe("Message Types", () => {
    it("should handle unknown message types", () => {
      const message = {
        id: "msg_128",
        chatId: "chat_456",
        senderId: "user_789",
        type: "unknown",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.warn).toHaveBeenCalledWith("Unknown message type", { type: "unknown" });
    });

    it("should handle system messages", () => {
      const message = {
        id: "msg_129",
        chatId: "chat_456",
        senderId: "system",
        type: "system",
        text: "User joined the chat",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("System message processed", {
        messageId: message.id,
      });
    });

    it("should handle reply messages", () => {
      const message = {
        id: "msg_130",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Reply to previous message",
        replyTo: "msg_120",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Reply message processed", {
        messageId: message.id,
        replyTo: "msg_120",
      });
    });

    it("should handle edited messages", () => {
      const message = {
        id: "msg_131",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Edited message content",
        edited: true,
        editedAt: Date.now(),
        timestamp: Date.now() - 60000, // Original timestamp 1 minute ago
      };

      handler.handleMessage(message);

      expect(mockChatStore.updateMessage).toHaveBeenCalledWith("msg_131", message);
      expect(mockLogger.info).toHaveBeenCalledWith("Message edited", { messageId: message.id });
    });

    it("should handle deleted messages", () => {
      const message = {
        id: "msg_132",
        chatId: "chat_456",
        senderId: "user_789",
        type: "system",
        text: "Message deleted",
        deleted: true,
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.deleteMessage).toHaveBeenCalledWith("msg_132");
      expect(mockLogger.info).toHaveBeenCalledWith("Message deleted", { messageId: message.id });
    });
  });

  describe("User Context", () => {
    it("should handle messages from current user", () => {
      const currentUser = { id: "user_789", name: "John Doe" };
      mockAuthStore.getCurrentUser.mockReturnValue(currentUser);

      const message = {
        id: "msg_133",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "My own message",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.debug).toHaveBeenCalledWith("Own message processed", {
        messageId: message.id,
      });
    });

    it("should handle messages from other users", () => {
      const currentUser = { id: "user_789", name: "John Doe" };
      mockAuthStore.getCurrentUser.mockReturnValue(currentUser);

      const message = {
        id: "msg_134",
        chatId: "chat_456",
        senderId: "user_999",
        type: "text",
        text: "Message from other user",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Message from other user processed", {
        messageId: message.id,
      });
    });

    it("should handle messages when no current user", () => {
      mockAuthStore.getCurrentUser.mockReturnValue(null);

      const message = {
        id: "msg_135",
        chatId: "chat_456",
        senderId: "user_999",
        type: "text",
        text: "Message without user context",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockLogger.info).toHaveBeenCalledWith("Message processed without user context", {
        messageId: message.id,
      });
    });
  });

  describe("Notification Handling", () => {
    it("should show notification for messages from other users", () => {
      const currentUser = { id: "user_789", name: "John Doe" };
      mockAuthStore.getCurrentUser.mockReturnValue(currentUser);

      const message = {
        id: "msg_136",
        chatId: "chat_456",
        senderId: "user_999",
        type: "text",
        text: "New message",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockUIStore.showNotification).toHaveBeenCalledWith({
        title: "New Message",
        body: "New message",
        data: { messageId: message.id, chatId: message.chatId },
      });
    });

    it("should not show notification for own messages", () => {
      const currentUser = { id: "user_789", name: "John Doe" };
      mockAuthStore.getCurrentUser.mockReturnValue(currentUser);

      const message = {
        id: "msg_137",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "My own message",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockUIStore.showNotification).not.toHaveBeenCalled();
    });

    it("should show toast for important messages", () => {
      const message = {
        id: "msg_138",
        chatId: "chat_456",
        senderId: "user_999",
        type: "text",
        text: "Important message",
        metadata: { priority: "high" },
        timestamp: Date.now(),
      };

      handler.handleMessage(message);

      expect(mockUIStore.showToast).toHaveBeenCalledWith({
        type: "info",
        message: "Important message received",
        duration: 3000,
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle store errors gracefully", () => {
      mockChatStore.addMessage.mockImplementation(() => {
        throw new Error("Store error");
      });

      const message = {
        id: "msg_139",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Test message",
        timestamp: Date.now(),
      };

      expect(() => handler.handleMessage(message)).not.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to process message", expect.any(Error));
    });

    it("should handle malformed messages", () => {
      const malformedMessages = [
        null,
        undefined,
        "string",
        123,
        [],
        {},
        { id: "msg_140" }, // Incomplete message
      ];

      malformedMessages.forEach((message) => {
        expect(() => handler.handleMessage(message as any)).not.toThrow();
      });

      expect(mockLogger.error).toHaveBeenCalledTimes(malformedMessages.length);
    });

    it("should handle circular references in messages", () => {
      const circularMessage: any = {
        id: "msg_141",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Circular message",
        timestamp: Date.now(),
      };
      circularMessage.self = circularMessage;

      expect(() => handler.handleMessage(circularMessage)).not.toThrow();
      expect(mockChatStore.addMessage).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("should handle high message volume efficiently", () => {
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg_${i}`,
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: `Message ${i}`,
        timestamp: Date.now(),
      }));

      const startTime = Date.now();
      messages.forEach((message) => handler.handleMessage(message));
      const endTime = Date.now();

      expect(mockChatStore.addMessage).toHaveBeenCalledTimes(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle large messages efficiently", () => {
      const largeMessage = {
        id: "msg_142",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "x".repeat(100000), // 100KB message
        timestamp: Date.now(),
      };

      const startTime = Date.now();
      handler.handleMessage(largeMessage);
      const endTime = Date.now();

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(largeMessage);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it("should handle concurrent message processing", async () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg_${i}`,
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: `Concurrent message ${i}`,
        timestamp: Date.now(),
      }));

      const startTime = Date.now();
      await Promise.all(
        messages.map(
          (message) =>
            new Promise((resolve) => {
              handler.handleMessage(message);
              resolve(null);
            })
        )
      );
      const endTime = Date.now();

      expect(mockChatStore.addMessage).toHaveBeenCalledTimes(100);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe("Data Consistency", () => {
    it("should maintain message order", () => {
      const messages = [
        {
          id: "msg_143",
          chatId: "chat_456",
          senderId: "user_789",
          type: "text",
          text: "First",
          timestamp: Date.now() - 3000,
        },
        {
          id: "msg_144",
          chatId: "chat_456",
          senderId: "user_789",
          type: "text",
          text: "Second",
          timestamp: Date.now() - 2000,
        },
        {
          id: "msg_145",
          chatId: "chat_456",
          senderId: "user_789",
          type: "text",
          text: "Third",
          timestamp: Date.now() - 1000,
        },
      ];

      messages.forEach((message) => handler.handleMessage(message));

      expect(mockChatStore.addMessage).toHaveBeenCalledTimes(3);
      expect(mockChatStore.addMessage).toHaveBeenNthCalledWith(1, messages[0]);
      expect(mockChatStore.addMessage).toHaveBeenNthCalledWith(2, messages[1]);
      expect(mockChatStore.addMessage).toHaveBeenNthCalledWith(3, messages[2]);
    });

    it("should handle message updates correctly", () => {
      const originalMessage = {
        id: "msg_146",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Original text",
        timestamp: Date.now() - 60000,
      };

      const updatedMessage = {
        ...originalMessage,
        text: "Updated text",
        edited: true,
        editedAt: Date.now(),
      };

      handler.handleMessage(originalMessage);
      handler.handleMessage(updatedMessage);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(originalMessage);
      expect(mockChatStore.updateMessage).toHaveBeenCalledWith("msg_146", updatedMessage);
    });

    it("should handle message deletion correctly", () => {
      const message = {
        id: "msg_147",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "To be deleted",
        timestamp: Date.now(),
      };

      const deleteMessage = {
        id: "msg_147",
        chatId: "chat_456",
        senderId: "system",
        type: "system",
        text: "Message deleted",
        deleted: true,
        timestamp: Date.now(),
      };

      handler.handleMessage(message);
      handler.handleMessage(deleteMessage);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(message);
      expect(mockChatStore.deleteMessage).toHaveBeenCalledWith("msg_147");
    });
  });

  describe("Security", () => {
    it("should sanitize message content", () => {
      const messageWithScript = {
        id: "msg_148",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: '<script>alert("xss")</script> Hello world',
        timestamp: Date.now(),
      };

      handler.handleMessage(messageWithScript);

      expect(mockChatStore.addMessage).toHaveBeenCalled();
      const addedMessage = mockChatStore.addMessage.mock.calls[0][0];
      expect(addedMessage.text).toContain("Hello world");
      expect(mockLogger.warn).toHaveBeenCalledWith("Potential XSS in message", {
        messageId: messageWithScript.id,
      });
    });

    it("should handle extremely long messages", () => {
      const extremelyLongMessage = {
        id: "msg_149",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "x".repeat(1000000), // 1MB message
        timestamp: Date.now(),
      };

      handler.handleMessage(extremelyLongMessage);

      expect(mockChatStore.addMessage).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith("Extremely long message", {
        messageId: extremelyLongMessage.id,
        length: 1000000,
      });
    });

    it("should handle messages with special characters", () => {
      const messageWithSpecialChars = {
        id: "msg_150",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Hello 🌍 world! ñoño",
        timestamp: Date.now(),
      };

      handler.handleMessage(messageWithSpecialChars);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(messageWithSpecialChars);
      expect(mockLogger.info).toHaveBeenCalledWith("Message processed", {
        messageId: messageWithSpecialChars.id,
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle messages with future timestamps", () => {
      const futureMessage = {
        id: "msg_151",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Message from the future",
        timestamp: Date.now() + 86400000, // 24 hours in future
      };

      handler.handleMessage(futureMessage);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(futureMessage);
      expect(mockLogger.warn).toHaveBeenCalledWith("Message with future timestamp", {
        messageId: futureMessage.id,
      });
    });

    it("should handle messages with very old timestamps", () => {
      const oldMessage = {
        id: "msg_152",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Very old message",
        timestamp: Date.now() - 31536000000, // 1 year ago
      };

      handler.handleMessage(oldMessage);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(oldMessage);
      expect(mockLogger.debug).toHaveBeenCalledWith("Old message processed", {
        messageId: oldMessage.id,
      });
    });

    it("should handle duplicate messages", () => {
      const message = {
        id: "msg_153",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Duplicate message",
        timestamp: Date.now(),
      };

      handler.handleMessage(message);
      handler.handleMessage(message);

      expect(mockChatStore.addMessage).toHaveBeenCalledTimes(2);
      expect(mockChatStore.addMessage).toHaveBeenNthCalledWith(1, message);
      expect(mockChatStore.addMessage).toHaveBeenNthCalledWith(2, message);
      expect(mockLogger.debug).toHaveBeenCalledWith("Duplicate message processed", {
        messageId: message.id,
      });
    });

    it("should handle messages with null/undefined fields", () => {
      const messageWithNulls = {
        id: "msg_154",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Message with null fields",
        replyTo: null,
        metadata: undefined,
        attachment: null,
        timestamp: Date.now(),
      };

      handler.handleMessage(messageWithNulls);

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(messageWithNulls);
      expect(mockLogger.info).toHaveBeenCalledWith("Message processed", {
        messageId: messageWithNulls.id,
      });
    });
  });
});
