import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { Message } from "@/domain/entities/Message";
import type { Chat, GroupChat } from "@/domain/entities/Chat";
import ChatScreen from "../ChatScreen";

/* ------------------------------------------------------------------ *
 * Captured props from the faked child components.
 * Names must start with "mock" — jest hoists jest.mock above imports.
 * ------------------------------------------------------------------ */
interface CapturedBubble {
  id: string;
  text: string | undefined;
  isOwn: boolean;
  replyToId?: string;
  replyToMessageId?: string;
}
const mockBubbles: CapturedBubble[] = [];
const mockInputProps: { disabled?: boolean; replyingTo?: { text: string } }[] = [];
const mockSheetProps: {
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onDelete: () => void;
}[] = [];

const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();
const mockSendMessage = jest.fn();
const mockDeleteMessage = jest.fn();
const mockSetReplyingTo = jest.fn();
const mockMarkChatAsRead = jest.fn();
const mockGetChatById = jest.fn();
const mockGetMessagesByChatId = jest.fn();
const mockShowToast = jest.fn();
const mockClipboardSetString = jest.fn();
const mockHapticImpact = jest.fn();
const mockHapticNotification = jest.fn();

type MockUser = { id: string; name: string; phone: string; isOnline: boolean } | null;

const mockAuthState: { currentUser: MockUser } = {
  currentUser: { id: "user_me", name: "Me", phone: "+111", isOnline: true },
};
const mockMessageState = {
  getMessagesByChatId: mockGetMessagesByChatId,
  deleteMessage: mockDeleteMessage,
  setReplyingTo: mockSetReplyingTo,
  replyingTo: null as Message | null,
};
const mockChatState = { getChatById: mockGetChatById, markChatAsRead: mockMarkChatAsRead };
const mockUIState = { showToast: mockShowToast };

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

jest.mock("@/presentation/stores", () => ({
  useAuthStore: Object.assign(() => mockAuthState, { getState: () => mockAuthState }),
  useChatStore: Object.assign(() => mockChatState, { getState: () => mockChatState }),
  useMessageStore: Object.assign(() => mockMessageState, { getState: () => mockMessageState }),
  useUIStore: Object.assign(() => mockUIState, { getState: () => mockUIState }),
}));

jest.mock("@/services/websocket", () => ({
  useChatService: () => ({ sendMessage: mockSendMessage }),
}));

jest.mock("expo-haptics", () => ({
  // Lazy delegation: the factory body runs while hoisted imports are evaluated,
  // which is before these consts are initialised. Capturing them directly here
  // would freeze `undefined` into the module.
  impactAsync: (...args: unknown[]) => mockHapticImpact(...args),
  notificationAsync: (...args: unknown[]) => mockHapticNotification(...args),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("@react-native-clipboard/clipboard", () => {
  const api = {
    setString: (...args: unknown[]) => mockClipboardSetString(...args),
    getString: jest.fn(),
  };
  return { __esModule: true, default: api, ...api };
});

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return { Feather: (props: { name: string }) => <Text>{props.name}</Text> };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@react-navigation/elements", () => ({ useHeaderHeight: () => 60 }));

jest.mock("react-native-keyboard-controller", () => {
  const { View } = require("react-native");
  return {
    // Props are forwarded so ChatScreen's own testID reaches the rendered tree.
    KeyboardAvoidingView: ({ children, ...props }: Record<string, unknown>) => (
      <View {...props}>{children}</View>
    ),
  };
});

jest.mock("@shopify/flash-list", () => {
  const { FlatList } = require("react-native");
  return { FlashList: FlatList };
});

jest.mock("@/components/ThemedText", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text> };
});

jest.mock("@/components/Avatar", () => {
  const { View } = require("react-native");
  return { Avatar: () => <View testID="avatar" /> };
});

jest.mock("@/components/EmptyState", () => {
  const { Text, View } = require("react-native");
  return {
    EmptyState: ({ title, message }: { title: string; message: string }) => (
      <View testID="empty-state">
        <Text testID="empty-state-title">{title}</Text>
        <Text testID="empty-state-message">{message}</Text>
      </View>
    ),
  };
});

jest.mock("@/components/ChatBubble", () => {
  const { Pressable, Text } = require("react-native");
  return {
    ChatBubble: ({
      message,
      isOwn,
      onLongPress,
      replyToMessage,
    }: {
      message: { id: string; text?: string; senderId: string };
      isOwn: boolean;
      onLongPress: () => void;
      replyToMessage?: { id: string };
    }) => {
      mockBubbles.push({
        id: message.id,
        text: message.text,
        isOwn,
        replyToId: (message as { replyTo?: string }).replyTo,
        replyToMessageId: replyToMessage?.id,
      });
      return (
        <Pressable testID={`bubble-${message.id}`} onPress={onLongPress}>
          <Text testID={`bubble-own-${message.id}`}>{String(isOwn)}</Text>
        </Pressable>
      );
    },
  };
});

jest.mock("@/components/MessageInput", () => {
  const { Pressable, Text, TextInput, View } = require("react-native");
  return {
    MessageInput: (props: {
      onSend: (text: string) => void;
      replyingTo?: { text: string; onCancelReply: () => void };
      disabled?: boolean;
    }) => {
      mockInputProps.push(props);
      return (
        <View>
          {props.replyingTo ? (
            <View testID="reply-bar">
              <Text testID="reply-bar-text">{props.replyingTo.text}</Text>
              <Pressable testID="cancel-reply" onPress={props.replyingTo.onCancelReply} />
            </View>
          ) : null}
          <TextInput testID="message-input" onChangeText={jest.fn()} />
          {/*
            The send control stays mounted and still invokes onSend even when
            disabled, mirroring the real component: the guard under test lives in
            ChatScreen.handleSend, not in this fake.
          */}
          <Pressable
            testID="send-button"
            accessibilityState={{ disabled: Boolean(props.disabled) }}
            onPress={() => props.onSend("hello there")}
          />
        </View>
      );
    },
  };
});

jest.mock("@/components/MessageActionSheet", () => {
  const { Pressable, View } = require("react-native");
  return {
    MessageActionSheet: (props: {
      visible: boolean;
      onClose: () => void;
      onReply: () => void;
      onCopy: () => void;
      onDelete: () => void;
    }) => {
      mockSheetProps.push(props);
      if (!props.visible) {
        return null;
      }
      return (
        <View testID="action-sheet">
          <Pressable testID="action-reply" onPress={props.onReply} />
          <Pressable testID="action-copy" onPress={props.onCopy} />
          <Pressable testID="action-delete" onPress={props.onDelete} />
          <Pressable testID="action-close" onPress={props.onClose} />
        </View>
      );
    },
  };
});

/* ------------------------------------------------------------------ */

const makeMessage = (overrides: Partial<Message> = {}): Message =>
  ({
    id: "msg-1",
    chatId: "chat-1",
    senderId: "user_other",
    type: "text",
    text: "Hello",
    timestamp: new Date("2024-01-01T10:00:00.000Z"),
    status: "sent",
    ...overrides,
  }) as Message;

const makeChat = (overrides: Partial<Chat> = {}): Chat =>
  ({
    id: "chat-1",
    type: "private",
    participantIds: ["user_me", "user_other"],
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  }) as Chat;

const makeGroup = (overrides: Partial<GroupChat> = {}): GroupChat =>
  ({
    ...makeChat(),
    type: "group",
    name: "Weekend Trip",
    createdBy: "user_me",
    adminIds: ["user_me"],
    ...overrides,
  }) as GroupChat;

const renderScreen = ({
  chatId = "chat-1",
  isGroup = false,
}: { chatId?: string; isGroup?: boolean } = {}) => {
  const navigation = { setOptions: mockSetOptions, navigate: mockNavigate };
  const route = { params: { chatId, isGroup }, key: "k", name: "Chat" };
  return render(<ChatScreen navigation={navigation as never} route={route as never} />);
};

describe("ChatScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBubbles.length = 0;
    mockInputProps.length = 0;
    mockSheetProps.length = 0;
    mockAuthState.currentUser = {
      id: "user_me",
      name: "Me",
      phone: "+111",
      isOnline: true,
    };
    mockMessageState.replyingTo = null;
    mockGetMessagesByChatId.mockReturnValue([]);
    mockGetChatById.mockReturnValue(null);
  });

  describe("rendering", () => {
    it("renders the chat surface with an input and a send button", () => {
      renderScreen();

      expect(screen.getByTestId("chat-screen")).toBeTruthy();
      expect(screen.getByTestId("message-input")).toBeTruthy();
      expect(screen.getByTestId("send-button")).toBeTruthy();
      expect(screen.queryByTestId("action-sheet")).toBeNull();
    });

    it("marks the chat as read on mount with the route's chat id", () => {
      renderScreen({ chatId: "chat-42" });

      expect(mockMarkChatAsRead).toHaveBeenCalledWith("chat-42");
      expect(mockGetMessagesByChatId).toHaveBeenCalledWith("chat-42");
    });

    it("renders the empty state with copy when there are no messages", () => {
      renderScreen();

      expect(screen.getByTestId("empty-state")).toBeTruthy();
      expect(screen.getByTestId("empty-state-title").props.children).toBe("No messages yet");
      expect(screen.getByTestId("empty-state-message").props.children).toBe(
        "Start the conversation by sending a message"
      );
      expect(screen.queryByTestId("bubble-msg-1")).toBeNull();
    });

    it("renders one bubble per message and hides the empty state", () => {
      mockGetMessagesByChatId.mockReturnValue([
        makeMessage({ id: "msg-a" }),
        makeMessage({ id: "msg-b" }),
      ]);

      renderScreen();

      expect(screen.getByTestId("bubble-msg-a")).toBeTruthy();
      expect(screen.getByTestId("bubble-msg-b")).toBeTruthy();
      expect(screen.queryByTestId("empty-state")).toBeNull();
    });

    it("renders messages newest first for the inverted list", () => {
      mockGetMessagesByChatId.mockReturnValue([
        makeMessage({ id: "msg-old", timestamp: new Date("2024-01-01T09:00:00.000Z") }),
        makeMessage({ id: "msg-new", timestamp: new Date("2024-01-01T11:00:00.000Z") }),
      ]);

      renderScreen();

      expect(mockBubbles.map((b) => b.id)).toEqual(["msg-new", "msg-old"]);
    });

    it("flags the current user's own messages and the other party's", () => {
      mockGetMessagesByChatId.mockReturnValue([
        makeMessage({ id: "msg-mine", senderId: "user_me" }),
        makeMessage({ id: "msg-theirs", senderId: "user_other" }),
      ]);

      renderScreen();

      expect(screen.getByTestId("bubble-own-msg-mine").props.children).toBe("true");
      expect(screen.getByTestId("bubble-own-msg-theirs").props.children).toBe("false");
    });

    it("resolves the replied-to message for each bubble", () => {
      mockGetMessagesByChatId.mockReturnValue([
        makeMessage({ id: "msg-parent", text: "original" }),
        makeMessage({ id: "msg-child", replyTo: "msg-parent" }),
        makeMessage({ id: "msg-orphan", replyTo: "msg-missing" }),
        makeMessage({ id: "msg-plain" }),
      ]);

      renderScreen();

      const byId = Object.fromEntries(mockBubbles.map((b) => [b.id, b]));
      expect(byId["msg-child"].replyToMessageId).toBe("msg-parent");
      expect(byId["msg-orphan"].replyToMessageId).toBeUndefined();
      expect(byId["msg-plain"].replyToMessageId).toBeUndefined();
    });
  });

  describe("sending", () => {
    it("sends the typed text with no reply target", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("send-button"));

      expect(mockSendMessage).toHaveBeenCalledWith("hello there", undefined);
      expect(mockHapticImpact).toHaveBeenCalledWith("light");
    });

    it("disables the send control when nobody is signed in", () => {
      mockAuthState.currentUser = null;
      renderScreen();

      expect(mockInputProps.at(-1)?.disabled).toBe(true);
      expect(screen.getByTestId("send-button").props.accessibilityState).toEqual({
        disabled: true,
      });
    });

    it("keeps the send control enabled for a signed-in user", () => {
      renderScreen();

      expect(mockInputProps.at(-1)?.disabled).toBe(false);
    });

    it("REGRESSION: pressing send while signed out never dispatches and reports it", () => {
      mockAuthState.currentUser = null;
      renderScreen();

      fireEvent.press(screen.getByTestId("send-button"));

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(mockHapticImpact).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "error",
        message: "Please sign in to send messages",
      });
    });
  });

  describe("action sheet", () => {
    beforeEach(() => {
      mockGetMessagesByChatId.mockReturnValue([makeMessage({ id: "msg-1", text: "Copy me" })]);
    });

    it("opens on long press and closes without side effects", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("bubble-msg-1"));
      expect(screen.getByTestId("action-sheet")).toBeTruthy();

      fireEvent.press(screen.getByTestId("action-close"));
      expect(screen.queryByTestId("action-sheet")).toBeNull();
      expect(mockDeleteMessage).not.toHaveBeenCalled();
      expect(mockClipboardSetString).not.toHaveBeenCalled();
    });

    it("copies the message text, confirms with haptics and a toast", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("bubble-msg-1"));
      fireEvent.press(screen.getByTestId("action-copy"));

      expect(mockClipboardSetString).toHaveBeenCalledWith("Copy me");
      expect(mockHapticNotification).toHaveBeenCalledWith("success");
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "success",
        message: "Copied to clipboard",
        duration: 1500,
      });
      expect(screen.queryByTestId("action-sheet")).toBeNull();
    });

    it("does not copy or confirm when the message has no text", () => {
      mockGetMessagesByChatId.mockReturnValue([
        makeMessage({ id: "msg-img", type: "image", text: undefined }),
      ]);
      renderScreen();

      fireEvent.press(screen.getByTestId("bubble-msg-img"));
      fireEvent.press(screen.getByTestId("action-copy"));

      expect(mockClipboardSetString).not.toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalled();
      expect(screen.queryByTestId("action-sheet")).toBeNull();
    });

    it("deletes the message and closes the sheet", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("bubble-msg-1"));
      fireEvent.press(screen.getByTestId("action-delete"));

      expect(mockDeleteMessage).toHaveBeenCalledWith("msg-1");
      expect(screen.queryByTestId("action-sheet")).toBeNull();
      expect(mockSetReplyingTo).not.toHaveBeenCalled();
    });
  });

  describe("reply flow", () => {
    beforeEach(() => {
      mockGetMessagesByChatId.mockReturnValue([makeMessage({ id: "msg-1", text: "the original" })]);
    });

    it("stores the selected message as the reply target and shows the preview", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("bubble-msg-1"));
      fireEvent.press(screen.getByTestId("action-reply"));

      expect(mockSetReplyingTo).toHaveBeenCalledWith(
        expect.objectContaining({ id: "msg-1", text: "the original" })
      );
      expect(screen.queryByTestId("action-sheet")).toBeNull();
    });

    it("sends the next message with the reply target's id", () => {
      mockMessageState.replyingTo = makeMessage({ id: "msg-1", text: "the original" });
      renderScreen();

      fireEvent.press(screen.getByTestId("send-button"));

      expect(mockSendMessage).toHaveBeenCalledWith("hello there", "msg-1");
      expect(screen.getByTestId("reply-bar-text").props.children).toBe("the original");
    });

    it("REGRESSION: clears the reply target after sending, so the next message is plain", () => {
      mockMessageState.replyingTo = makeMessage({ id: "msg-1", text: "the original" });
      renderScreen();

      fireEvent.press(screen.getByTestId("send-button"));
      fireEvent.press(screen.getByTestId("send-button"));

      // Before the fix both sends stayed threaded onto msg-1 because
      // MessageInput never calls onCancelReply.
      expect(mockSetReplyingTo).toHaveBeenCalledTimes(2);
      expect(mockSetReplyingTo).toHaveBeenNthCalledWith(1, null);
      expect(mockSetReplyingTo).toHaveBeenNthCalledWith(2, null);
      expect(mockSendMessage).toHaveBeenNthCalledWith(1, "hello there", "msg-1");
      expect(mockSendMessage).toHaveBeenNthCalledWith(2, "hello there", "msg-1");
    });

    it("REGRESSION: a closed sheet leaves no selection behind", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("bubble-msg-1"));
      expect(screen.getByTestId("action-sheet")).toBeTruthy();

      fireEvent.press(screen.getByTestId("action-close"));
      expect(screen.queryByTestId("action-sheet")).toBeNull();

      // A callback that arrives after the sheet was dismissed (modal dismissal
      // races are routine) must not act on the previously long-pressed message.
      act(() => {
        mockSheetProps.at(-1)?.onReply();
      });

      expect(mockSetReplyingTo).not.toHaveBeenCalled();
    });

    it("REGRESSION: a late copy after dismissal does not write to the clipboard", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("bubble-msg-1"));
      fireEvent.press(screen.getByTestId("action-close"));
      act(() => {
        mockSheetProps.at(-1)?.onCopy();
      });

      expect(mockClipboardSetString).not.toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it("shows the reply preview and clears it when cancelled", () => {
      mockMessageState.replyingTo = makeMessage({ id: "msg-1", text: "the original" });
      renderScreen();

      expect(screen.getByTestId("reply-bar-text").props.children).toBe("the original");

      fireEvent.press(screen.getByTestId("cancel-reply"));

      expect(mockSetReplyingTo).toHaveBeenCalledWith(null);
    });

    it("labels a text-less reply target as Media", () => {
      mockMessageState.replyingTo = makeMessage({ id: "msg-img", type: "image", text: undefined });
      renderScreen();

      expect(screen.getByTestId("reply-bar-text").props.children).toBe("Media");
    });

    it("sends without a reply target when the preview was cancelled", () => {
      renderScreen();

      mockMessageState.replyingTo = null;
      fireEvent.press(screen.getByTestId("send-button"));

      expect(mockSendMessage).toHaveBeenCalledWith("hello there", undefined);
    });
  });

  describe("group header", () => {
    const renderHeader = (): React.ReactElement => {
      const call = mockSetOptions.mock.calls[0];
      const options = call[0] as { headerTitle: () => React.ReactElement };
      return options.headerTitle();
    };

    it("renders the group name and participant count", () => {
      mockGetChatById.mockReturnValue(makeGroup({ participantIds: ["a", "b", "c"] }));
      renderScreen({ isGroup: true });

      const header = render(renderHeader());

      expect(header.getByText("Weekend Trip")).toBeTruthy();
      expect(header.getByText("3 participants")).toBeTruthy();
    });

    it("navigates to GroupInfo with the group id from the header title", () => {
      mockGetChatById.mockReturnValue(makeGroup());
      renderScreen({ isGroup: true, chatId: "chat-group" });

      const header = render(renderHeader());
      fireEvent.press(header.getByText("Weekend Trip"));

      expect(mockNavigate).toHaveBeenCalledWith("GroupInfo", { groupId: "chat-group" });
    });

    it("navigates to GroupInfo from the header right button", () => {
      mockGetChatById.mockReturnValue(makeGroup());
      renderScreen({ isGroup: true, chatId: "chat-group" });

      const options = mockSetOptions.mock.calls[0][0] as {
        headerRight: () => React.ReactElement;
      };
      const header = render(options.headerRight());

      fireEvent.press(header.getByText("more-vertical"));

      expect(mockNavigate).toHaveBeenCalledWith("GroupInfo", { groupId: "chat-group" });
    });

    it("sets the avatar in the group header", () => {
      mockGetChatById.mockReturnValue(makeGroup());
      renderScreen({ isGroup: true });

      const header = render(renderHeader());

      expect(header.getByTestId("avatar")).toBeTruthy();
    });
  });

  describe("private chat header", () => {
    const renderHeader = (): React.ReactElement => {
      const options = mockSetOptions.mock.calls[0][0] as {
        headerTitle: () => React.ReactElement;
      };
      return options.headerTitle();
    };

    it("renders a generic Chat / online header when not a group", () => {
      mockGetChatById.mockReturnValue(makeChat());
      renderScreen();

      const header = render(renderHeader());

      expect(header.getByText("Chat")).toBeTruthy();
      expect(header.getByText("online")).toBeTruthy();
    });

    it("falls back to the private header when the group chat is not loaded yet", () => {
      mockGetChatById.mockReturnValue(null);
      renderScreen({ isGroup: true });

      const header = render(renderHeader());

      expect(header.getByText("Chat")).toBeTruthy();
      expect(header.queryByText("Weekend Trip")).toBeNull();
    });

    it("falls back to the private header when isGroup is true but the chat is private", () => {
      mockGetChatById.mockReturnValue(makeChat({ type: "private" }));
      renderScreen({ isGroup: true });

      const header = render(renderHeader());

      expect(header.getByText("Chat")).toBeTruthy();
    });

    it("does not register a headerRight action for private chats", () => {
      renderScreen();

      const options = mockSetOptions.mock.calls[0][0] as Record<string, unknown>;
      expect(options.headerRight).toBeUndefined();
    });
  });

  describe("input wiring", () => {
    it("exposes an editable text input alongside the send affordance", () => {
      renderScreen();

      const input = screen.getByTestId("message-input");
      expect(input).toBeTruthy();
      expect(input.props.onChangeText).toBeDefined();
    });
  });
});
