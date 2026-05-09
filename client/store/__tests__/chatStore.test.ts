/**
 * Unit tests for Chat Store (Zustand)
 * Testing core business logic without React Native dependencies
 */

import { act, renderHook } from "@testing-library/react";
import { useChatStore } from "../chatStore";

// Mock the storage service
jest.mock("@/lib/storage", () => ({
  StorageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe("Chat Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.logout();
    });
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should initialize with unauthenticated state", () => {
      const { result } = renderHook(() => useChatStore());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBe(null);
    });

    it("should handle login", async () => {
      const { result } = renderHook(() => useChatStore());
      const phone = "+1234567890";

      await act(async () => {
        await result.current.login(phone);
      });

      expect(result.current.currentUser).toEqual({
        id: "currentUser",
        name: "You",
        phone,
        isOnline: true,
      });
    });

    it("should handle OTP verification", async () => {
      const { result } = renderHook(() => useChatStore());

      // First login
      await act(async () => {
        await result.current.login("+1234567890");
      });

      // Then verify OTP
      let verified = false;
      await act(async () => {
        verified = await result.current.verifyOtp("123456");
      });

      expect(verified).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should reject invalid OTP", async () => {
      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.login("+1234567890");
      });

      let verified = false;
      await act(async () => {
        verified = await result.current.verifyOtp("123");
      });

      expect(verified).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle logout", async () => {
      const { result } = renderHook(() => useChatStore());

      // Login and verify first
      await act(async () => {
        await result.current.login("+1234567890");
        await result.current.verifyOtp("123456");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBe(null);
    });
  });

  describe("Message Management", () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useChatStore());
      await act(async () => {
        await result.current.login("+1234567890");
        await result.current.verifyOtp("123456");
      });
    });

    it("should send a message", () => {
      const { result } = renderHook(() => useChatStore());
      const chatId = "chat1";
      const text = "Hello, World!";

      act(() => {
        result.current.sendMessage(chatId, text);
      });

      const messages = result.current.getMessagesForChat(chatId);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        chatId,
        senderId: "currentUser",
        text,
        status: "sending",
      });
      expect(messages[0].id).toMatch(/^msg_\d+$/);
    });

    it("should delete a message", () => {
      const { result } = renderHook(() => useChatStore());
      const chatId = "chat1";

      // Send a message first
      act(() => {
        result.current.sendMessage(chatId, "Test message");
      });

      let messages = result.current.getMessagesForChat(chatId);
      expect(messages).toHaveLength(1);

      const messageId = messages[0].id;

      // Delete the message
      act(() => {
        result.current.deleteMessage(messageId);
      });

      messages = result.current.getMessagesForChat(chatId);
      expect(messages).toHaveLength(0);
    });

    it("should edit a message", () => {
      const { result } = renderHook(() => useChatStore());
      const chatId = "chat1";
      const originalText = "Original message";
      const editedText = "Edited message";

      // Send a message first
      act(() => {
        result.current.sendMessage(chatId, originalText);
      });

      let messages = result.current.getMessagesForChat(chatId);
      const messageId = messages[0].id;

      // Edit the message
      act(() => {
        result.current.editMessage(messageId, editedText);
      });

      messages = result.current.getMessagesForChat(chatId);
      expect(messages[0]).toMatchObject({
        id: messageId,
        text: editedText,
        edited: true,
        editedAt: expect.any(String),
      });
    });

    it("should mark chat as read", () => {
      const { result } = renderHook(() => useChatStore());

      // Get initial unread count
      const initialChat = result.current.chats.find((c) => c.id === "chat1");
      const initialUnreadCount = initialChat?.unreadCount || 0;

      // Mark as read
      act(() => {
        result.current.markChatAsRead("chat1");
      });

      const updatedChat = result.current.chats.find((c) => c.id === "chat1");
      expect(updatedChat?.unreadCount).toBe(0);
    });
  });

  describe("Chat Management", () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useChatStore());
      await act(async () => {
        await result.current.login("+1234567890");
        await result.current.verifyOtp("123456");
      });
    });

    it("should pin a chat", () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.pinChat("chat1");
      });

      const chat = result.current.chats.find((c) => c.id === "chat1");
      expect(chat?.isPinned).toBe(true);
    });

    it("should unpin a chat", () => {
      const { result } = renderHook(() => useChatStore());

      // Pin first
      act(() => {
        result.current.pinChat("chat1");
      });

      // Then unpin
      act(() => {
        result.current.unpinChat("chat1");
      });

      const chat = result.current.chats.find((c) => c.id === "chat1");
      expect(chat?.isPinned).toBe(false);
    });

    it("should mute a chat", () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.muteChat("chat1");
      });

      const chat = result.current.chats.find((c) => c.id === "chat1");
      expect(chat?.isMuted).toBe(true);
    });

    it("should archive a chat", () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.archiveChat("chat1");
      });

      const chat = result.current.chats.find((c) => c.id === "chat1");
      expect(chat?.isArchived).toBe(true);
    });
  });

  describe("Group Management", () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useChatStore());
      await act(async () => {
        await result.current.login("+1234567890");
        await result.current.verifyOtp("123456");
      });
    });

    it("should create a group", () => {
      const { result } = renderHook(() => useChatStore());
      const groupName = "Test Group";
      const participantIds = ["user1", "user2"];

      act(() => {
        result.current.createGroup(groupName, participantIds);
      });

      const groups = result.current.groupChats;
      expect(groups).toHaveLength(1); // Assuming no groups initially

      const newGroup = groups[0];
      expect(newGroup).toMatchObject({
        name: groupName,
        participants: ["currentUser", ...participantIds],
        adminIds: ["currentUser"],
        createdBy: "currentUser",
        unreadCount: 0,
      });
      expect(newGroup.id).toMatch(/^group_\d+$/);
    });

    it("should add user to group", () => {
      const { result } = renderHook(() => useChatStore());

      // Create a group first
      let group;
      act(() => {
        group = result.current.createGroup("Test Group", ["user1"]);
      });

      const newUserId = "user2";

      act(() => {
        result.current.addToGroup(group.id, newUserId);
      });

      const updatedGroup = result.current.groupChats.find((g) => g.id === group.id);
      expect(updatedGroup?.participants).toContain(newUserId);
    });

    it("should remove user from group", () => {
      const { result } = renderHook(() => useChatStore());

      // Create a group first
      let group;
      act(() => {
        group = result.current.createGroup("Test Group", ["user1", "user2"]);
      });

      const userIdToRemove = "user2";

      act(() => {
        result.current.removeFromGroup(group.id, userIdToRemove);
      });

      const updatedGroup = result.current.groupChats.find((g) => g.id === group.id);
      expect(updatedGroup?.participants).not.toContain(userIdToRemove);
    });
  });

  describe("Settings Management", () => {
    it("should toggle dark mode", () => {
      const { result } = renderHook(() => useChatStore());
      const initialDarkMode = result.current.settings.darkMode;

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.settings.darkMode).toBe(!initialDarkMode);
    });

    it("should toggle notifications", () => {
      const { result } = renderHook(() => useChatStore());
      const initialNotifications = result.current.settings.notifications;

      act(() => {
        result.current.toggleNotifications();
      });

      expect(result.current.settings.notifications).toBe(!initialNotifications);
    });

    it("should toggle sound", () => {
      const { result } = renderHook(() => useChatStore());
      const initialSound = result.current.settings.soundEnabled;

      act(() => {
        result.current.toggleSound();
      });

      expect(result.current.settings.soundEnabled).toBe(!initialSound);
    });

    it("should set font size", () => {
      const { result } = renderHook(() => useChatStore());
      const fontSize = "large";

      act(() => {
        result.current.setFontSize(fontSize);
      });

      expect(result.current.settings.fontSize).toBe(fontSize);
    });
  });

  describe("Sync State", () => {
    it("should sync messages", async () => {
      const { result } = renderHook(() => useChatStore());

      expect(result.current.syncState.syncStatus).toBe("idle");

      await act(async () => {
        await result.current.syncMessages();
      });

      expect(result.current.syncState.syncStatus).toBe("idle");
      expect(result.current.syncState.lastSyncTimestamp).toBeTruthy();
      expect(result.current.syncState.pendingMessages).toHaveLength(0);
    });

    it("should retry message", () => {
      const { result } = renderHook(() => useChatStore());
      const chatId = "chat1";

      // Send a message first
      act(() => {
        result.current.sendMessage(chatId, "Test message");
      });

      let messages = result.current.getMessagesForChat(chatId);
      const messageId = messages[0].id;

      // Retry the message
      act(() => {
        result.current.retryMessage(messageId);
      });

      messages = result.current.getMessagesForChat(chatId);
      expect(messages[0].status).toBe("sending");
    });
  });
});
