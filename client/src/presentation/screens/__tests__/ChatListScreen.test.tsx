/**
 * ChatListScreen Component Tests
 * Tests the real ChatListScreen using useChatStore and useUIStore.
 */

import "../../../test-utils/i18nMock";

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import ChatListScreen from "../ChatListScreen";
import { useChatStore } from "../../stores/chatStore";
import { useUIStore } from "../../stores/uiStore";
import type { Chat } from "@domain/entities/Chat";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 56,
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 49,
}));

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: "chat-1",
    type: "private",
    participantIds: ["user-a", "user-b"],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    lastMessage: {
      id: "msg-1",
      chatId: "chat-1",
      senderId: "user-a",
      type: "text" as const,
      text: "Hello there",
      timestamp: new Date("2024-01-01T10:00:00Z"),
      status: "delivered" as const,
      reactions: [],
    },
    ...overrides,
  } as Chat;
}

function seedChats(chats: Chat[]) {
  useChatStore.setState((state) => {
    const ids = chats.map((c) => c.id);
    const entities: Record<string, Chat> = {};
    chats.forEach((c) => {
      entities[c.id] = c;
    });
    return { ...state, chats: { ids, entities } };
  });
}

function renderScreen() {
  return render(<ChatListScreen navigation={mockNavigation as any} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ChatListScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset stores to clean state
    useChatStore.setState({
      chats: { ids: [], entities: {} },
      activeChatId: null,
      isLoading: false,
      error: null,
    });
    useUIStore.setState({
      toasts: [],
      isOnline: true,
      isSyncing: false,
      searchQuery: "",
      showSearch: false,
    });
  });

  describe("Renders chats from store", () => {
    it("renders a private chat row", () => {
      const chat = makeChat({ id: "c1" });
      seedChats([chat]);
      renderScreen();
      // Private chats render as "Private Chat"
      expect(screen.getByText("Private Chat")).toBeTruthy();
    });

    it("renders a group chat name", () => {
      const groupChat = {
        ...makeChat({ id: "g1", type: "group" as const }),
        name: "Team Alpha",
        description: "",
        avatarUrl: undefined,
        adminIds: ["user-a"],
      };
      seedChats([groupChat as any]);
      renderScreen();
      expect(screen.getByText("Team Alpha")).toBeTruthy();
    });

    it("renders last message text", () => {
      seedChats([makeChat({ id: "c1" })]);
      renderScreen();
      expect(screen.getByText("Hello there")).toBeTruthy();
    });

    it("renders unread badge when unreadCount > 0", () => {
      seedChats([makeChat({ id: "c1", unreadCount: 3 })]);
      renderScreen();
      expect(screen.getByText("3")).toBeTruthy();
    });

    it("renders 99+ badge for large unread counts", () => {
      seedChats([makeChat({ id: "c1", unreadCount: 150 })]);
      renderScreen();
      expect(screen.getByText("99+")).toBeTruthy();
    });
  });

  describe("Empty state", () => {
    it("renders empty state when there are no chats", () => {
      renderScreen();
      expect(screen.getByText("No chats yet")).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("calls navigation.navigate with chatId and participantId when a private chat is pressed", () => {
      const chat = makeChat({ id: "c1", participantIds: ["currentUser", "user-b"] });
      seedChats([chat]);
      renderScreen();

      const chatRow = screen.getByText("Private Chat");
      fireEvent.press(chatRow);

      expect(mockNavigate).toHaveBeenCalledWith("Chat", {
        chatId: "c1",
        participantId: "user-b",
      });
    });

    it("calls navigation.navigate with isGroup=true for group chats", () => {
      const groupChat = {
        ...makeChat({ id: "g1", type: "group" as const }),
        name: "Friends",
        description: "",
        avatarUrl: undefined,
        adminIds: ["user-a"],
      };
      seedChats([groupChat as any]);
      renderScreen();

      const chatRow = screen.getByText("Friends");
      fireEvent.press(chatRow);

      expect(mockNavigate).toHaveBeenCalledWith("Chat", {
        chatId: "g1",
        participantId: "",
        isGroup: true,
      });
    });
  });

  describe("Search", () => {
    it("shows search bar when showSearch is true", () => {
      useUIStore.setState((s) => ({ ...s, showSearch: true }));
      renderScreen();
      expect(screen.getByPlaceholderText("Search chats…")).toBeTruthy();
    });

    it("filters group chats by searchQuery", () => {
      const g1 = {
        ...makeChat({ id: "g1", type: "group" as const }),
        name: "Team Alpha",
        description: "",
        avatarUrl: undefined,
        adminIds: [],
      };
      const g2 = {
        ...makeChat({ id: "g2", type: "group" as const }),
        name: "Beta Squad",
        description: "",
        avatarUrl: undefined,
        adminIds: [],
      };
      seedChats([g1 as any, g2 as any]);
      useUIStore.setState((s) => ({ ...s, showSearch: true, searchQuery: "Alpha" }));
      renderScreen();
      expect(screen.getByText("Team Alpha")).toBeTruthy();
      expect(screen.queryByText("Beta Squad")).toBeNull();
    });

    it("shows all chats when searchQuery is empty", () => {
      const g1 = {
        ...makeChat({ id: "g1", type: "group" as const }),
        name: "Alpha",
        description: "",
        avatarUrl: undefined,
        adminIds: [],
      };
      const g2 = {
        ...makeChat({ id: "g2", type: "group" as const }),
        name: "Beta",
        description: "",
        avatarUrl: undefined,
        adminIds: [],
      };
      seedChats([g1 as any, g2 as any]);
      useUIStore.setState((s) => ({ ...s, showSearch: true, searchQuery: "" }));
      renderScreen();
      expect(screen.getByText("Alpha")).toBeTruthy();
      expect(screen.getByText("Beta")).toBeTruthy();
    });
  });
});
