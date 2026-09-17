/**
 * Unit tests for ChatService
 * Tests chat service lifecycle, message handling, and connection logic.
 */

// Import after mocks
import { act, renderHook } from "@testing-library/react-native";
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
import { getWebSocketClient, resetWebSocketClient, type WebSocketStatus } from "../WebSocketClient";
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
  useAuthStore: Object.assign(
    jest.fn(() => mockAuthStoreReturnValue),
    {
      getState: jest.fn(),
    }
  ),
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

const statusHandlers = new Set<(status: WebSocketStatus) => void>();

function emitStatus(status: WebSocketStatus) {
  mockWsClient.getStatus.mockReturnValue(status);
  mockWsClient.isConnected.mockReturnValue(status === "connected");
  statusHandlers.forEach((handler) => handler(status));
}

function deferToken() {
  let resolve!: (tokens: Awaited<ReturnType<typeof getToken>>) => void;
  const promise = new Promise<Awaited<ReturnType<typeof getToken>>>((resolveToken) => {
    resolve = resolveToken;
  });
  jest.mocked(getToken).mockReturnValueOnce(promise);
  return { resolve, promise };
}

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
const mockGetWebSocketClient = getWebSocketClient as jest.Mock;
const mockResetWebSocketClient = resetWebSocketClient as jest.Mock;
const mockGetMessageHandler = getMessageHandler as jest.Mock;
const mockResetMessageHandler = resetMessageHandler as jest.Mock;

mockGetWebSocketClient.mockReturnValue(mockWsClient);
mockResetWebSocketClient.mockImplementation(() => {
  mockWsClient.isConnected.mockReturnValue(false);
  mockWsClient.getStatus.mockReturnValue("disconnected");
});

mockGetMessageHandler.mockReturnValue(mockMessageHandler);
mockResetMessageHandler.mockImplementation(() => {
  mockMessageHandler.sendMessage.mockClear();
  mockMessageHandler.joinChat.mockClear();
  mockMessageHandler.leaveChat.mockClear();
  mockMessageHandler.sendTypingIndicator.mockClear();
  mockMessageHandler.sendMessageStatus.mockClear();
  mockMessageHandler.sendReaction.mockClear();
});

mockGetMessageHandler.mockReturnValue(mockMessageHandler);
mockResetMessageHandler.mockImplementation(() => {
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
    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockAuthStoreReturnValue);
    jest.mocked(useAuthStore.getState).mockImplementation(() => useAuthStore());
    statusHandlers.clear();
    mockWsClient.onStatusChange.mockImplementation((handler: (status: WebSocketStatus) => void) => {
      statusHandlers.add(handler);
      handler(mockWsClient.getStatus() as WebSocketStatus);
      return jest.fn(() => statusHandlers.delete(handler));
    });
    mockWsClient.disconnect.mockImplementation(() => emitStatus("disconnected"));

    // Reset mock implementations
    mockWsClient.isConnected.mockReturnValue(true);
    mockWsClient.getStatus.mockReturnValue("connected");
    jest
      .mocked(getToken)
      .mockResolvedValue({ accessToken: "mock-token", refreshToken: "mock-refresh" });
    mockGetWebSocketClient.mockReturnValue(mockWsClient);
    mockGetMessageHandler.mockReturnValue(mockMessageHandler);
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

    it.each([disconnectChatService, resetChatService])(
      "invalidates pending initialization on %p without blocking a fresh attempt",
      async (cleanupService) => {
        const staleToken = deferToken();
        const staleInitialization = initializeChatService();
        cleanupService();
        const freshToken = deferToken();
        const freshInitialization = initializeChatService();

        staleToken.resolve({ accessToken: "stale-token", refreshToken: null });
        await staleInitialization;
        await initializeChatService();
        expect(getToken).toHaveBeenCalledTimes(2);
        expect(mockWsClient.connect).not.toHaveBeenCalled();

        freshToken.resolve({ accessToken: "fresh-token", refreshToken: null });
        await freshInitialization;
        expect(mockWsClient.updateAuthToken).toHaveBeenCalledTimes(1);
        expect(mockWsClient.updateAuthToken).toHaveBeenCalledWith("fresh-token");
        expect(mockWsClient.connect).toHaveBeenCalledTimes(1);
      }
    );

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

    it("authenticates before connecting, joins on open and reconnect, and reports status reactively", async () => {
      emitStatus("disconnected");
      const token = deferToken();
      const { result } = renderHook(() => useChatService("chat-1"));

      expect(result.current.isConnected).toBe(false);
      expect(mockWsClient.connect).not.toHaveBeenCalled();
      expect(mockMessageHandler.joinChat).not.toHaveBeenCalled();

      await act(async () => {
        token.resolve({ accessToken: "hook-token", refreshToken: null });
        await token.promise;
      });

      expect(mockWsClient.updateAuthToken).toHaveBeenCalledWith("hook-token");
      expect(mockWsClient.updateAuthToken.mock.invocationCallOrder[0]).toBeLessThan(
        mockWsClient.connect.mock.invocationCallOrder[0]
      );
      expect(mockWsClient.onStatusChange.mock.invocationCallOrder[0]).toBeLessThan(
        mockWsClient.connect.mock.invocationCallOrder[0]
      );
      expect(mockWsClient.connect).toHaveBeenCalledTimes(1);
      expect(mockMessageHandler.joinChat).not.toHaveBeenCalled();

      act(() => emitStatus("connecting"));
      expect(result.current.isConnected).toBe(false);
      act(() => emitStatus("connected"));
      expect(result.current.isConnected).toBe(true);
      expect(mockMessageHandler.joinChat).toHaveBeenCalledTimes(1);
      expect(mockMessageHandler.joinChat).toHaveBeenLastCalledWith("chat-1");

      act(() => emitStatus("disconnected"));
      expect(result.current.isConnected).toBe(false);
      act(() => emitStatus("reconnecting"));
      expect(result.current.isConnected).toBe(false);
      act(() => emitStatus("connected"));
      expect(result.current.isConnected).toBe(true);
      expect(mockMessageHandler.joinChat).toHaveBeenCalledTimes(2);
      expect(mockMessageHandler.joinChat).toHaveBeenLastCalledWith("chat-1");
    });

    it("joins an already open connection and cleans up on chat changes and unmount", async () => {
      await initializeChatService();
      const { result, rerender, unmount } = renderHook(
        ({ chatId }: { chatId: string }) => useChatService(chatId),
        { initialProps: { chatId: "chat-1" } }
      );
      const unsubscribe = mockWsClient.onStatusChange.mock.results[0].value;

      expect(result.current.isConnected).toBe(true);
      expect(mockMessageHandler.joinChat).toHaveBeenCalledWith("chat-1");
      expect(useChatStore().markChatAsRead).toHaveBeenCalledWith("chat-1");
      rerender({ chatId: "chat-2" });
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(mockMessageHandler.leaveChat).toHaveBeenCalledWith("chat-1");
      expect(mockMessageHandler.joinChat).toHaveBeenLastCalledWith("chat-2");
      expect(statusHandlers.size).toBe(1);
      expect(mockWsClient.connect).toHaveBeenCalledTimes(1);

      act(() => {
        emitStatus("disconnected");
        emitStatus("connected");
      });
      expect(mockMessageHandler.joinChat.mock.calls).toEqual([["chat-1"], ["chat-2"], ["chat-2"]]);
      unmount();
      expect(mockMessageHandler.leaveChat).toHaveBeenLastCalledWith("chat-2");
      expect(statusHandlers.size).toBe(0);
      act(() => emitStatus("connected"));
      expect(mockMessageHandler.joinChat).toHaveBeenCalledTimes(3);
    });

    it.each([
      { currentUser: null, isAuthenticated: false },
      { currentUser: mockAuthStoreReturnValue.currentUser, isAuthenticated: false },
      { currentUser: null, isAuthenticated: true },
    ])("does not initialize or subscribe without authenticated user: %j", async (auth) => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        ...mockAuthStoreReturnValue,
        ...auth,
      });
      const { result } = renderHook(() => useChatService("chat-1"));
      await act(async () => {});

      expect(result.current.isConnected).toBe(false);
      expect(getToken).not.toHaveBeenCalled();
      expect(mockWsClient.connect).not.toHaveBeenCalled();
      expect(mockWsClient.onStatusChange).not.toHaveBeenCalled();
      expect(mockMessageHandler.joinChat).not.toHaveBeenCalled();
    });

    it("does not connect or join when the authenticated user has no token", async () => {
      emitStatus("disconnected");
      jest.mocked(getToken).mockResolvedValue({ accessToken: null, refreshToken: null });
      const { result } = renderHook(() => useChatService("chat-1"));
      await act(async () => {});

      expect(result.current.isConnected).toBe(false);
      expect(mockWsClient.connect).not.toHaveBeenCalled();
      expect(mockMessageHandler.joinChat).not.toHaveBeenCalled();
    });

    it("does not restore a chat subscription when initialization finishes after unmount", async () => {
      emitStatus("disconnected");
      const token = deferToken();
      const { unmount } = renderHook(() => useChatService("chat-1"));
      const unsubscribe = mockWsClient.onStatusChange.mock.results[0].value;
      unmount();

      await act(async () => {
        token.resolve({ accessToken: "hook-token", refreshToken: null });
        await token.promise;
        emitStatus("connected");
      });

      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(statusHandlers.size).toBe(0);
      expect(mockWsClient.onStatusChange).toHaveBeenCalledTimes(1);
      expect(mockMessageHandler.joinChat).not.toHaveBeenCalled();
    });

    it("ignores a pending token after logout even if the hook has unmounted", async () => {
      emitStatus("disconnected");
      const token = deferToken();
      const { unmount } = renderHook(() => useChatService("chat-1"));
      unmount();
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        ...mockAuthStoreReturnValue,
        currentUser: null,
        isAuthenticated: false,
      });

      await act(async () => {
        token.resolve({ accessToken: "stale-token", refreshToken: null });
        await token.promise;
      });

      expect(mockWsClient.updateAuthToken).not.toHaveBeenCalled();
      expect(mockWsClient.connect).not.toHaveBeenCalled();
      expect(statusHandlers.size).toBe(0);
    });

    it("disconnects and removes the subscription on logout", async () => {
      const { result, rerender } = renderHook(() => useChatService("chat-1"));
      await act(async () => {});
      const unsubscribe = mockWsClient.onStatusChange.mock.results[0].value;
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        ...mockAuthStoreReturnValue,
        currentUser: null,
        isAuthenticated: false,
      });
      rerender({});

      expect(result.current.isConnected).toBe(false);
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(mockWsClient.disconnect).toHaveBeenCalledTimes(1);
      expect(statusHandlers.size).toBe(0);
    });

    it("returns undefined when calling sendMessage with null chatId", () => {
      const { result } = renderHook(() => useChatService(null));

      const returnValue = result.current.sendMessage("test message");
      expect(returnValue).toBeUndefined();
    });
  });
});
