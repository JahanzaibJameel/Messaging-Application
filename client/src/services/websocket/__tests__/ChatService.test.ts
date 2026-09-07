/**
 * Unit tests for ChatService
 * Tests chat service lifecycle, message handling, and connection logic.
 */

import React from "react";

// Import after mocks
import { renderHook } from "@testing-library/react-native";
import type { WebSocketClient } from "../WebSocketClient";
import type { MessageHandler } from "../MessageHandler";
// We'll get the mocks via jest.mock() calls below
import {
  initializeChatService,
  disconnectChatService,
  joinChat,
  leaveChat,
  sendChatMessage,
  sendTypingIndicator,
  sendMessageStatus,
  sendReaction,
  isConnected,
  getConnectionStatus,
  resetChatService,
  useChatService,
} from "../ChatService";
import { getToken } from "@/security/keychain";
import { useAuthStore, useMessageStore, useChatStore } from "@/presentation/stores";

// Now we can import the mocked functions
import { getWebSocketClient, resetWebSocketClient } from "../WebSocketClient";
import { getMessageHandler, resetMessageHandler } from "../MessageHandler";

// Mock the stores first
const mockMarkChatAsRead = jest.fn();
const mockAuthStoreReturnValue = {
  currentUser: { id: "user-1", name: "Test User" },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  pendingPhone: undefined,
  login: jest.fn(),
  verifyOtp: jest.fn(),
  logout: jest.fn(),
  setUser: jest.fn(),
  setAuthenticated: jest.fn(),
  clearError: jest.fn(),
};
const mockMessageStoreReturnValue = {
  getMessagesByChatId: jest.fn().mockReturnValue([]),
  addMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  setReplyingTo: jest.fn(),
};

jest.mock("@/presentation/stores", () => ({
  useAuthStore: jest.fn(() => mockAuthStoreReturnValue),
  useMessageStore: jest.fn(() => mockMessageStoreReturnValue),
  useChatStore: jest.fn(() => ({ markChatAsRead: mockMarkChatAsRead })),
  useUIStore: jest.fn(() => ({ showToast: jest.fn() })),
}));

jest.mock("@/security/keychain");
jest.mock("@/core/logger");

// Mock the WebSocketClient and MessageHandler modules
jest.mock("../WebSocketClient", () => ({
  getWebSocketClient: jest.fn(),
  resetWebSocketClient: jest.fn(),
}));

jest.mock("../MessageHandler", () => ({
  getMessageHandler: jest.fn(),
  resetMessageHandler: jest.fn(),
}));

// Create mock instances
const mockWsClient = {
  updateAuthToken: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn().mockReturnValue(true),
  isConnected: jest.fn().mockReturnValue(true),
  getStatus: jest.fn().mockReturnValue("connected"),
  onMessage: jest.fn(),
  onStatusChange: jest.fn(),
};

const mockMessageHandler = {
  sendMessage: jest.fn().mockReturnValue(true),
  joinChat: jest.fn().mockReturnValue(true),
  leaveChat: jest.fn().mockReturnValue(true),
  sendTypingIndicator: jest.fn().mockReturnValue(true),
  sendMessageStatus: jest.fn().mockReturnValue(true),
  sendReaction: jest.fn().mockReturnValue(true),
  destroy: jest.fn(),
};

// Set up mocks for imported functions
getWebSocketClient.mockReturnValue(mockWsClient);
resetWebSocketClient.mockImplementation(() => {
  mockWsClient.isConnected.mockReturnValue(false);
  mockWsClient.getStatus.mockReturnValue("disconnected");
});

getMessageHandler.mockReturnValue(mockMessageHandler);
resetMessageHandler.mockImplementation(() => {
  mockMessageHandler.sendMessage.mockClear();
  mockMessageHandler.joinChat.mockClear();
  mockMessageHandler.leaveChat.mockClear();
  mockMessageHandler.sendTypingIndicator.mockClear();
  mockMessageHandler.sendMessageStatus.mockClear();
  mockMessageHandler.sendReaction.mockClear();
});

jest.mocked(getMessageHandler).mockReturnValue(mockMessageHandler);
jest.mocked(resetMessageHandler).mockImplementation(() => {
  mockMessageHandler.sendMessage.mockClear();
  mockMessageHandler.joinChat.mockClear();
  mockMessageHandler.leaveChat.mockClear();
  mockMessageHandler.sendTypingIndicator.mockClear();
  mockMessageHandler.sendMessageStatus.mockClear();
  mockMessageHandler.sendReaction.mockClear();
});

jest
  .mocked(getToken)
  .mockResolvedValue({ accessToken: "mock-token", refreshToken: "mock-refresh" });

const mockMessage = {
  id: "msg-1",
  chatId: "chat-1",
  senderId: "user-1",
  type: "text" as const,
  text: "Hello World",
  timestamp: new Date(),
  status: "sending" as const,
  reactions: [],
  edited: false,
  localOnly: true,
  retryCount: 0,
};

describe("ChatService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock implementations
    mockWsClient.isConnected.mockReturnValue(true);
    mockWsClient.getStatus.mockReturnValue("connected");
    jest
      .mocked(getToken)
      .mockResolvedValue({ accessToken: "mock-token", refreshToken: "mock-refresh" });
    jest.mocked(getWebSocketClient).mockReturnValue(mockWsClient);
    jest.mocked(getMessageHandler).mockReturnValue(mockMessageHandler);
  });

  afterEach(() => {
    jest.useRealTimers();
    resetChatService();
  });

  describe("initializeChatService", () => {
    it("initializes successfully with a valid token", async () => {
      await initializeChatService();

      expect(getToken).toHaveBeenCalled();
      expect(getWebSocketClient).toHaveBeenCalled();
      expect(mockWsClient.updateAuthToken).toHaveBeenCalledWith("mock-token");
      expect(getMessageHandler).toHaveBeenCalledWith(mockWsClient);
      expect(mockWsClient.connect).toHaveBeenCalled();
    });

    it("does not initialize when already initialized", async () => {
      await initializeChatService();
      jest.mocked(getToken).mockClear();

      await initializeChatService();

      expect(getToken).not.toHaveBeenCalled();
    });

    it("returns early when no auth token is available", async () => {
      jest.mocked(getToken).mockResolvedValue({ accessToken: null, refreshToken: null });

      await initializeChatService();

      expect(mockWsClient.connect).not.toHaveBeenCalled();
    });

    it("handles errors during initialization", async () => {
      jest.mocked(getToken).mockRejectedValue(new Error("Token fetch failed"));

      await initializeChatService();

      expect(mockWsClient.connect).not.toHaveBeenCalled();
    });
  });

  describe("disconnectChatService", () => {
    it("disconnects the WebSocket client and resets handlers", () => {
      mockWsClient.isConnected.mockReturnValue(true);

      disconnectChatService();

      expect(mockWsClient.disconnect).toHaveBeenCalled();
      expect(resetMessageHandler).toHaveBeenCalled();
    });
  });

  describe("sendChatMessage", () => {
    it("sends message when connected", () => {
      mockWsClient.isConnected.mockReturnValue(true);

      const result = sendChatMessage("chat-1", mockMessage);

      expect(result).toBe(true);
      expect(mockMessageHandler.sendMessage).toHaveBeenCalledWith("chat-1", mockMessage);
    });

    it("does not send message when not connected", () => {
      mockWsClient.isConnected.mockReturnValue(false);

      const result = sendChatMessage("chat-1", mockMessage);

      expect(result).toBe(false);
      expect(mockMessageHandler.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("joinChat", () => {
    it("joins a chat when connected", () => {
      mockWsClient.isConnected.mockReturnValue(true);

      const result = joinChat("chat-1");

      expect(result).toBe(true);
      expect(mockMessageHandler.joinChat).toHaveBeenCalledWith("chat-1");
    });

    it("does not join when not connected", () => {
      mockWsClient.isConnected.mockReturnValue(false);

      const result = joinChat("chat-1");

      expect(result).toBe(false);
      expect(mockMessageHandler.joinChat).not.toHaveBeenCalled();
    });
  });

  describe("leaveChat", () => {
    it("leaves a chat when connected", () => {
      mockWsClient.isConnected.mockReturnValue(true);

      const result = leaveChat("chat-1");

      expect(result).toBe(true);
      expect(mockMessageHandler.leaveChat).toHaveBeenCalledWith("chat-1");
    });

    it("does not leave when not connected", () => {
      mockWsClient.isConnected.mockReturnValue(false);

      const result = leaveChat("chat-1");

      expect(result).toBe(false);
      expect(mockMessageHandler.leaveChat).not.toHaveBeenCalled();
    });
  });

  describe("sendTypingIndicator", () => {
    it("sends typing indicator when connected", () => {
      mockWsClient.isConnected.mockReturnValue(true);

      const result = sendTypingIndicator("chat-1", true);

      expect(result).toBe(true);
      expect(mockMessageHandler.sendTypingIndicator).toHaveBeenCalledWith("chat-1", true);
    });

    it("does not send when not connected", () => {
      mockWsClient.isConnected.mockReturnValue(false);

      const result = sendTypingIndicator("chat-1", true);

      expect(result).toBe(false);
      expect(mockMessageHandler.sendTypingIndicator).not.toHaveBeenCalled();
    });
  });

  describe("sendMessageStatus", () => {
    it("sends message status when connected", () => {
      mockWsClient.isConnected.mockReturnValue(true);

      const result = sendMessageStatus("msg-1", "read");

      expect(result).toBe(true);
      expect(mockMessageHandler.sendMessageStatus).toHaveBeenCalledWith("msg-1", "read");
    });

    it("does not send when not connected", () => {
      mockWsClient.isConnected.mockReturnValue(false);

      const result = sendMessageStatus("msg-1", "read");

      expect(result).toBe(false);
      expect(mockMessageHandler.sendMessageStatus).not.toHaveBeenCalled();
    });
  });

  describe("sendReaction", () => {
    it("sends reaction when connected", () => {
      mockWsClient.isConnected.mockReturnValue(true);

      const result = sendReaction("msg-1", "👍", "add");

      expect(result).toBe(true);
      expect(mockMessageHandler.sendReaction).toHaveBeenCalledWith("msg-1", "👍", "add");
    });

    it("does not send when not connected", () => {
      mockWsClient.isConnected.mockReturnValue(false);

      const result = sendReaction("msg-1", "👍", "add");

      expect(result).toBe(false);
      expect(mockMessageHandler.sendReaction).not.toHaveBeenCalled();
    });
  });

  describe("isConnected", () => {
    it("returns connection status from WebSocket client", () => {
      mockWsClient.isConnected.mockReturnValue(true);
      expect(isConnected()).toBe(true);

      mockWsClient.isConnected.mockReturnValue(false);
      expect(isConnected()).toBe(false);
    });
  });

  describe("getConnectionStatus", () => {
    it("returns connection status from WebSocket client", () => {
      mockWsClient.getStatus.mockReturnValue("connected");
      expect(getConnectionStatus()).toBe("connected");

      mockWsClient.getStatus.mockReturnValue("disconnected");
      expect(getConnectionStatus()).toBe("disconnected");
    });
  });

  describe("resetChatService", () => {
    it("resets WebSocket client and message handler", () => {
      resetChatService();

      expect(resetWebSocketClient).toHaveBeenCalled();
      expect(resetMessageHandler).toHaveBeenCalled();
    });
  });

  describe("useChatService hook", () => {
    beforeEach(() => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        currentUser: { id: "user-1", name: "Test User" },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        pendingPhone: undefined,
        login: jest.fn(),
        verifyOtp: jest.fn(),
        logout: jest.fn(),
        setUser: jest.fn(),
        setAuthenticated: jest.fn(),
        clearError: jest.fn(),
      });

      (useMessageStore as unknown as jest.Mock).mockReturnValue({
        getMessagesByChatId: jest.fn().mockReturnValue([]),
        addMessage: jest.fn(),
        updateMessage: jest.fn(),
        deleteMessage: jest.fn(),
        setReplyingTo: jest.fn(),
      });

      (useChatStore as unknown as jest.Mock).mockReturnValue({
        markChatAsRead: jest.fn(),
      });
    });

    it("renders the hook with chatId and provides required functions", () => {
      const { result } = renderHook(() => useChatService("test-chat-1"));

      expect(result.current.sendMessage).toBeDefined();
      expect(result.current.isConnected).toBeDefined();
      expect(result.current.sendTyping).toBeDefined();
      expect(result.current.markAsRead).toBeDefined();
    });

    it("returns undefined when calling sendMessage with null chatId", () => {
      const { result } = renderHook(() => useChatService(null));

      const returnValue = result.current.sendMessage("test message");
      expect(returnValue).toBeUndefined();
    });
  });
});
