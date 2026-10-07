import React, { useCallback, useMemo } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { FlashList } from "@shopify/flash-list";

import { ChatBubble } from "@/components/ChatBubble";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import type { Message } from "@/domain/entities/Message";

interface OptimizedMessageListProps {
  messages: Message[];
  currentUserId?: string;
  replyToMap: Record<string, Message>;
  onLongPress: (message: Message) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ListEmptyComponent?: React.ReactElement | null;
}

function getReplyToMessage(
  replyToId: string | undefined,
  replyToMap: Record<string, Message>
): Message | undefined {
  if (!replyToId) return undefined;
  return replyToMap[replyToId];
}

export const OptimizedMessageList = React.memo(function OptimizedMessageList({
  messages,
  currentUserId,
  replyToMap,
  onLongPress,
  contentContainerStyle,
  ListEmptyComponent,
}: OptimizedMessageListProps) {
  const { theme } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isOwn = item.senderId === currentUserId;
      return (
        <ChatBubble
          message={item}
          isOwn={isOwn}
          onLongPress={() => onLongPress(item)}
          replyToMessage={getReplyToMessage(item.replyTo, replyToMap)}
        />
      );
    },
    [currentUserId, onLongPress, replyToMap]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const emptyComponent = useMemo(() => {
    if (ListEmptyComponent) return ListEmptyComponent;
    return (
      <EmptyState
        image={require("../../../../assets/images/empty-chats.png")}
        title="No messages yet"
        message="Start the conversation by sending a message"
      />
    );
  }, [ListEmptyComponent]);

  return (
    <FlashList
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={[contentContainerStyle, messages.length === 0 && { flexGrow: 1 }]}
      ListEmptyComponent={emptyComponent}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      horizontal={false}
    />
  );
});
