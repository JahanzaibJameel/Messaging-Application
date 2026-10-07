import React from "react";
import { View, Text, Pressable } from "react-native";
import { render, fireEvent, screen } from "@testing-library/react-native";

import { OptimizedMessageList } from "@/presentation/components/OptimizedMessageList";
import type { Message } from "@/domain/entities/Message";

const mockTheme = {
  backgroundRoot: "#fff",
  text: "#000",
  textSecondary: "#666",
  primary: "#007AFF",
  surface: "#f5f5f5",
  divider: "#ddd",
  error: "#FF0000",
  bubbleSender: "#DCF8C6",
  bubbleReceiver: "#FFFFFF",
};

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: mockTheme }),
}));

jest.mock("@/components/ChatBubble", () => {
  const { Pressable, Text } = require("react-native");
  return {
    ChatBubble: ({
      message,
      isOwn,
      onLongPress,
      replyToMessage,
    }: {
      message: { id: string; senderId: string; replyTo?: string };
      isOwn: boolean;
      onLongPress: () => void;
      replyToMessage?: { id: string };
    }) => (
      <Pressable
        testID={`bubble-${message.id}`}
        onPress={onLongPress}
        style={{ backgroundColor: isOwn ? "green" : "gray" }}
      >
        <Text testID={`bubble-own-${message.id}`}>{String(isOwn)}</Text>
        {replyToMessage ? <Text testID={`reply-${message.id}`}>{replyToMessage.id}</Text> : null}
      </Pressable>
    ),
  };
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

jest.mock("react-native-reanimated", () => {
  const RN = jest.requireActual("react-native");
  const createChainable = () => {
    const chain = { delay: () => chain, duration: () => chain };
    return chain;
  };
  return {
    __esModule: true,
    default: {
      useAnimatedStyle: (cb: any) => cb(),
      useSharedValue: (v: any) => ({ value: v }),
      withSpring: (v: any) => v,
      withSequence: (...args: any[]) => args,
      FadeIn: createChainable(),
      View: RN.View,
    },
    useAnimatedStyle: (cb: any) => cb(),
    useSharedValue: (v: any) => ({ value: v }),
    withSpring: (v: any) => v,
    withSequence: (...args: any[]) => args,
    FadeIn: createChainable(),
    View: RN.View,
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("@/components/ThemedText", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text> };
});

jest.mock("@shopify/flash-list", () => {
  const { FlatList } = require("react-native");
  return {
    FlashList: FlatList,
  };
});

const makeMessage = (overrides: Record<string, unknown> = {}) => ({
  id: "msg-1",
  chatId: "chat-1",
  senderId: "user_other",
  type: "text" as const,
  text: "Hello",
  timestamp: new Date("2024-01-01T10:00:00.000Z"),
  status: "sent" as const,
  replyTo: undefined,
  reactions: [],
  edited: false,
  ...overrides,
});

describe("OptimizedMessageList", () => {
  const mockOnLongPress = jest.fn();
  const mockReplyToMap: Record<string, Message> = {
    "msg-parent": makeMessage({ id: "msg-parent", text: "original" }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnLongPress.mockClear();
  });

  describe("rendering", () => {
    it("renders with a list of messages", () => {
      const messages = [makeMessage({ id: "msg-a" }), makeMessage({ id: "msg-b" })];

      render(
        <OptimizedMessageList
          messages={messages}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
        />
      );

      expect(screen.getByTestId("bubble-msg-a")).toBeTruthy();
      expect(screen.getByTestId("bubble-msg-b")).toBeTruthy();
    });

    it("renders empty state when no messages", () => {
      render(
        <OptimizedMessageList
          messages={[]}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
        />
      );

      expect(screen.getByTestId("empty-state")).toBeTruthy();
      expect(screen.getByTestId("empty-state-title").props.children).toBe("No messages yet");
    });

    it("renders custom ListEmptyComponent when provided", () => {
      render(
        <OptimizedMessageList
          messages={[]}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
          ListEmptyComponent={<View testID="custom-empty" />}
        />
      );

      expect(screen.getByTestId("custom-empty")).toBeTruthy();
      expect(screen.queryByTestId("empty-state")).toBeNull();
    });

    it("flags own messages correctly", () => {
      const messages = [
        makeMessage({ id: "msg-mine", senderId: "user_me" }),
        makeMessage({ id: "msg-theirs", senderId: "user_other" }),
      ];

      render(
        <OptimizedMessageList
          messages={messages}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
        />
      );

      expect(screen.getByTestId("bubble-own-msg-mine").props.children).toBe("true");
      expect(screen.getByTestId("bubble-own-msg-theirs").props.children).toBe("false");
    });

    it("passes replyToMessage for messages with replyTo", () => {
      const messages = [makeMessage({ id: "msg-child", replyTo: "msg-parent" })];

      render(
        <OptimizedMessageList
          messages={messages}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
        />
      );

      expect(screen.getByTestId("reply-msg-child").props.children).toBe("msg-parent");
    });

    it("does not pass replyToMessage when replyTo is undefined", () => {
      const messages = [makeMessage({ id: "msg-plain" })];

      render(
        <OptimizedMessageList
          messages={messages}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
        />
      );

      expect(screen.queryByTestId("reply-msg-plain")).toBeNull();
    });
  });

  describe("interactions", () => {
    it("calls onLongPress when a bubble is pressed", () => {
      const messages = [makeMessage({ id: "msg-1" })];

      render(
        <OptimizedMessageList
          messages={messages}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
        />
      );

      fireEvent.press(screen.getByTestId("bubble-msg-1"));
      expect(mockOnLongPress).toHaveBeenCalledWith(messages[0]);
    });

    it("calls onLongPress with correct message for each bubble", () => {
      const msgA = makeMessage({ id: "msg-a" });
      const msgB = makeMessage({ id: "msg-b" });
      const messages = [msgA, msgB];

      render(
        <OptimizedMessageList
          messages={messages}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
        />
      );

      fireEvent.press(screen.getByTestId("bubble-msg-a"));
      expect(mockOnLongPress).toHaveBeenCalledWith(msgA);

      fireEvent.press(screen.getByTestId("bubble-msg-b"));
      expect(mockOnLongPress).toHaveBeenCalledWith(msgB);
    });
  });

  describe("props", () => {
    it("renders with custom contentContainerStyle", () => {
      const messages = [makeMessage()];

      render(
        <OptimizedMessageList
          messages={messages}
          currentUserId="user_me"
          replyToMap={mockReplyToMap}
          onLongPress={mockOnLongPress}
          contentContainerStyle={{ padding: 20 }}
        />
      );

      expect(screen.getByTestId("bubble-msg-1")).toBeTruthy();
    });
  });
});
