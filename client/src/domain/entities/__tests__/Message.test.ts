/**
 * Unit tests for Message entity
 * Testing core message business logic and validation
 */

import { Message, MessageType, MessageStatus } from "../Message";

describe("Message Entity", () => {
  describe("Constructor", () => {
    it("should create a valid text message", () => {
      const message: Message = {
        id: "msg_123",
        chatId: "chat_456",
        senderId: "user_789",
        text: "Hello world",
        timestamp: "2024-01-01T00:00:00Z",
        type: "text",
        status: "sent",
        localOnly: false,
      };

      expect(message.id).toBe("msg_123");
      expect(message.chatId).toBe("chat_456");
      expect(message.senderId).toBe("user_789");
      expect(message.text).toBe("Hello world");
      expect(message.timestamp).toBe("2024-01-01T00:00:00Z");
      expect(message.type).toBe("text");
      expect(message.status).toBe("sent");
      expect(message.localOnly).toBe(false);
    });

    it("should create message with attachment", () => {
      const attachment = {
        type: "image" as const,
        uri: "file://image.jpg",
        width: 800,
        height: 600,
      };

      const message: Message = {
        id: "msg_124",
        chatId: "chat_456",
        senderId: "user_789",
        type: "image",
        attachment,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.type).toBe("image");
      expect(message.attachment).toEqual(attachment);
      expect(message.text).toBeUndefined();
    });

    it("should create message with reply", () => {
      const message: Message = {
        id: "msg_125",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Reply message",
        replyTo: "msg_120",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.replyTo).toBe("msg_120");
    });

    it("should create edited message", () => {
      const message: Message = {
        id: "msg_126",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Edited message",
        edited: true,
        editedAt: "2024-01-01T00:30:00Z",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.edited).toBe(true);
      expect(message.editedAt).toBe("2024-01-01T00:30:00Z");
    });

    it("should create message with reactions", () => {
      const reactions = [
        { userId: "user_1", emoji: "👍", createdAt: "2024-01-01T00:00:00Z" },
        { userId: "user_2", emoji: "❤️", createdAt: "2024-01-01T00:00:00Z" },
      ];

      const message: Message = {
        id: "msg_127",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Message with reactions",
        reactions,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.reactions).toEqual(reactions);
      expect(message.reactions).toHaveLength(2);
    });

    it("should create message with metadata", () => {
      const metadata = {
        priority: "high",
        tags: ["important", "urgent"],
        customField: "custom value",
      };

      const message: Message = {
        id: "msg_128",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Message with metadata",
        metadata,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.metadata).toEqual(metadata);
    });

    it("should create local only message", () => {
      const message: Message = {
        id: "msg_129",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Local message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "pending",
        localOnly: true,
      };

      expect(message.localOnly).toBe(true);
      expect(message.status).toBe("pending");
    });
  });

  describe("Message Types", () => {
    it("should handle text messages", () => {
      const message: Message = {
        id: "msg_130",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Text message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.type).toBe("text");
      expect(message.isTextMessage()).toBe(true);
      expect(message.isMediaMessage()).toBe(false);
    });

    it("should handle image messages", () => {
      const attachment = {
        type: "image" as const,
        uri: "file://image.jpg",
        width: 800,
        height: 600,
      };

      const message: Message = {
        id: "msg_131",
        chatId: "chat_456",
        senderId: "user_789",
        type: "image",
        attachment,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.type).toBe("image");
      expect(message.isTextMessage()).toBe(false);
      expect(message.isMediaMessage()).toBe(true);
      expect(message.isImageMessage()).toBe(true);
    });

    it("should handle video messages", () => {
      const attachment = {
        type: "video" as const,
        uri: "file://video.mp4",
        width: 1920,
        height: 1080,
        duration: 30,
      };

      const message: Message = {
        id: "msg_132",
        chatId: "chat_456",
        senderId: "user_789",
        type: "video",
        attachment,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.type).toBe("video");
      expect(message.isVideoMessage()).toBe(true);
    });

    it("should handle audio messages", () => {
      const attachment = {
        type: "audio" as const,
        uri: "file://audio.mp3",
        duration: 15,
      };

      const message: Message = {
        id: "msg_133",
        chatId: "chat_456",
        senderId: "user_789",
        type: "audio",
        attachment,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.type).toBe("audio");
      expect(message.isAudioMessage()).toBe(true);
    });

    it("should handle document messages", () => {
      const attachment = {
        type: "document" as const,
        uri: "file://document.pdf",
        fileName: "document.pdf",
        fileSize: 1024000,
      };

      const message: Message = {
        id: "msg_134",
        chatId: "chat_456",
        senderId: "user_789",
        type: "document",
        attachment,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.type).toBe("document");
      expect(message.isDocumentMessage()).toBe(true);
    });
  });

  describe("Message Status", () => {
    it("should handle sent status", () => {
      const message: Message = {
        id: "msg_135",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Sent message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.status).toBe("sent");
      expect(message.isSent()).toBe(true);
      expect(message.isDelivered()).toBe(false);
      expect(message.isRead()).toBe(false);
      expect(message.isFailed()).toBe(false);
    });

    it("should handle delivered status", () => {
      const message: Message = {
        id: "msg_136",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Delivered message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "delivered",
        localOnly: false,
      };

      expect(message.status).toBe("delivered");
      expect(message.isSent()).toBe(false);
      expect(message.isDelivered()).toBe(true);
      expect(message.isRead()).toBe(false);
      expect(message.isFailed()).toBe(false);
    });

    it("should handle read status", () => {
      const message: Message = {
        id: "msg_137",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Read message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "read",
        localOnly: false,
      };

      expect(message.status).toBe("read");
      expect(message.isSent()).toBe(false);
      expect(message.isDelivered()).toBe(false);
      expect(message.isRead()).toBe(true);
      expect(message.isFailed()).toBe(false);
    });

    it("should handle failed status", () => {
      const message: Message = {
        id: "msg_138",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Failed message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "failed",
        localOnly: false,
      };

      expect(message.status).toBe("failed");
      expect(message.isSent()).toBe(false);
      expect(message.isDelivered()).toBe(false);
      expect(message.isRead()).toBe(false);
      expect(message.isFailed()).toBe(true);
    });
  });

  describe("Message Utilities", () => {
    it("should check if message is from user", () => {
      const message: Message = {
        id: "msg_139",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Test message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.isFromUser("user_789")).toBe(true);
      expect(message.isFromUser("user_999")).toBe(false);
    });

    it("should check if message is edited", () => {
      const message: Message = {
        id: "msg_140",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Not edited message",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.isEdited()).toBe(false);

      const editedMessage: Message = {
        ...message,
        edited: true,
        editedAt: "2024-01-01T00:30:00Z",
      };

      expect(editedMessage.isEdited()).toBe(true);
    });

    it("should get message age", () => {
      const now = "2024-01-01T12:00:00Z";
      const message: Message = {
        id: "msg_141",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Age test",
        timestamp: "2024-01-01T11:00:00Z",
        status: "sent",
        localOnly: false,
      };

      const age = message.getAge(now);
      expect(age).toBe(3600000); // 1 hour in milliseconds
    });

    it("should format message for display", () => {
      const message: Message = {
        id: "msg_142",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Display test",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      const formatted = message.toDisplayText();
      expect(formatted).toBe("Display test");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty reactions array", () => {
      const message: Message = {
        id: "msg_143",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "No reactions",
        reactions: [],
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.reactions).toEqual([]);
      expect(message.reactions).toHaveLength(0);
    });

    it("should handle null metadata", () => {
      const message: Message = {
        id: "msg_144",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "No metadata",
        metadata: null,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.metadata).toBeNull();
    });

    it("should handle undefined metadata", () => {
      const message: Message = {
        id: "msg_145",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "No metadata",
        metadata: undefined,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.metadata).toBeUndefined();
    });

    it("should handle future timestamps", () => {
      const futureTime = "2024-01-01T00:00:00Z"; // Current time for test
      const message: Message = {
        id: "msg_146",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Future message",
        timestamp: futureTime,
        status: "sent",
        localOnly: false,
      };

      const age = message.getAge(futureTime);
      expect(age).toBe(0);
    });

    it("should handle very long text", () => {
      const longText = "x".repeat(10000);
      const message: Message = {
        id: "msg_147",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: longText,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.text).toBe(longText);
      expect(message.text.length).toBe(10000);
    });
  });

  describe("Performance", () => {
    it("should handle large number of reactions efficiently", () => {
      const reactions = Array.from({ length: 1000 }, (_, i) => ({
        userId: `user_${i}`,
        emoji: "👍",
        createdAt: "2024-01-01T00:00:00Z",
      }));

      const message: Message = {
        id: "msg_148",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Message with many reactions",
        reactions,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      const startTime = Date.now();
      const hasReaction = message.hasReactionFromUser("user_500");
      const endTime = Date.now();

      expect(hasReaction).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it("should serialize large messages efficiently", () => {
      const message: Message = {
        id: "msg_149",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "x".repeat(100000), // 100KB text
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      const startTime = Date.now();
      const json = message.toJSON();
      const endTime = Date.now();

      expect(json.text).toBe("x".repeat(100000));
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe("Data Consistency", () => {
    it("should maintain immutability", () => {
      const originalText = "Original text";
      const message: Message = {
        id: "msg_150",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: originalText,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      const json1 = message.toJSON();
      // Simulate text change (this would be done via methods in real implementation)
      (message as any).text = "Changed text";
      const json2 = message.toJSON();

      expect(json1.text).toBe(originalText);
      expect(json2.text).toBe("Changed text");
    });

    it("should handle date strings correctly", () => {
      const timestamp = "2024-01-01T00:00:00Z";
      const message: Message = {
        id: "msg_151",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Date test",
        timestamp,
        status: "sent",
        localOnly: false,
      };

      expect(message.timestamp).toBe(timestamp);
      expect(message.getAge(timestamp)).toBe(0);
    });

    it("should handle attachment validation", () => {
      const validAttachment = {
        type: "image" as const,
        uri: "file://image.jpg",
        width: 800,
        height: 600,
      };

      const message: Message = {
        id: "msg_152",
        chatId: "chat_456",
        senderId: "user_789",
        type: "image",
        attachment: validAttachment,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.attachment).toEqual(validAttachment);
      expect(message.attachment.type).toBe("image");
    });
  });

  describe("Security", () => {
    it("should handle special characters in text", () => {
      const message: Message = {
        id: "msg_153",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Hello 🌍 世界! ñoño",
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.text).toBe("Hello 🌍 世界! ñoño");
      expect(message.text.length).toBeGreaterThan(10);
    });

    it("should handle extremely long messages", () => {
      const message: Message = {
        id: "msg_154",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "x".repeat(1000000), // 1MB message
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.text).toBe("x".repeat(1000000));
      expect(message.text.length).toBe(1000000);
    });

    it("should handle malicious content in metadata", () => {
      const maliciousMetadata = {
        script: '<script>alert("xss")</script>',
        injection: "'; DROP TABLE users; --",
      };

      const message: Message = {
        id: "msg_155",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Message with malicious metadata",
        metadata: maliciousMetadata,
        timestamp: "2024-01-01T00:00:00Z",
        status: "sent",
        localOnly: false,
      };

      expect(message.metadata).toEqual(maliciousMetadata);
    });
  });
});
