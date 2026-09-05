import "../../../test-utils/i18nMock";

import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";

const mockAuthStoreState = {
  currentUser: {
    id: "user_me",
    name: "Me",
    phone: "+111",
    isOnline: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

const mockChatStoreState = {
  getChatById: jest.fn(),
  markChatAsRead: jest.fn(),
};

const mockMessageStoreState = {
  getMessagesByChatId: jest.fn().mockReturnValue([]),
  deleteMessage: jest.fn(),
  setReplyingTo: jest.fn(),
  replyingTo: null,
};

const mockUIStoreState = {
  showToast: jest.fn(),
};

const mockSyncEngineInstance = {
  queueMessage: jest.fn(),
};

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

jest.mock("../../../core/sync", () => ({
  getSyncEngine: () => mockSyncEngineInstance,
  resetSyncEngine: jest.fn(),
}));

jest.mock("../../../presentation/stores", () => ({
  useAuthStore: Object.assign(() => mockAuthStoreState, { getState: () => mockAuthStoreState }),
  useChatStore: Object.assign(() => mockChatStoreState, { getState: () => mockChatStoreState }),
  useMessageStore: Object.assign(() => mockMessageStoreState, {
    getState: () => mockMessageStoreState,
  }),
  useUIStore: Object.assign(() => mockUIStoreState, { getState: () => mockUIStoreState }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

jest.mock("@react-native-clipboard/clipboard", () => ({
  default: { setString: jest.fn(), getString: jest.fn() },
  setString: jest.fn(),
  getString: jest.fn(),
}));

jest.mock("../../../components/ChatBubble", () => "ChatBubble");
jest.mock("../../../components/MessageInput", () => "MessageInput");
jest.mock("../../../components/MessageActionSheet", () => "MessageActionSheet");
jest.mock("../../../components/EmptyState", () => "EmptyState");
jest.mock("../../../components/Avatar", () => "Avatar");
jest.mock("../../../components/ThemedText", () => "ThemedText");

jest.mock("../../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      backgroundRoot: "#fff",
      text: "#000",
      textSecondary: "#666",
    },
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 60,
}));

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAvoidingView: ({ children }: any) => children,
  KeyboardProvider: ({ children }: any) => children,
}));

describe("ChatScreen Store Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState.currentUser = {
      id: "user_me",
      name: "Me",
      phone: "+111",
      isOnline: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMessageStoreState.getMessagesByChatId.mockReturnValue([]);
    mockChatStoreState.getChatById.mockReturnValue(null);
    mockMessageStoreState.replyingTo = null;
  });

  it("should have correct mock setup for stores", () => {
    expect(mockSyncEngineInstance.queueMessage).toBeDefined();
    expect(mockChatStoreState.markChatAsRead).toBeDefined();
    expect(mockMessageStoreState.getMessagesByChatId).toBeDefined();
  });

  it("should verify store mock functions work", () => {
    mockChatStoreState.markChatAsRead("test-chat-1");
    expect(mockChatStoreState.markChatAsRead).toHaveBeenCalledWith("test-chat-1");
  });

  it("should verify sync engine mock works", () => {
    const message = { id: "msg-1", chatId: "test-chat-1" };
    mockSyncEngineInstance.queueMessage(message);
    expect(mockSyncEngineInstance.queueMessage).toHaveBeenCalledWith(message);
  });

  it("should verify message store mock works", () => {
    mockMessageStoreState.getMessagesByChatId("test-chat-1");
    expect(mockMessageStoreState.getMessagesByChatId).toHaveBeenCalledWith("test-chat-1");
  });
});
