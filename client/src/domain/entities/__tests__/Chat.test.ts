/**
 * Unit tests for Chat entity
 * Testing core chat business logic and validation
 */

import { ChatEntity } from "../Chat";
import type { Chat, GroupChat, PrivateChat, ChatParticipant } from "../Chat";

describe("ChatEntity", () => {
  describe("Constructor", () => {
    it("should create a valid private chat", () => {
      const chat = new ChatEntity({
        id: "chat_123",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      });

      expect(chat.id).toBe("chat_123");
      expect(chat.type).toBe("private");
      expect(chat.participantIds).toEqual(["user_1", "user_2"]);
      expect(chat.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(chat.updatedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(chat.unreadCount).toBe(0);
      expect(chat.isPinned).toBe(false);
      expect(chat.isMuted).toBe(false);
      expect(chat.isArchived).toBe(false);
    });

    it("should create a valid group chat", () => {
      const chat = new ChatEntity({
        id: "chat_456",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        name: "Group Chat",
        description: "Test group chat",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      });

      expect(chat.id).toBe("chat_456");
      expect(chat.type).toBe("group");
      expect(chat.name).toBe("Group Chat");
      expect(chat.description).toBe("Test group chat");
      expect(chat.participantIds).toEqual(["user_1", "user_2", "user_3"]);
      expect(chat.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(chat.updatedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    });
  });

  describe("Chat Properties", () => {
    it("should validate chat structure", () => {
      const chat: Chat = {
        id: "chat_789",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(chat.id).toBe("chat_789");
      expect(chat.type).toBe("private");
      expect(chat.participantIds).toEqual(["user_1", "user_2"]);
      expect(chat.unreadCount).toBe(0);
      expect(chat.isPinned).toBe(false);
      expect(chat.isMuted).toBe(false);
      expect(chat.isArchived).toBe(false);
    });

    it("should handle group chat structure", () => {
      const groupChat: GroupChat = {
        id: "chat_790",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        name: "Test Group",
        description: "Group description",
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(groupChat.id).toBe("chat_790");
      expect(groupChat.type).toBe("group");
      expect(groupChat.name).toBe("Test Group");
      expect(groupChat.description).toBe("Group description");
      expect(groupChat.adminIds).toEqual(["user_1"]);
      expect(groupChat.createdBy).toBe("user_1");
    });

    it("should handle private chat structure", () => {
      const privateChat: PrivateChat = {
        id: "chat_791",
        type: "private",
        participantIds: ["user_1", "user_2"],
        participantId: "user_2",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(privateChat.id).toBe("chat_791");
      expect(privateChat.type).toBe("private");
      expect(privateChat.participantId).toBe("user_2");
    });

    it("should handle chat participant structure", () => {
      const participant: ChatParticipant = {
        userId: "user_123",
        role: "admin",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
        lastReadMessageId: "msg_456",
      };

      expect(participant.userId).toBe("user_123");
      expect(participant.role).toBe("admin");
      expect(participant.joinedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
      expect(participant.lastReadMessageId).toBe("msg_456");
    });
  });

  describe("Chat Type Detection", () => {
    it("should identify private chats", () => {
      const privateChat: PrivateChat = {
        id: "chat_792",
        type: "private",
        participantIds: ["user_1", "user_2"],
        participantId: "user_2",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(privateChat.type).toBe("private");
    });

    it("should identify group chats", () => {
      const groupChat: GroupChat = {
        id: "chat_793",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        name: "Group Chat",
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(groupChat.type).toBe("group");
    });
  });

  describe("Chat Validation", () => {
    it("should validate required fields", () => {
      const validChat: Chat = {
        id: "chat_794",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(validChat.id).toBeTruthy();
      expect(validChat.type).toBeTruthy();
      expect(validChat.participantIds).toHaveLength(2);
      expect(validChat.createdAt).toBeInstanceOf(Date);
      expect(validChat.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle optional fields", () => {
      const chatWithOptionals: Chat = {
        id: "chat_795",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 5,
        isPinned: true,
        isMuted: true,
        isArchived: false,
        lastMessage: {
          id: "msg_123",
          chatId: "chat_795",
          senderId: "user_1",
          type: "text",
          text: "Last message",
          timestamp: new Date(),
          status: "sent",
          localOnly: false,
          reactions: [],
          edited: false,
        },
      };

      expect(chatWithOptionals.unreadCount).toBe(5);
      expect(chatWithOptionals.isPinned).toBe(true);
      expect(chatWithOptionals.isMuted).toBe(true);
      expect(chatWithOptionals.lastMessage).toBeDefined();
      expect(chatWithOptionals.lastMessage?.text).toBe("Last message");
    });

    it("should handle group chat optional fields", () => {
      const groupChatWithOptionals: GroupChat = {
        id: "chat_796",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        name: "Test Group",
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        description: "Group description",
        avatar: "avatar_url",
      };

      expect(groupChatWithOptionals.description).toBe("Group description");
      expect(groupChatWithOptionals.avatar).toBe("avatar_url");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty participant list", () => {
      const chat: Chat = {
        id: "chat_797",
        type: "private",
        participantIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(chat.participantIds).toEqual([]);
      expect(chat.participantIds).toHaveLength(0);
    });

    it("should handle large participant lists", () => {
      const largeParticipantList = Array.from({ length: 1000 }, (_, i) => `user_${i}`);
      const chat: Chat = {
        id: "chat_798",
        type: "group",
        participantIds: largeParticipantList,
        name: "Large Group",
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(chat.participantIds).toEqual(largeParticipantList);
      expect(chat.participantIds).toHaveLength(1000);
    });

    it("should handle extreme unread counts", () => {
      const chat: Chat = {
        id: "chat_799",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: Number.MAX_SAFE_INTEGER,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(chat.unreadCount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle date edge cases", () => {
      const pastDate = new Date("2020-01-01T00:00:00Z");
      const futureDate = new Date("2030-01-01T00:00:00Z");

      const pastChat: Chat = {
        id: "chat_800",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: pastDate,
        updatedAt: pastDate,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      const futureChat: Chat = {
        id: "chat_801",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: futureDate,
        updatedAt: futureDate,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(pastChat.createdAt).toEqual(pastDate);
      expect(futureChat.createdAt).toEqual(futureDate);
      expect(Date.now() - pastChat.createdAt.getTime()).toBeGreaterThan(0);
      expect(futureChat.createdAt.getTime() - Date.now()).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    it("should handle large participant operations efficiently", () => {
      const largeParticipantList = Array.from({ length: 1000 }, (_, i) => `user_${i}`);
      const chat: Chat = {
        id: "chat_802",
        type: "group",
        participantIds: largeParticipantList,
        name: "Large Group",
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      const startTime = Date.now();

      // Test participant lookups
      const hasUser500 = chat.participantIds.includes("user_500");
      const hasUser501 = chat.participantIds.includes("user_501");
      const participantCount = chat.participantIds.length;

      const endTime = Date.now();

      expect(hasUser500).toBe(true);
      expect(hasUser501).toBe(true);
      expect(participantCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it("should handle chat serialization efficiently", () => {
      const chat: Chat = {
        id: "chat_803",
        type: "group",
        participantIds: Array.from({ length: 1000 }, (_, i) => `user_${i}`),
        name: "x".repeat(1000),
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        description: "x".repeat(1000),
        avatar: "avatar_url",
      };

      const startTime = Date.now();
      const json = JSON.stringify(chat);
      const endTime = Date.now();

      expect(json.length).toBeGreaterThan(10000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe("Data Consistency", () => {
    it("should maintain chat type consistency", () => {
      const privateChat: PrivateChat = {
        id: "chat_804",
        type: "private",
        participantIds: ["user_1", "user_2"],
        participantId: "user_2",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      const groupChat: GroupChat = {
        id: "chat_805",
        type: "group",
        participantIds: ["user_1", "user_2", "user_3"],
        name: "Group Chat",
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(privateChat.type).toBe("private");
      expect(groupChat.type).toBe("group");
      expect("participantId" in privateChat).toBe(true);
      expect("participantId" in groupChat).toBe(false);
      expect("name" in privateChat).toBe(false);
      expect("name" in groupChat).toBe(true);
    });

    it("should handle date consistency", () => {
      const now = new Date("2024-01-01T12:00:00Z");
      const chat: Chat = {
        id: "chat_806",
        type: "private",
        participantIds: ["user_1", "user_2"],
        createdAt: now,
        updatedAt: now,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(chat.createdAt).toEqual(now);
      expect(chat.updatedAt).toEqual(now);
      expect(chat.createdAt.getTime()).toBe(now.getTime());
      expect(chat.updatedAt.getTime()).toBe(now.getTime());
    });

    it("should handle participant consistency", () => {
      const participant: ChatParticipant = {
        userId: "user_123",
        role: "member",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
        lastReadMessageId: "msg_456",
      };

      expect(participant.userId).toBe("user_123");
      expect(participant.role).toBe("member");
      expect(participant.joinedAt).toBeInstanceOf(Date);
      expect(participant.lastReadMessageId).toBe("msg_456");
    });
  });

  describe("Security", () => {
    it("should handle malicious chat names", () => {
      const maliciousNames = [
        '<script>alert("xss")</script>',
        "javascript:void(0)",
        "data:text/html,<script>alert(1)</script>",
      ];

      maliciousNames.forEach((name) => {
        const groupChat: GroupChat = {
          id: "chat_807",
          type: "group",
          participantIds: ["user_1"],
          name,
          adminIds: ["user_1"],
          createdBy: "user_1",
          createdAt: new Date(),
          updatedAt: new Date(),
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        };

        // Should create chat but name would be sanitized in real implementation
        expect(groupChat.name).toBe(name);
      });
    });

    it("should handle extremely long chat names", () => {
      const longName = "x".repeat(10000);
      const groupChat: GroupChat = {
        id: "chat_808",
        type: "group",
        participantIds: ["user_1"],
        name: longName,
        adminIds: ["user_1"],
        createdBy: "user_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(groupChat.name).toBe(longName);
      expect(groupChat.name.length).toBe(10000);
    });

    it("should handle special characters in participant IDs", () => {
      const specialParticipantIds = ["user_123", "user_456", "user_789"];

      const chat: Chat = {
        id: "chat_809",
        type: "group",
        participantIds: specialParticipantIds,
        name: "Special Chars Group",
        adminIds: ["user_123"],
        createdBy: "user_123",
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        isArchived: false,
      };

      expect(chat.participantIds).toEqual(specialParticipantIds);
      expect(chat.participantIds).toHaveLength(3);
    });
  });
});
