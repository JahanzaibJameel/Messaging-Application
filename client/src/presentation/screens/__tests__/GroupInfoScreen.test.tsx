import "../../../test-utils/i18nMock";

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, screen } from "@testing-library/react-native";
import GroupInfoScreen from "../GroupInfoScreen";
import { useChatStore } from "../../stores/chatStore";
import { useAuthStore } from "../../stores/authStore";

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
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

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("../../../assets/images/empty-chats.png", () => "empty-chats.png");

jest.mock("@/components/Avatar", () => {
  const { View } = require("react-native");
  return { Avatar: () => <View testID="avatar" /> };
});

jest.mock("@/components/SettingsItem", () => {
  const { Pressable, Text, View } = require("react-native");
  return {
    SettingsItem: (props: {
      icon: string;
      title: string;
      onPress?: () => void;
      destructive?: boolean;
      showArrow?: boolean;
    }) => (
      <Pressable testID={`settings-${props.title}`} onPress={props.onPress}>
        <Text>{props.title}</Text>
      </Pressable>
    ),
  };
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
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

function makeGroupChat(overrides: Record<string, unknown> = {}) {
  return {
    id: "group-1",
    type: "group" as const,
    participantIds: ["currentUser", "user-b", "user-c"],
    adminIds: ["currentUser"],
    name: "Team Alpha",
    description: "A great group",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    lastMessage: undefined,
    ...overrides,
  };
}

function seedChat(chat: Record<string, unknown> & { id: string }) {
  useChatStore.setState((state) => ({
    ...state,
    chats: { ids: [chat.id], entities: { [chat.id]: chat } },
  }));
}

function renderScreen(groupId = "group-1") {
  return render(
    <GroupInfoScreen
      navigation={mockNavigation as never}
      route={{ params: { groupId } } as never}
    />
  );
}

describe("GroupInfoScreen", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      currentUser: { id: "currentUser" } as never,
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
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation((...args: unknown[]) => {
      const buttons = args[2] as { onPress?: () => void }[];
      const confirmBtn = buttons?.find((b) => b.onPress);
      confirmBtn?.onPress?.();
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe("rendering", () => {
    it("renders the group name", () => {
      seedChat(makeGroupChat());
      renderScreen();
      expect(screen.getByText("Team Alpha")).toBeTruthy();
    });

    it("renders the participant count", () => {
      seedChat(makeGroupChat());
      renderScreen();
      expect(screen.getByText("3 Participants")).toBeTruthy();
    });

    it("renders the group description", () => {
      seedChat(makeGroupChat());
      renderScreen();
      expect(screen.getByText("A great group")).toBeTruthy();
    });

    it("renders no description when absent", () => {
      seedChat(makeGroupChat({ description: undefined }));
      renderScreen();
      expect(screen.queryByText("A great group")).toBeNull();
    });

    it("renders participant names", () => {
      seedChat(makeGroupChat());
      renderScreen();
      expect(screen.getByText("user-b")).toBeTruthy();
      expect(screen.getByText("user-c")).toBeTruthy();
    });

    it("labels the current user as 'You'", () => {
      seedChat(makeGroupChat());
      renderScreen();
      expect(screen.getByText("You")).toBeTruthy();
    });

    it("renders admin badge for admins", () => {
      seedChat(makeGroupChat());
      renderScreen();
      expect(screen.getByText("Admin")).toBeTruthy();
    });

    it("does not render admin badge for non-admins", () => {
      seedChat(makeGroupChat({ adminIds: [] }));
      renderScreen();
      expect(screen.queryByText("Admin")).toBeNull();
    });

    it("does not render group content when chat is not a group", () => {
      useChatStore.setState({
        chats: {
          ids: ["chat-1"],
          entities: {
            "chat-1": { id: "chat-1", type: "private" as const, participantIds: ["a", "b"] } as any,
          },
        },
      });
      renderScreen("chat-1");
      expect(screen.queryByText("Team Alpha")).toBeNull();
    });

    it("does not render group content when chat is not found", () => {
      renderScreen("unknown");
      expect(screen.queryByText("Team Alpha")).toBeNull();
    });
  });

  describe("mute toggle", () => {
    it("calls muteChat when chat is not muted", () => {
      seedChat(makeGroupChat({ isMuted: false }));
      renderScreen();
      fireEvent.press(screen.getByTestId("settings-Mute Notifications"));
      expect(useChatStore.getState().chats.entities["group-1"].isMuted).toBe(true);
    });

    it("calls unmuteChat when chat is muted", () => {
      seedChat(makeGroupChat({ isMuted: true }));
      renderScreen();
      fireEvent.press(screen.getByTestId("settings-Unmute Notifications"));
      expect(useChatStore.getState().chats.entities["group-1"].isMuted).toBe(false);
    });
  });

  describe("leave group", () => {
    it("shows an alert with a destructive confirm button", () => {
      seedChat(makeGroupChat());
      renderScreen();

      fireEvent.press(screen.getByTestId("settings-Leave Group"));

      expect(alertSpy).toHaveBeenCalledWith(
        "Leave Group",
        "Are you sure you want to leave this group?",
        expect.any(Array)
      );
    });

    it("calls removeChat and goBack when confirm is pressed", () => {
      seedChat(makeGroupChat());
      renderScreen();

      fireEvent.press(screen.getByTestId("settings-Leave Group"));

      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
