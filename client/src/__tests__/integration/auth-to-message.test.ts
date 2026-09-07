/**
 * Integration tests for the complete auth-to-message vertical slice.
 * Tests OTP verification, token storage, WebSocket connection, and message flow.
 */

import "../../../test-utils/i18nMock";

import React from "react";
import { act } from "@testing-library/react-native";

// Import stores after mocks
import { useAuthStore } from "@/presentation/stores/authStore";
import { useMessageStore } from "@/presentation/stores/messageStore";
import { useChatStore } from "@/presentation/stores/chatStore";
import { setToken, resetToken, getToken } from "@/security/keychain";
import {
  initializeChatService,
  sendChatMessage,
  joinChat,
  disconnectChatService,
  resetChatService,
} from "@/services/websocket/ChatService";

// Mock keychain to store/retrieve tokens
const mockTokenStore: { accessToken: string | null; refreshToken: string | null } = {
  accessToken: null,
  refreshToken: null,
};

// Mock WebSocket for client-side
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { wasClean: boolean; code?: number; reason?: string }) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    this.sent.push(data);

    // Auto-respond to join_chat
    if (data.includes("join_chat")) {
      this.triggerMessage(
        JSON.stringify({
          type: "joined",
          chatId: JSON.parse(data).payload?.chatId,
        })
      );
    }
  }

  close(code: number = 1000, reason: string = ""): void {
    if (this.closed) return;
    this.closed = true;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ wasClean: true, code, reason });
  }

  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  triggerMessage(data: string): void {
    this.onmessage?.({ data });
  }

  triggerUncleanClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ wasClean: false });
  }
}

// Set up WebSocket factory
const wsInstances: MockWebSocket[] = [];
const originalWebSocket = (typeof global !== "undefined" ? global : {}).WebSocket;

const mockWebSocketFactory = jest.fn((url: string) => {
  const ws = new MockWebSocket(url);
  wsInstances.push(ws);
  return ws;
});
// Attach WebSocket constants to the mock factory
Object.assign(mockWebSocketFactory, MockWebSocket);

// Set up global WebSocket mock
beforeAll(() => {
  (global as any).WebSocket = mockWebSocketFactory;
});

afterAll(() => {
  (global as any).WebSocket = originalWebSocket;
});

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock keychain (the auth store uses setToken/resetToken which use react-native-keychain)
jest.mock("react-native-keychain", () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => {
    if (mockTokenStore.accessToken) {
      return Promise.resolve({ username: "access_token", password: mockTokenStore.accessToken });
    }
    return Promise.resolve(false);
  }),
  resetGenericPassword: jest.fn(() => {
    mockTokenStore.accessToken = null;
    mockTokenStore.refreshToken = null;
    return Promise.resolve(true);
  }),
  ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: "BIOMETRY_ANY_OR_DEVICE_PASSCODE" },
}));

// Mock MMKV
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

jest.mock("expo-localization", () => ({
  getLocales: () => [
    {
      languageCode: "en",
      languageTag: "en-US",
      currencyCode: "USD",
      regionCode: "US",
      isRTL: false,
    },
  ],
}));

// Mock the RemoteApiDataSource with a successful response
const mockLoginResponse = { data: { success: true }, success: true };
const mockVerifyOtpResponse = {
  data: {
    token: "test-jwt-token",
    refreshToken: "test-refresh-token",
    user: {
      id: "user-123",
      name: "Test User",
      phone: "+1234567890",
      isOnline: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  },
  success: true,
};

jest.mock("@/data/datasources/RemoteApiDataSource", () => ({
  RemoteApiDataSource: jest.fn().mockImplementation(() => ({
    setAuthToken: jest.fn(),
    login: jest.fn().mockResolvedValue(mockLoginResponse),
    verifyOtp: jest.fn().mockResolvedValue(mockVerifyOtpResponse.data),
    logout: jest.fn().mockResolvedValue(undefined),
    getCurrentUser: jest.fn(),
    getUserById: jest.fn(),
    getUsersByIds: jest.fn(),
    updateUser: jest.fn(),
    updateProfile: jest.fn(),
    getChats: jest.fn(),
    getChatById: jest.fn(),
    createPrivateChat: jest.fn(),
    createGroup: jest.fn(),
    updateChat: jest.fn(),
    deleteChat: jest.fn(),
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    makeAdmin: jest.fn(),
    removeAdmin: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
    syncMessages: jest.fn(),
    batchSendMessages: jest.fn(),
    sendTypingIndicator: jest.fn(),
    addReaction: jest.fn(),
    removeReaction: jest.fn(),
  })),
  remoteApiDataSource: {
    setAuthToken: jest.fn(),
    login: jest.fn().mockResolvedValue(mockLoginResponse),
    verifyOtp: jest.fn().mockResolvedValue(mockVerifyOtpResponse.data),
    logout: jest.fn().mockResolvedValue(undefined),
    getCurrentUser: jest.fn(),
    getUserById: jest.fn(),
    getUsersByIds: jest.fn(),
    updateUser: jest.fn(),
    updateProfile: jest.fn(),
    getChats: jest.fn(),
    getChatById: jest.fn(),
    createPrivateChat: jest.fn(),
    createGroup: jest.fn(),
    updateChat: jest.fn(),
    deleteChat: jest.fn(),
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    makeAdmin: jest.fn(),
    removeAdmin: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
    syncMessages: jest.fn(),
    batchSendMessages: jest.fn(),
    sendTypingIndicator: jest.fn(),
    addReaction: jest.fn(),
    removeReaction: jest.fn(),
  },
}));

// Mock logger
jest.mock("@/core/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    setUserId: jest.fn(),
  },
}));

// Mock Sentry
jest.mock("@/monitoring/sentry", () => ({
  captureException: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
  startTransaction: jest.fn(() => ({ finish: jest.fn() })),
  setUser: jest.fn(),
  clearUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock Message type for test
function createTestMessage(id: string, chatId: string, text: string) {
  return {
    id,
    chatId,
    senderId: "user-123",
    type: "text" as const,
    text,
    timestamp: new Date(),
    status: "sending" as const,
    reactions: [],
    edited: false,
    localOnly: true,
    retryCount: 0,
  };
}

describe("Auth-to-Message Vertical Slice Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wsInstances.length = 0;
    mockFetch.mockClear();

    // Reset stores to initial state
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      pendingPhone: undefined,
    });

    useMessageStore.setState({
      messages: { ids: [], entities: {} },
      messagesByChatId: {},
      typingUsers: {},
      replyingTo: null,
      hasMoreMessages: {},
    });

    useChatStore.setState({
      chats: { ids: [], entities: {} },
      activeChatId: null,
      isLoading: false,
      error: null,
    });

    // Clear token store
    mockTokenStore.accessToken = null;
    mockTokenStore.refreshToken = null;

    // Reset chat service state
    resetChatService();
  });

  describe("Complete Auth Flow", () => {
    it("should complete OTP verification and store token securely", async () => {
      const { remoteApiDataSource } = await import("@/data/datasources/RemoteApiDataSource");

      // Step 1: Request OTP
      await useAuthStore.getState().login("+1234567890");

      expect(remoteApiDataSource.login).toHaveBeenCalledWith("+1234567890");
      expect(useAuthStore.getState().pendingPhone).toBe("+1234567890");
      expect(useAuthStore.getState().error).toBeNull();

      // Step 2: Verify OTP
      const result = await useAuthStore.getState().verifyOtp("123456");

      expect(result).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().currentUser).not.toBeNull();
      expect(useAuthStore.getState().currentUser?.name).toBe("Test User");
      expect(useAuthStore.getState().currentUser?.id).toBe("user-123");

      // Step 3: Verify token was stored in keychain
      const tokens = await getToken();
      expect(tokens.accessToken).toBe("test-jwt-token");
      expect(tokens.refreshToken).toBe("test-refresh-token");
    });

    it("should handle OTP verification failure", async () => {
      const { remoteApiDataSource } = await import("@/data/datasources/RemoteApiDataSource");

      // Set up pending phone
      useAuthStore.setState({
        pendingPhone: "+1234567890",
        isLoading: false,
        error: null,
      });

      // Mock verification failure
      (remoteApiDataSource.verifyOtp as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: "Invalid OTP",
      });

      const result = await useAuthStore.getState().verifyOtp("000000");

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBeDefined();
      expect(useAuthStore.getState().currentUser).toBeNull();
    });
  });

  describe("Logout Flow", () => {
    it("should clear auth state and token on logout", async () => {
      const { remoteApiDataSource } = await import("@/data/datasources/RemoteApiDataSource");

      // First authenticate
      useAuthStore.setState({
        currentUser: {
          id: "user-123",
          name: "Test User",
          phone: "+1234567890",
          isOnline: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        pendingPhone: undefined,
      });
      mockTokenStore.accessToken = "test-jwt-token";

      // Logout
      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().currentUser).toBeNull();
      expect(useAuthStore.getState().error).toBeNull();
      expect(remoteApiDataSource.logout).toHaveBeenCalled();

      // Verify token was cleared
      const tokens = await getToken();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.refreshToken).toBeNull();
    });
  });

  describe("WebSocket Connection with Token", () => {
    it("should connect WebSocket with the stored token after auth", async () => {
      const { remoteApiDataSource } = await import("@/data/datasources/RemoteApiDataSource");

      // Mock WebSocket connection
      (remoteApiDataSource.verifyOtp as jest.Mock).mockResolvedValueOnce({
        token: "integration-jwt-token",
        refreshToken: "integration-refresh-token",
        user: {
          id: "user-123",
          name: "Test User",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });

      // Authenticate user
      useAuthStore.setState({
        pendingPhone: "+1234567890",
        isLoading: false,
        error: null,
      });
      const result = await useAuthStore.getState().verifyOtp("123456");
      expect(result).toBe(true);

      // Token should be stored
      await setToken("integration-jwt-token", "integration-refresh-token");
      const tokens = await getToken();
      expect(tokens.accessToken).toBe("integration-jwt-token");

      // Initialize chat service
      await initializeChatService();

      // Verify WebSocket was created with token in URL
      expect(wsInstances.length).toBeGreaterThan(0);
      expect(wsInstances[wsInstances.length - 1].url).toContain("integration-jwt-token");

      // Clean up
      disconnectChatService();
    });
  });

  describe("Message Flow", () => {
    it("should send and receive messages through the chat service", async () => {
      const { remoteApiDataSource } = await import("@/data/datasources/RemoteApiDataSource");

      // Mock WebSocket connection
      (remoteApiDataSource.verifyOtp as jest.Mock).mockResolvedValueOnce({
        token: "msg-flow-token",
        refreshToken: null,
        user: {
          id: "user-123",
          name: "Test User",
          phone: "+1234567890",
          isOnline: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });

      // Authenticate
      useAuthStore.setState({
        pendingPhone: "+1234567890",
        isLoading: false,
        error: null,
      });
      await useAuthStore.getState().verifyOtp("123456");

      // Initialize chat service
      await initializeChatService();

      // Join a chat
      const chatId = "chat_integration_test";
      const ws = wsInstances[wsInstances.length - 1];
      ws.triggerOpen();

      joinChat(chatId);

      // Verify join message was sent
      const sentData = ws.sent.find((s) => s.includes("join_chat"));
      expect(sentData).toBeDefined();

      // Send a message
      const message = createTestMessage("msg-integration", chatId, "Integration test message");

      // Add to message store
      useMessageStore.getState().addMessage(message);

      // Verify message was stored
      const storedMessages = useMessageStore.getState().getMessagesByChatId(chatId);
      expect(storedMessages.some((m) => m.id === "msg-integration")).toBe(true);
      expect(storedMessages.find((m) => m.id === "msg-integration")?.text).toBe(
        "Integration test message"
      );

      // Simulate incoming message
      const incomingMessage = JSON.stringify({
        type: "message",
        id: "server-msg-1",
        chatId,
        senderId: "other-user",
        text: "Hello from server",
        timestamp: new Date().toISOString(),
        status: "sent",
        reactions: [],
        edited: false,
        localOnly: false,
        retryCount: 0,
      });

      act(() => {
        ws.triggerMessage(incomingMessage);
      });

      // Verify incoming message was received
      const updatedMessages = useMessageStore.getState().getMessagesByChatId(chatId);
      expect(updatedMessages.some((m) => m.id === "server-msg-1")).toBe(true);

      // Clean up
      disconnectChatService();
    });
  });

  describe("Token Persistence and Retrieval", () => {
    it("should store and retrieve tokens correctly", async () => {
      // Store tokens
      await setToken("persist-test-token", "persist-refresh-token");

      // Retrieve tokens
      const tokens = await getToken();

      expect(tokens.accessToken).toBe("persist-test-token");
      expect(tokens.refreshToken).toBe("persist-refresh-token");
    });

    it("should clear tokens on reset", async () => {
      await setToken("persist-test-token", "persist-refresh-token");

      // Reset token
      await resetToken();

      // Verify tokens are cleared
      const tokens = await getToken();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.refreshToken).toBeNull();
    });
  });
});
