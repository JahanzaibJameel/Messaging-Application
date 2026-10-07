import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useChatService } from "@/services/websocket";
import { OptimizedMessageList } from "@/presentation/components/OptimizedMessageList";
import { MessageInput } from "@/components/MessageInput";
import { MessageActionSheet } from "@/components/MessageActionSheet";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

import { useChatStore, useMessageStore, useUIStore, useAuthStore } from "@/presentation/stores";
import type { Message } from "@/domain/entities/Message";
import type { GroupChat } from "@/domain/entities/Chat";
import type { ChatNavProp, ChatRouteProp } from "@/navigation/types";

interface Props {
  navigation: ChatNavProp;
  route: ChatRouteProp;
}

export default function ChatScreen({ navigation, route }: Props) {
  const { chatId, isGroup } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const { currentUser } = useAuthStore();
  const { getChatById, markChatAsRead } = useChatStore();
  const { getMessagesByChatId, deleteMessage, setReplyingTo, replyingTo } = useMessageStore();
  const { showToast } = useUIStore();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const { sendMessage } = useChatService(chatId);

  const messages = getMessagesByChatId(chatId);
  const chat = getChatById(chatId);
  const group = isGroup && chat?.type === "group" ? (chat as GroupChat) : null;

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const replyToMap = useMemo(() => {
    const map: Record<string, Message> = {};
    for (const m of messages) {
      map[m.id] = m;
    }
    return map;
  }, [messages]);

  useEffect(() => {
    markChatAsRead(chatId);
  }, [chatId, markChatAsRead]);

  useEffect(() => {
    if (isGroup && group) {
      navigation.setOptions({
        headerTitle: () => (
          <Pressable
            onPress={() => navigation.navigate("GroupInfo", { groupId: chatId })}
            style={styles.headerRow}
          >
            <Avatar size="small" />
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle} numberOfLines={1}>
                {group.name}
              </ThemedText>
              <ThemedText
                style={[styles.headerSubtitle, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {group.participantIds.length} participants
              </ThemedText>
            </View>
          </Pressable>
        ),
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate("GroupInfo", { groupId: chatId })}>
            <Feather name="more-vertical" size={22} color={theme.text} />
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerRow}>
            <Avatar size="small" />
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle} numberOfLines={1}>
                Chat
              </ThemedText>
              <ThemedText
                style={[styles.headerSubtitle, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                online
              </ThemedText>
            </View>
          </View>
        ),
      });
    }
  }, [navigation, group, isGroup, theme, chatId]);

  const handleSend = useCallback(
    (text: string) => {
      if (!currentUser) {
        showToast({ type: "error", message: "Please sign in to send messages" });
        return;
      }

      sendMessage(text, replyingTo?.id);

      // Clear the reply context. MessageInput clears its own text after sending
      // but never calls onCancelReply, so without this every later message would
      // be threaded onto the same parent.
      setReplyingTo(null);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [currentUser, replyingTo, sendMessage, setReplyingTo, showToast]
  );

  const handleLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActionSheet(true);
  }, []);

  // Every path out of the sheet clears the selection, otherwise a stale message
  // would be reused by the next action.
  const closeActionSheet = useCallback(() => {
    setShowActionSheet(false);
    setSelectedMessage(null);
  }, []);

  const handleReply = useCallback(() => {
    if (selectedMessage) setReplyingTo(selectedMessage);
    closeActionSheet();
  }, [selectedMessage, setReplyingTo, closeActionSheet]);

  const handleCopy = useCallback(() => {
    if (selectedMessage?.text) {
      Clipboard.setString(selectedMessage.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: "success", message: "Copied to clipboard", duration: 1500 });
    }
    closeActionSheet();
  }, [selectedMessage, showToast, closeActionSheet]);

  const handleDelete = useCallback(() => {
    if (selectedMessage) {
      deleteMessage(selectedMessage.id);
    }
    closeActionSheet();
  }, [selectedMessage, deleteMessage, closeActionSheet]);

  // `inverted` below is deliberately tied to list length instead of being constant.
  // While the list is empty it stays false so ListEmptyComponent renders
  // right-way-up; once messages exist the list flips to inverted, and the empty
  // wrapper (styles.emptyContainer) counter-mirrors with scaleY:-1 so the two
  // states share one visual orientation.
  //
  // Known trade-off, left as-is on purpose: flipping `inverted` re-lays-out the
  // list and loses scroll position at the moment the first message arrives, and
  // the mirroring only works because the empty state is un-mirrored by hand. Do
  // not "simplify" by making `inverted` constant, and do not drop the scaleY:-1
  // hack without first fixing the toggle.
  return (
    <KeyboardAvoidingView
      testID="chat-screen"
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <OptimizedMessageList
        messages={reversedMessages}
        currentUserId={currentUser?.id}
        replyToMap={replyToMap}
        onLongPress={handleLongPress}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.md },
          reversedMessages.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              image={require("../../../../assets/images/empty-chats.png")}
              title="No messages yet"
              message="Start the conversation by sending a message"
            />
          </View>
        }
      />

      <View style={{ paddingBottom: insets.bottom }}>
        <MessageInput
          onSend={handleSend}
          disabled={!currentUser}
          replyingTo={
            replyingTo
              ? { text: replyingTo.text ?? "Media", onCancelReply: () => setReplyingTo(null) }
              : undefined
          }
        />
      </View>

      <MessageActionSheet
        visible={showActionSheet}
        onClose={closeActionSheet}
        onReply={handleReply}
        onCopy={handleCopy}
        onDelete={handleDelete}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerSubtitle: { fontSize: 12 },
  listContent: { flexGrow: 1, paddingBottom: Spacing.md },
  emptyListContent: { justifyContent: "center" },
  emptyContainer: { flex: 1, transform: [{ scaleY: -1 }] },
});
