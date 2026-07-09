/**
 * Chat Screen
 * Real-time messaging screen using useChatStore, useMessageStore,
 * useAuthStore, and the SyncEngine.
 *
 * Delivery status progression happens exclusively via SyncEngine /
 * WebSocket server — no setTimeout-based fake receipts.
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ChatBubble } from "@/components/ChatBubble";
import { MessageInput } from "@/components/MessageInput";
import { MessageActionSheet } from "@/components/MessageActionSheet";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

import {
  useChatStore,
  useMessageStore,
  useUIStore,
  useAuthStore,
} from "@presentation/stores";
import { MessageEntity } from "@domain/entities/Message";
import type { Message } from "@domain/entities/Message";
import type { GroupChat } from "@domain/entities/Chat";
import { getSyncEngine } from "@core/sync";
import type { ChatNavProp, ChatRouteProp } from "../../../src/navigation/types";

interface Props {
  navigation: ChatNavProp;
  route: ChatRouteProp;
}

export default function ChatScreen({ navigation, route }: Props) {
  const { chatId, participantId, isGroup } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const { currentUser } = useAuthStore();
  const { getChatById, markChatAsRead } = useChatStore();
  const {
    getMessagesByChatId,
    deleteMessage,
    setReplyingTo,
    replyingTo,
  } = useMessageStore();
  const { showToast } = useUIStore();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const messages = getMessagesByChatId(chatId);
  const chat = getChatById(chatId);
  const group = isGroup && chat?.type === "group" ? (chat as GroupChat) : null;

  // Newest-first for inverted FlatList
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  useEffect(() => {
    markChatAsRead(chatId);
  }, [chatId, markChatAsRead]);

  // Set dynamic header
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
              <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
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
              <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
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
      if (!currentUser) return;

      const message = MessageEntity.create({
        chatId,
        senderId: currentUser.id,
        type: "text",
        text,
        replyTo: replyingTo?.id,
      });

      // Queue through SyncEngine — it adds to messageStore and sends via WS
      getSyncEngine().queueMessage(message);

      setReplyingTo(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [chatId, currentUser, replyingTo, setReplyingTo]
  );

  const handleLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActionSheet(true);
  }, []);

  const handleReply = useCallback(() => {
    if (selectedMessage) setReplyingTo(selectedMessage);
    setShowActionSheet(false);
  }, [selectedMessage, setReplyingTo]);

  const handleCopy = useCallback(() => {
    if (selectedMessage?.text) {
      Clipboard.setString(selectedMessage.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: "success", message: "Copied to clipboard", duration: 1500 });
    }
    setShowActionSheet(false);
  }, [selectedMessage, showToast]);

  const handleDelete = useCallback(() => {
    if (selectedMessage) {
      deleteMessage(selectedMessage.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: "success", message: "Message deleted", duration: 1500 });
    }
    setShowActionSheet(false);
  }, [selectedMessage, deleteMessage, showToast]);

  const getReplyToMessage = useCallback(
    (replyToId?: string) => {
      if (!replyToId) return undefined;
      return messages.find((m) => m.id === replyToId);
    },
    [messages]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isOwn = item.senderId === currentUser?.id;
      return (
        <ChatBubble
          message={item}
          isOwn={isOwn}
          onLongPress={() => handleLongPress(item)}
          replyToMessage={getReplyToMessage(item.replyTo)}
        />
      );
    },
    [handleLongPress, getReplyToMessage, currentUser?.id]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={reversedMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted={reversedMessages.length > 0}
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
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View style={{ paddingBottom: insets.bottom }}>
        <MessageInput
          onSend={handleSend}
          replyingTo={
            replyingTo
              ? { text: replyingTo.text ?? "Media", onCancelReply: () => setReplyingTo(null) }
              : undefined
          }
        />
      </View>

      <MessageActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
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
