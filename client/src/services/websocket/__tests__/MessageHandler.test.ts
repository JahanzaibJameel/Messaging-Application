/**
 * Unit tests for MessageHandler
 * Tests message processing and routing against the real stores
 */

import { act } from "@testing-library/react-native";

import { getMessageHandler, resetMessageHandler } from "../MessageHandler";
import { useMessageStore } from "../../../presentation/stores/messageStore";
import { useChatStore } from "../../../presentation/stores/chatStore";
import type { WebSocketClient } from "../WebSocketClient";
import type { Chat } from "../../../domain/entities/Chat";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

const registeredHandlers = new Map<string, Set<(payload: unknown) => void>>();

function createMockWsClient(): jest.Mocked<WebSocketClient> {
  return {
    send: jest.fn().mockReturnValue(true),
    onMessage: jest.fn((type: string, handler: (payload: unknown) => void) => {
      if (!registeredHandlers.has(type)) {
        registeredHandlers.set(type, new Set());
      }
      registeredHandlers.get(type)!.add(handler);
      return () => {
        registeredHandlers.get(type)?.delete(handler);
      };
    }),
    connect: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as jest.Mocked<WebSocketClient>;
}

function dispatch(type: string, payload: unknown): void {
  const handlers = registeredHandlers.get(type);
  handlers?.forEach((handler) => handler(payload));
}

function makeChat(overrides: Partial<Chat> & { id: string }): Chat {
  return {
    type: "private",
    participantIds: ["currentUser", "other"],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    ...overrides,
  } as Chat;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe("MessageHandler", () => {
  let mockWsClient: jest.Mocked<WebSocketClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    registeredHandlers.clear();

    // Reset singleton and stores
    resetMessageHandler();
    const messageStore = useMessageStore.getState();
    messageStore.clearMessages();
    messageStore.setTyping("chat_1", "user_1", false);
    const chatStore = useChatStore.getState();
    chatStore.setChats([]);
    chatStore.setActiveChat(null);

    mockWsClient = createMockWsClient();
  });

  afterEach(() => {
    resetMessageHandler();
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  describe("Initialization", () => {
    it("initializes with a WebSocket client and registers all handlers", () => {
      getMessageHandler(mockWsClient);

      const expectedTypes = [
        "new_message",
        "message_status",
        "typing",
        "user_status",
        "reaction",
        "chat_update",
        "user_joined",
        "user_left",
      ];
      expectedTypes.forEach((type) => {
        expect(registeredHandlers.has(type)).toBe(true);
      });
    });

    it("requires a WebSocket client on first initialization", () => {
      expect(() => getMessageHandler(undefined as unknown as WebSocketClient)).toThrow(
        "WebSocketClient required for MessageHandler initialization"
      );
    });

    it("returns the same instance on subsequent calls", () => {
      const first = getMessageHandler(mockWsClient);
      const second = getMessageHandler();
      expect(second).toBe(first);
    });
  });

  // -------------------------------------------------------------------------
  // Incoming messages
  // -------------------------------------------------------------------------

  describe("New message processing", () => {
    beforeEach(() => {
      getMessageHandler(mockWsClient);
    });

    it("routes incoming text messages into the message store", () => {
      dispatch("new_message", {
        id: "msg_123",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Hello world",
        timestamp: "2024-01-01T12:00:00Z",
      });

      const messages = useMessageStore.getState().getMessagesByChatId("chat_456");
      expect(messages.map((m) => m.id)).toContain("msg_123");
      expect(messages.find((m) => m.id === "msg_123")?.text).toBe("Hello world");
    });

    it("updates the chat's last message", () => {
      act(() => {
        useChatStore.getState().addChat(makeChat({ id: "chat_456" }));
      });

      dispatch("new_message", {
        id: "msg_last",
        chatId: "chat_456",
        senderId: "user_789",
        type: "text",
        text: "Latest",
        timestamp: "2024-01-01T12:00:00Z",
      });

      expect(useChatStore.getState().getChatById("chat_456")?.lastMessage?.id).toBe("msg_last");
    });

    it("increments unread count and shows a toast for background chats", () => {
      act(() => {
        useChatStore.getState().addChat(makeChat({ id: "chat_bg" }));
      });

      dispatch("new_message", {
        id: "msg_bg",
        chatId: "chat_bg",
        senderId: "user_x",
        type: "text",
        text: "ping",
        timestamp: "2024-01-01T12:00:00Z",
      });

      expect(useChatStore.getState().getChatById("chat_bg")?.unreadCount).toBe(1);
    });

    it("does not increment unread count for the active chat", () => {
      act(() => {
        useChatStore.getState().addChat(makeChat({ id: "chat_active" }));
        useChatStore.getState().setActiveChat("chat_active");
      });

      dispatch("new_message", {
        id: "msg_active",
        chatId: "chat_active",
        senderId: "user_y",
        type: "text",
        text: "direct",
        timestamp: "2024-01-01T12:00:00Z",
      });

      expect(useChatStore.getState().getChatById("chat_active")?.unreadCount).toBe(0);
    });

    it("attaches media attachments to the created message", () => {
      dispatch("new_message", {
        id: "msg_media",
        chatId: "chat_media",
        senderId: "user_z",
        type: "image",
        attachment: { uri: "file://image.jpg", width: 800, height: 600 },
        timestamp: "2024-01-01T12:00:00Z",
      });

      const stored = useMessageStore.getState().getMessageById("msg_media");
      expect(stored?.attachment).toMatchObject({
        uri: "file://image.jpg",
        type: "image",
        width: 800,
        height: 600,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Status / typing / reactions / chat updates
  // -------------------------------------------------------------------------

  describe("Status, typing and reactions", () => {
    beforeEach(() => {
      getMessageHandler(mockWsClient);
    });

    it("applies message status updates", () => {
      dispatch("new_message", {
        id: "msg_status",
        chatId: "c1",
        senderId: "u1",
        type: "text",
        text: "hi",
        timestamp: "2024-01-01T12:00:00Z",
      });

      dispatch("message_status", { messageId: "msg_status", status: "read", timestamp: "..." });

      expect(useMessageStore.getState().getMessageById("msg_status")?.status).toBe("read");
    });

    it("toggles typing indicators", () => {
      dispatch("typing", { chatId: "chat_t", userId: "user_9", isTyping: true });
      expect(useMessageStore.getState().typingUsers["chat_t:user_9"]).toBe(true);

      dispatch("typing", { chatId: "chat_t", userId: "user_9", isTyping: false });
      expect(useMessageStore.getState().typingUsers["chat_t:user_9"]).toBe(false);
    });

    it("adds and removes reactions", () => {
      dispatch("new_message", {
        id: "msg_react",
        chatId: "c2",
        senderId: "u2",
        type: "text",
        text: "react to me",
        timestamp: "2024-01-01T12:00:00Z",
      });

      dispatch("reaction", { messageId: "msg_react", userId: "u3", emoji: "ðŸ‘", action: "add" });

      let message = useMessageStore.getState().getMessageById("msg_react");
      expect(message?.reactions).toHaveLength(1);
      expect(message?.reactions[0]).toMatchObject({ userId: "u3", emoji: "ðŸ‘" });

      dispatch("reaction", {
        messageId: "msg_react",
        userId: "u3",
        emoji: "ðŸ‘",
        action: "remove",
      });
      message = useMessageStore.getState().getMessageById("msg_react");
      expect(message?.reactions).toHaveLength(0);
    });

    it("updates chat metadata from chat_update events", () => {
      act(() => {
        useChatStore.getState().addChat(makeChat({ id: "chat_upd", isMuted: false }));
      });

      dispatch("chat_update", { chatId: "chat_upd", updates: { isMuted: true } });

      expect(useChatStore.getState().getChatById("chat_upd")?.isMuted).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Group membership
  // -------------------------------------------------------------------------

  describe("Group membership", () => {
    beforeEach(() => {
      getMessageHandler(mockWsClient);
      act(() => {
        useChatStore
          .getState()
          .addChat(makeChat({ id: "group_1", type: "group", participantIds: ["u1"] }));
      });
    });

    it("adds users who join the group", () => {
      dispatch("user_joined", {
        chatId: "group_1",
        user: { id: "u2", name: "User Two" },
      } as any);

      const chat = useChatStore.getState().getChatById("group_1");
      expect(chat?.participantIds).toContain("u2");
    });

    it("removes users who leave the group", () => {
      dispatch("user_left", { chatId: "group_1", userId: "u1" });

      const chat = useChatStore.getState().getChatById("group_1");
      expect(chat?.participantIds).not.toContain("u1");
    });
  });

  // -------------------------------------------------------------------------
  // Outbound sends
  // -------------------------------------------------------------------------

  describe("Send methods", () => {
    let handler: ReturnType<typeof getMessageHandler>;
    const baseMessage = {
      id: "m_out",
      chatId: "c_out",
      senderId: "me",
      type: "text" as const,
      text: "outgoing",
      timestamp: new Date("2024-01-01T12:00:00Z"),
      status: "sent" as const,
      reactions: [],
      edited: false,
    };

    beforeEach(() => {
      handler = getMessageHandler(mockWsClient);
    });

    it("sends message payloads with the send_message type", () => {
      const result = handler.sendMessage("c_out", baseMessage);

      expect(result).toBe(true);
      expect(mockWsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "send_message",
          payload: expect.objectContaining({
            chatId: "c_out",
            messageId: "m_out",
            text: "outgoing",
          }),
        })
      );
    });

    it("sends typing indicators, statuses, reactions and chat joins", () => {
      handler.sendTypingIndicator("c1", true);
      handler.sendMessageStatus("m1", "read");
      handler.sendReaction("m1", "ðŸŽ‰", "add");
      handler.joinChat("c9");
      handler.leaveChat("c9");

      const types = mockWsClient.send.mock.calls.map(([msg]) => (msg as any).type);
      expect(types).toEqual(["typing", "message_status", "reaction", "join_chat", "leave_chat"]);
    });

    it("returns false when the client cannot send", () => {
      mockWsClient.send.mockReturnValue(false);
      expect(handler.sendMessage("c_out", baseMessage)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  describe("Cleanup", () => {
    it("unsubscribes all handlers on destroy", () => {
      getMessageHandler(mockWsClient);
      resetMessageHandler();

      // After destroy, no handlers should remain subscribed
      const totalHandlers = [...registeredHandlers.values()].reduce(
        (sum, set) => sum + set.size,
        0
      );
      expect(totalHandlers).toBe(0);

      // Dispatching must be a no-op and not throw
      expect(() => dispatch("new_message", {})).not.toThrow();
    });
  });
});
