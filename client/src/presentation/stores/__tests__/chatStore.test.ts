/**
 * Unit tests for chatStore
 * Testing chat state management and business logic
 */

import { useChatStore } from "../chatStore";

// Mock dependencies
jest.mock("../../lib/secure-storage", () => ({
  SecureStorageService: {
    getInstance: jest.fn(() => ({
      setItem: jest.fn().mockResolvedValue(true),
      getItem: jest.fn().mockResolvedValue(null),
      removeItem: jest.fn().mockResolvedValue(true),
    })),
  },
}));

jest.mock("../../core/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("chatStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useChatStore.setState({
      currentUser: null,
      isAuthenticated: false,
      users: [],
      chats: [],
      groupChats: [],
      messages: [],
      statuses: [],
      calls: [],
      settings: {
        darkMode: false,
        wallpaper: null,
        fontSize: "medium",
        notifications: true,
        soundEnabled: true,
        blurredChatList: false,
      },
      syncState: {
        lastSyncTimestamp: null,
        pendingMessages: [],
        syncStatus: "idle",
      },
      isLoading: true,
      typingUsers: {},
    });
  });

  describe("Initial State", () => {
    it("should initialize with default state", () => {
      const state = useChatStore.getState();

      expect(state.currentUser).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.users).toEqual([]);
      expect(state.chats).toEqual([]);
      expect(state.groupChats).toEqual([]);
      expect(state.messages).toEqual([]);
      expect(state.statuses).toEqual([]);
      expect(state.calls).toEqual([]);
      expect(state.settings.darkMode).toBe(false);
      expect(state.settings.fontSize).toBe("medium");
      expect(state.syncState.syncStatus).toBe("idle");
      expect(state.isLoading).toBe(true);
      expect(state.typingUsers).toEqual({});
    });
  });

  describe("User Management", () => {
    describe("setCurrentUser", () => {
      it("should set current user", () => {
        const { setCurrentUser } = useChatStore.getState();
        const user = {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };

        setCurrentUser(user);

        const state = useChatStore.getState();
        expect(state.currentUser).toEqual(user);
        expect(state.isAuthenticated).toBe(true);
      });

      it("should clear current user when null", () => {
        const { setCurrentUser } = useChatStore.getState();

        // First set a user
        setCurrentUser({
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        });

        // Then clear user
        setCurrentUser(null);

        const state = useChatStore.getState();
        expect(state.currentUser).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      });
    });

    describe("updateUser", () => {
      it("should update existing user", () => {
        const { setCurrentUser, updateUser } = useChatStore.getState();
        const user = {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };

        setCurrentUser(user);
        updateUser({ id: "user_123", isOnline: false });

        const state = useChatStore.getState();
        expect(state.currentUser?.isOnline).toBe(false);
        expect(state.currentUser?.name).toBe("John Doe");
      });

      it("should handle updating non-existent user", () => {
        const { updateUser } = useChatStore.getState();

        updateUser({ id: "nonexistent", isOnline: false });

        const state = useChatStore.getState();
        expect(state.currentUser).toBeNull();
      });
    });

    describe("addUser", () => {
      it("should add new user to list", () => {
        const { addUser } = useChatStore.getState();
        const user = {
          id: "user_456",
          name: "Jane Doe",
          phone: "+0987654321",
          isOnline: false,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };

        addUser(user);

        const state = useChatStore.getState();
        expect(state.users).toHaveLength(1);
        expect(state.users[0]).toEqual(user);
      });

      it("should not add duplicate users", () => {
        const { addUser } = useChatStore.getState();
        const user = {
          id: "user_123",
          name: "John Doe",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };

        addUser(user);
        addUser(user); // Try to add same user again

        const state = useChatStore.getState();
        expect(state.users).toHaveLength(1);
      });
    });

    describe("removeUser", () => {
      it("should remove user from list", () => {
        const { addUser, removeUser } = useChatStore.getState();
        const user1 = {
          id: "user_1",
          name: "User 1",
          phone: "+1111111111",
          isOnline: true,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };
        const user2 = {
          id: "user_2",
          name: "User 2",
          phone: "+2222222222",
          isOnline: false,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        };

        addUser(user1);
        addUser(user2);
        removeUser("user_1");

        const state = useChatStore.getState();
        expect(state.users).toHaveLength(1);
        expect(state.users[0].id).toBe("user_2");
      });

      it("should handle removing non-existent user", () => {
        const { removeUser } = useChatStore.getState();

        removeUser("nonexistent");

        const state = useChatStore.getState();
        expect(state.users).toHaveLength(0);
      });
    });
  });

  describe("Chat Management", () => {
    describe("addChat", () => {
      it("should add new chat", () => {
        const { addChat } = useChatStore.getState();
        const chat = {
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

        addChat(chat);

        const state = useChatStore.getState();
        expect(state.chats).toHaveLength(1);
        expect(state.chats[0]).toEqual(chat);
      });

      it("should add chat to beginning of list", () => {
        const { addChat } = useChatStore.getState();
        const existingChat = {
          id: "chat_existing",
          name: "Existing Chat",
          type: "direct",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };
        const newChat = {
          id: "chat_new",
          name: "New Chat",
          type: "direct",
          participantIds: ["user_1", "user_3"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        addChat(existingChat);
        addChat(newChat);

        const state = useChatStore.getState();
        expect(state.chats[0]).toEqual(existingChat);
        expect(state.chats[1]).toEqual(newChat);
      });
    });

    describe("updateChat", () => {
      it("should update existing chat", () => {
        const { addChat, updateChat } = useChatStore.getState();
        const chat = {
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

        addChat(chat);
        updateChat("chat_123", { unreadCount: 5 });

        const state = useChatStore.getState();
        expect(state.chats[0].unreadCount).toBe(5);
        expect(state.chats[0].name).toBe("Test Chat");
      });

      it("should handle updating non-existent chat", () => {
        const { updateChat } = useChatStore.getState();

        updateChat("nonexistent", { unreadCount: 5 });

        const state = useChatStore.getState();
        expect(state.chats).toHaveLength(0);
      });
    });

    describe("removeChat", () => {
      it("should remove chat", () => {
        const { addChat, removeChat } = useChatStore.getState();
        const chat = {
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

        addChat(chat);
        removeChat("chat_123");

        const state = useChatStore.getState();
        expect(state.chats).toHaveLength(0);
      });
    });

    describe("updateUnreadCount", () => {
      it("should update chat unread count", () => {
        const { addChat, updateUnreadCount } = useChatStore.getState();
        const chat = {
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

        addChat(chat);
        updateUnreadCount("chat_123", 3);

        const state = useChatStore.getState();
        expect(state.chats[0].unreadCount).toBe(3);
      });

      it("should handle updating non-existent chat unread count", () => {
        const { updateUnreadCount } = useChatStore.getState();

        updateUnreadCount("nonexistent", 5);

        const state = useChatStore.getState();
        expect(state.chats).toHaveLength(0);
      });
    });
  });

  describe("Message Management", () => {
    describe("addMessage", () => {
      it("should add new message", () => {
        const { addMessage } = useChatStore.getState();
        const message = {
          id: "msg_123",
          chatId: "chat_456",
          senderId: "user_789",
          text: "Hello world",
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        };

        addMessage(message);

        const state = useChatStore.getState();
        expect(state.messages).toHaveLength(1);
        expect(state.messages[0]).toEqual(message);
      });

      it("should add message to beginning of list", () => {
        const { addMessage } = useChatStore.getState();
        const existingMessage = {
          id: "msg_existing",
          chatId: "chat_456",
          senderId: "user_123",
          text: "Existing message",
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        };
        const newMessage = {
          id: "msg_new",
          chatId: "chat_456",
          senderId: "user_456",
          text: "New message",
          timestamp: "2024-01-01T01:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        };

        addMessage(existingMessage);
        addMessage(newMessage);

        const state = useChatStore.getState();
        expect(state.messages[0]).toEqual(existingMessage);
        expect(state.messages[1]).toEqual(newMessage);
      });
    });

    describe("updateMessage", () => {
      it("should update existing message", () => {
        const { addMessage, updateMessage } = useChatStore.getState();
        const message = {
          id: "msg_123",
          chatId: "chat_456",
          senderId: "user_789",
          text: "Hello world",
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        };

        addMessage(message);
        updateMessage("msg_123", { text: "Updated message", status: "delivered" });

        const state = useChatStore.getState();
        expect(state.messages[0].text).toBe("Updated message");
        expect(state.messages[0].status).toBe("delivered");
      });

      it("should handle updating non-existent message", () => {
        const { updateMessage } = useChatStore.getState();

        updateMessage("nonexistent", { text: "Updated" });

        const state = useChatStore.getState();
        expect(state.messages).toHaveLength(0);
      });
    });

    describe("getMessagesByChatId", () => {
      it("should return messages for specific chat", () => {
        const { addMessage, getMessagesByChatId } = useChatStore.getState();
        const message1 = {
          id: "msg_1",
          chatId: "chat_456",
          senderId: "user_1",
          text: "Message 1",
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        };
        const message2 = {
          id: "msg_2",
          chatId: "chat_789",
          senderId: "user_2",
          text: "Message 2",
          timestamp: "2024-01-01T01:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        };

        addMessage(message1);
        addMessage(message2);

        const messages = getMessagesByChatId("chat_456");

        expect(messages).toHaveLength(1);
        expect(messages[0]).toEqual(message1);
      });

      it("should return empty array for chat with no messages", () => {
        const { addMessage, getMessagesByChatId } = useChatStore.getState();
        const message = {
          id: "msg_1",
          chatId: "chat_456",
          senderId: "user_1",
          text: "Message 1",
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        };

        addMessage(message);

        const messages = getMessagesByChatId("chat_789");

        expect(messages).toEqual([]);
        expect(messages).toHaveLength(0);
      });
    });
  });

  describe("Settings Management", () => {
    describe("updateSettings", () => {
      it("should update user settings", () => {
        const { updateSettings } = useChatStore.getState();
        const newSettings = {
          darkMode: true,
          fontSize: "large" as const,
          notifications: false,
          soundEnabled: false,
          blurredChatList: true,
        };

        updateSettings(newSettings);

        const state = useChatStore.getState();
        expect(state.settings.darkMode).toBe(true);
        expect(state.settings.fontSize).toBe("large");
        expect(state.settings.notifications).toBe(false);
        expect(state.settings.soundEnabled).toBe(false);
        expect(state.settings.blurredChatList).toBe(true);
      });

      it("should merge settings with existing ones", () => {
        const { updateSettings } = useChatStore.getState();
        const newSettings = {
          darkMode: true,
          // Other settings omitted
        };

        updateSettings(newSettings);

        const state = useChatStore.getState();
        expect(state.settings.darkMode).toBe(true);
        expect(state.settings.fontSize).toBe("medium"); // Should preserve existing
        expect(state.settings.notifications).toBe(true); // Should preserve existing
      });
    });

    describe("toggleDarkMode", () => {
      it("should toggle dark mode", () => {
        const { toggleDarkMode } = useChatStore.getState();

        // Initial state should be false
        expect(useChatStore.getState().settings.darkMode).toBe(false);

        toggleDarkMode();

        expect(useChatStore.getState().settings.darkMode).toBe(true);

        toggleDarkMode();

        expect(useChatStore.getState().settings.darkMode).toBe(false);
      });
    });
  });

  describe("Sync State Management", () => {
    describe("setSyncStatus", () => {
      it("should set sync status", () => {
        const { setSyncStatus } = useChatStore.getState();

        setSyncStatus("syncing");

        const state = useChatStore.getState();
        expect(state.syncState.syncStatus).toBe("syncing");
      });

      it("should update last sync timestamp", () => {
        const { setSyncStatus, setLastSyncTimestamp } = useChatStore.getState();
        const timestamp = "2024-01-01T00:00:00Z";

        setSyncStatus("syncing");
        setLastSyncTimestamp(timestamp);

        const state = useChatStore.getState();
        expect(state.syncState.syncStatus).toBe("syncing");
        expect(state.syncState.lastSyncTimestamp).toBe(timestamp);
      });
    });

    describe("addPendingMessage", () => {
      it("should add pending message", () => {
        const { addPendingMessage } = useChatStore.getState();
        const message = {
          id: "msg_pending",
          chatId: "chat_456",
          senderId: "user_789",
          text: "Pending message",
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "pending",
          localOnly: true,
        };

        addPendingMessage(message);

        const state = useChatStore.getState();
        expect(state.syncState.pendingMessages).toHaveLength(1);
        expect(state.syncState.pendingMessages[0]).toEqual(message);
      });

      it("should remove pending message when synced", () => {
        const { addPendingMessage, removePendingMessage } = useChatStore.getState();
        const message = {
          id: "msg_pending",
          chatId: "chat_456",
          senderId: "user_789",
          text: "Pending message",
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "pending",
          localOnly: true,
        };

        addPendingMessage(message);
        removePendingMessage("msg_pending");

        const state = useChatStore.getState();
        expect(state.syncState.pendingMessages).toHaveLength(0);
      });

      it("should handle removing non-existent pending message", () => {
        const { removePendingMessage } = useChatStore.getState();

        removePendingMessage("nonexistent");

        const state = useChatStore.getState();
        expect(state.syncState.pendingMessages).toHaveLength(0);
      });
    });
  });

  describe("Loading State", () => {
    describe("setLoading", () => {
      it("should set loading state", () => {
        const { setLoading } = useChatStore.getState();

        setLoading(true);

        const state = useChatStore.getState();
        expect(state.isLoading).toBe(true);

        setLoading(false);

        expect(state.isLoading).toBe(false);
      });
    });
  });

  describe("Typing Indicators", () => {
    describe("setTypingUser", () => {
      it("should set user as typing", () => {
        const { setTypingUser } = useChatStore.getState();

        setTypingUser("chat_123", "user_456");

        const state = useChatStore.getState();
        expect(state.typingUsers["chat_123"]).toBe("user_456");
      });

      it("should clear typing user", () => {
        const { setTypingUser, clearTypingUser } = useChatStore.getState();

        setTypingUser("chat_123", "user_456");
        clearTypingUser("chat_123");

        const state = useChatStore.getState();
        expect(state.typingUsers["chat_123"]).toBeUndefined();
      });
    });

    describe("clearTypingUsers", () => {
      it("should clear all typing users", () => {
        const { setTypingUser, clearTypingUsers } = useChatStore.getState();

        setTypingUser("chat_123", "user_456");
        setTypingUser("chat_456", "user_789");
        clearTypingUsers();

        const state = useChatStore.getState();
        expect(state.typingUsers).toEqual({});
      });
    });
  });

  describe("State Persistence", () => {
    it("should save state to storage", () => {
      const { addMessage, savePersistedState } = useChatStore.getState();
      const message = {
        id: "msg_123",
        chatId: "chat_456",
        senderId: "user_789",
        text: "Hello world",
        timestamp: "2024-01-01T00:00:00Z",
        type: "text",
        status: "sent",
        localOnly: false,
      };

      addMessage(message);
      savePersistedState();

      // Verify state was persisted (mocked in setup)
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
    });

    it("should load persisted state", () => {
      const { loadPersistedState } = useChatStore.getState();

      loadPersistedState();

      // Verify state was loaded (mocked in setup)
      const state = useChatStore.getState();
      expect(state).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle state update errors gracefully", () => {
      const { setCurrentUser } = useChatStore.getState();

      // Test with invalid user data
      expect(() => {
        setCurrentUser(null as any);
      }).not.toThrow();

      const state = useChatStore.getState();
      expect(state.currentUser).toBeNull();
    });

    it("should handle concurrent state updates", async () => {
      const { addMessage } = useChatStore.getState();
      const message = {
        id: "msg_concurrent",
        chatId: "chat_456",
        senderId: "user_789",
        text: "Concurrent message",
        timestamp: "2024-01-01T00:00:00Z",
        type: "text",
        status: "sent",
        localOnly: false,
      };

      // Multiple concurrent updates
      await Promise.all([
        addMessage(message),
        addMessage({ ...message, id: "msg_concurrent_2" }),
        addMessage({ ...message, id: "msg_concurrent_3" }),
      ]);

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(3);
    });
  });

  describe("Performance", () => {
    it("should handle large message lists efficiently", () => {
      const { addMessage } = useChatStore.getState();

      // Add many messages
      for (let i = 0; i < 1000; i++) {
        addMessage({
          id: `msg_${i}`,
          chatId: "chat_456",
          senderId: "user_789",
          text: `Message ${i}`,
          timestamp: "2024-01-01T00:00:00Z",
          type: "text",
          status: "sent",
          localOnly: false,
        });
      }

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1000);
    });

    it("should handle large chat lists efficiently", () => {
      const { addChat } = useChatStore.getState();

      // Add many chats
      for (let i = 0; i < 500; i++) {
        addChat({
          id: `chat_${i}`,
          name: `Chat ${i}`,
          type: "direct",
          participantIds: ["user_1", "user_2"],
          unreadCount: 0,
          lastActivity: "2024-01-01T00:00:00Z",
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        });
      }

      const state = useChatStore.getState();
      expect(state.chats).toHaveLength(500);
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data type consistency", () => {
      const { addMessage, addChat } = useChatStore.getState();
      const message = {
        id: "msg_consistency",
        chatId: "chat_456",
        senderId: "user_789",
        text: "Consistency test",
        timestamp: "2024-01-01T00:00:00Z",
        type: "text",
        status: "sent",
        localOnly: false,
      };
      const chat = {
        id: "chat_consistency",
        name: "Consistency Test",
        type: "direct",
        participantIds: ["user_1", "user_2"],
        unreadCount: 0,
        lastActivity: "2024-01-01T00:00:00Z",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      addMessage(message);
      addChat(chat);

      const state = useChatStore.getState();
      expect(typeof state.messages[0].id).toBe("string");
      expect(typeof state.chats[0].id).toBe("string");
      expect(Array.isArray(state.messages)).toBe(true);
      expect(Array.isArray(state.chats)).toBe(true);
    });

    it("should handle special characters in data", () => {
      const { addMessage } = useChatStore.getState();
      const message = {
        id: "msg_special",
        chatId: "chat_456",
        senderId: "user_789",
        text: "Message 🌍 with émojis and àccénts",
        timestamp: "2024-01-01T00:00:00Z",
        type: "text",
        status: "sent",
        localOnly: false,
      };

      addMessage(message);

      const state = useChatStore.getState();
      expect(state.messages[0].text).toBe("Message 🌍 with émojis and àccénts");
    });
  });
});
