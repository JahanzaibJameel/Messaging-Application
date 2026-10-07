/**
 * ChatListScreen Component Tests
 * Tests the real ChatListScreen using useChatStore and useUIStore.
 */

import "../../../test-utils/i18nMock";

import React from "react";
import { act, render, fireEvent, screen } from "@testing-library/react-native";
import { FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import ChatListScreen from "../ChatListScreen";
import { useChatStore } from "../../stores/chatStore";
import { useAuthStore, useUIStore } from "../../stores";
import type { Chat } from "@/domain/entities/Chat";

jest.mock("react-native-mmkv", () => {
  class MMKV {
    constructor(options: any) {
      return {
        getString: jest.fn(() => null),
        set: jest.fn(),
        delete: jest.fn(),
        clearAll: jest.fn(),
      };
    }
  }
  return { MMKV };
});

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

jest.mock("../../../assets/images/empty-chats.png", () => "empty-chats.png");

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

type GroupOverrides = Partial<Chat> & { name: string };

function groupChat({ id, name, ...rest }: GroupOverrides): Chat {
  return {
    ...makeChat({ id, type: "group", ...rest }),
    name,
    description: "",
    avatarUrl: undefined,
    adminIds: [],
  } as Chat;
}

function renderScreen() {
  return render(<ChatListScreen navigation={mockNavigation as never} />);
}

/** Icon glyphs render as font characters, so names are read from the elements. */
function iconNodes(): ReturnType<typeof screen.UNSAFE_queryAllByType> {
  return screen.UNSAFE_queryAllByType(Feather);
}

function iconNames(): string[] {
  return iconNodes().map((node) => (node.props as { name?: string }).name ?? "");
}

function iconNamed(name: string): ReturnType<typeof iconNodes>[number] {
  const match = iconNodes().find((node) => (node.props as { name?: string }).name === name);
  if (!match) {
    throw new Error(`No Feather icon named "${name}". Rendered: ${iconNames().join(", ")}`);
  }
  return match;
}

describe("ChatListScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      currentUser: { id: "currentUser" } as any,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      pendingPhone: undefined,
    });
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
      seedChats([g1 as Chat, g2 as Chat]);
      useUIStore.setState((s) => ({ ...s, showSearch: true, searchQuery: "" }));
      renderScreen();
      expect(screen.getByText("Alpha")).toBeTruthy();
      expect(screen.getByText("Beta")).toBeTruthy();
    });

    it("clears the query from the clear button", () => {
      seedChats([makeChat({ id: "c1" })]);
      useUIStore.setState((s) => ({ ...s, showSearch: true, searchQuery: "anything" }));
      renderScreen();

      const input = screen.getByPlaceholderText("Search chats…");
      expect(input.props.value).toBe("anything");

      fireEvent.press(iconNamed("x"));

      expect(useUIStore.getState().searchQuery).toBe("");
    });

    it("hides the clear button while the query is empty", () => {
      seedChats([makeChat({ id: "c1" })]);
      useUIStore.setState((s) => ({ ...s, showSearch: true, searchQuery: "" }));
      renderScreen();

      expect(iconNames()).toContain("search");
      expect(iconNames()).not.toContain("x");
    });

    it("filters private chats by searchQuery", () => {
      seedChats([makeChat({ id: "c1" })]);
      useUIStore.setState((s) => ({ ...s, showSearch: true, searchQuery: "Private" }));
      renderScreen();
      expect(screen.getByText("Private Chat")).toBeTruthy();
    });

    it("hides private chats when searchQuery does not match", () => {
      seedChats([makeChat({ id: "c1" })]);
      useUIStore.setState((s) => ({ ...s, showSearch: true, searchQuery: "no-such-chat" }));
      renderScreen();
      expect(screen.queryByText("Private Chat")).toBeNull();
    });

    it("does not render the search bar when showSearch is false", () => {
      seedChats([makeChat({ id: "c1" })]);
      renderScreen();

      expect(screen.queryByPlaceholderText("Search chats…")).toBeNull();
    });

    it("types into the search field and updates the store", () => {
      seedChats([makeChat({ id: "c1" })]);
      useUIStore.setState((s) => ({ ...s, showSearch: true }));
      renderScreen();

      fireEvent.changeText(screen.getByPlaceholderText("Search chats…"), "weekend");

      expect(useUIStore.getState().searchQuery).toBe("weekend");
    });
  });

  describe("Loading state", () => {
    it("renders the skeleton instead of the list while chats are loading", () => {
      seedChats([makeChat({ id: "c1" })]);
      useChatStore.setState({ isLoading: true });

      renderScreen();

      expect(screen.queryByText("Private Chat")).toBeNull();
      expect(screen.queryByText("No chats yet")).toBeNull();
    });

    it("returns to the list once loading finishes", () => {
      seedChats([makeChat({ id: "c1" })]);
      useChatStore.setState({ isLoading: true });
      const view = renderScreen();
      expect(screen.queryByText("Private Chat")).toBeNull();

      useChatStore.setState({ isLoading: false });
      view.rerender(<ChatListScreen navigation={mockNavigation as never} />);

      expect(screen.getByText("Private Chat")).toBeTruthy();
    });
  });

  describe("Last message preview", () => {
    it("labels an attachment-only message as Media", () => {
      const chat = makeChat({
        id: "c1",
        lastMessage: {
          id: "m1",
          chatId: "c1",
          senderId: "user-a",
          type: "image",
          timestamp: new Date("2024-01-01T10:00:00Z"),
          status: "delivered",
          reactions: [],
          attachment: { uri: "https://cdn/photo.jpg", type: "image", fileSize: 1024 },
          edited: false,
        },
      });
      seedChats([chat]);
      renderScreen();

      expect(screen.getByText("Media")).toBeTruthy();
    });

    it("falls back to the translated empty label when there is no message", () => {
      seedChats([makeChat({ id: "c1", lastMessage: undefined })]);
      renderScreen();

      expect(screen.getByText("No conversations yet")).toBeTruthy();
    });
  });

  describe("Row decoration", () => {
    it("marks pinned chats with a bookmark", () => {
      seedChats([makeChat({ id: "c1", isPinned: true })]);
      renderScreen();

      expect(iconNames()).toContain("bookmark");
    });

    it("marks muted chats with a muted-speaker icon", () => {
      seedChats([makeChat({ id: "c1", isMuted: true })]);
      renderScreen();

      expect(iconNames()).toContain("volume-x");
    });

    it("omits both icons for an ordinary chat", () => {
      seedChats([makeChat({ id: "c1" })]);
      renderScreen();

      expect(iconNames()).not.toContain("bookmark");
      expect(iconNames()).not.toContain("volume-x");
    });

    it("exposes the chat name as the row's accessibility label", () => {
      seedChats([makeChat({ id: "c1" })]);
      renderScreen();

      expect(screen.getByLabelText("Private Chat")).toBeTruthy();
    });

    it("uses the group name as the accessibility label for groups", () => {
      seedChats([groupChat({ id: "g1", name: "Team Alpha" })]);
      renderScreen();

      expect(screen.getByLabelText("Team Alpha")).toBeTruthy();
    });
  });

  describe("Timestamp formatting", () => {
    const NOW = new Date("2024-06-15T12:00:00.000Z");

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(NOW);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const withTimestamp = (timestamp: Date) =>
      makeChat({
        id: "c1",
        lastMessage: {
          id: "m1",
          chatId: "c1",
          senderId: "user-a",
          type: "text",
          text: "hi",
          timestamp,
          status: "delivered",
          reactions: [],
          edited: false,
        },
      });

    it("shows a clock time for messages from the last day", () => {
      seedChats([withTimestamp(new Date(NOW.getTime() - 2 * 60 * 60 * 1000))]);
      renderScreen();

      const expected = new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      expect(screen.getByText(expected)).toBeTruthy();
    });

    it("shows a weekday for messages within the last week", () => {
      seedChats([withTimestamp(new Date(NOW.getTime() - 3 * 86_400_000))]);
      renderScreen();

      const expected = new Date(NOW.getTime() - 3 * 86_400_000).toLocaleDateString([], {
        weekday: "short",
      });
      expect(screen.getByText(expected)).toBeTruthy();
    });

    it("shows a month and day for older messages", () => {
      const old = new Date("2024-01-05T09:00:00.000Z");
      seedChats([withTimestamp(old)]);
      renderScreen();

      const expected = old.toLocaleDateString([], { month: "short", day: "numeric" });
      expect(screen.getByText(expected)).toBeTruthy();
    });

    it("renders no timestamp at all when the chat has no message", () => {
      seedChats([makeChat({ id: "c1", lastMessage: undefined })]);
      renderScreen();

      // formatTime(undefined) returns "" and the whole block is skipped.
      expect(screen.queryByText("")).toBeNull();
      expect(screen.getByText("No conversations yet")).toBeTruthy();
    });
  });

  describe("Navigation edge cases", () => {
    it("passes an empty participantId when the chat has no participants", () => {
      seedChats([makeChat({ id: "c1", participantIds: [] })]);
      renderScreen();

      fireEvent.press(screen.getByText("Private Chat"));

      expect(mockNavigate).toHaveBeenCalledWith("Chat", { chatId: "c1", participantId: "" });
    });

    it("falls back to the first participant when every id is the placeholder", () => {
      seedChats([makeChat({ id: "c1", participantIds: ["currentUser"] })]);
      renderScreen();

      fireEvent.press(screen.getByText("Private Chat"));

      expect(mockNavigate).toHaveBeenCalledWith("Chat", {
        chatId: "c1",
        participantId: "currentUser",
      });
    });

    it("REGRESSION: excludes the signed-in user from participantId", () => {
      useAuthStore.setState({ currentUser: { id: "user-me" } as any });
      seedChats([makeChat({ id: "c1", participantIds: ["user-me", "user-b"] })]);
      renderScreen();

      fireEvent.press(screen.getByText("Private Chat"));

      expect(mockNavigate).toHaveBeenCalledWith("Chat", {
        chatId: "c1",
        participantId: "user-b",
      });
    });
  });
});
