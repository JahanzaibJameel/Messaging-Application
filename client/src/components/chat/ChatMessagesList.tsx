/**
 * High-performance chat messages list using FlashList
 * Renders 60fps with optimized message bubbles
 * @module components/chat/ChatMessagesList
 */

import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import type { ListRenderItem } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";

import { ModernChatBubble } from "./ModernChatBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/theme/tokens";
import type { Message } from "@/types";

interface ChatMessagesListProps {
  messages: Message[];
  isTyping?: boolean;
  onMessageLongPress?: (message: Message) => void;
  replyToMessage?: Message;
  contentContainerStyle?: ViewStyle;
  estimatedItemSize?: number;
}

export const ChatMessagesList = React.memo(function ChatMessagesList({
  messages,
  isTyping = false,
  onMessageLongPress,
  replyToMessage,
  contentContainerStyle,
  estimatedItemSize = 80,
}: ChatMessagesListProps) {
  const { theme } = useTheme();

  // Reverse for inverted list (newest at bottom)
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const renderItem = useCallback<ListRenderItem<Message>>(
    ({ item, index }) => (
      <View
        key={item.id}
        style={[
          styles.messageItem,
          index === reversedMessages.length - 1 ? styles.lastMessage : null,
        ]}
      >
        <ModernChatBubble
          message={item}
          isOwn={item.senderId === "currentUser"}
          onLongPress={() => onMessageLongPress?.(item)}
          replyToMessage={replyToMessage}
        />
      </View>
    ),
    [reversedMessages.length, replyToMessage, onMessageLongPress]
  );

  const renderTypingIndicator = useCallback(() => {
    if (!isTyping) return null;
    return (
      <View style={styles.typingContainer}>
        <TypingIndicator />
      </View>
    );
  }, [isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundRoot }]}>
        <EmptyState title="No messages" message="Start a conversation by sending a message" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlashList
        data={reversedMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={estimatedItemSize}
        inverted
        scrollEventThrottle={16}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        contentContainerStyle={contentContainerStyle}
        ListFooterComponent={renderTypingIndicator}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageItem: {
    paddingHorizontal: spacing.sm,
  },
  lastMessage: {
    marginTop: spacing.md,
  },
  typingContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
