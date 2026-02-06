import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, Clipboard, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

import { ChatBubble } from "@/components/ChatBubble";
import { MessageInput } from "@/components/MessageInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { MessageActionSheet } from "@/components/MessageActionSheet";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { useChatStore } from "@/store/chatStore";
import { Message, GroupChat } from "@/store/types";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface ChatScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Chat">;
  route: RouteProp<RootStackParamList, "Chat">;
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const { chatId, participantId, isGroup } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const {
    getMessagesForChat,
    sendMessage,
    deleteMessage,
    markChatAsRead,
    getUserById,
    getChatById,
    groupChats,
    typingUsers,
    addReaction,
  } = useChatStore();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const messages = getMessagesForChat(chatId);
  const user = getUserById(participantId);
  const chat = getChatById(chatId);
  const group = isGroup ? groupChats.find((g) => g.id === chatId) : null;
  const isTyping = typingUsers[participantId];

  // Reverse messages for inverted FlatList (newest first)
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  React.useEffect(() => {
    markChatAsRead(chatId);
  }, [chatId]);

  React.useLayoutEffect(() => {
    if (isGroup && group) {
      navigation.setOptions({
        headerTitle: () => (
          <Pressable
            onPress={() => navigation.navigate("GroupInfo", { groupId: chatId })}
            style={styles.groupHeader}
          >
            <Avatar size="small" />
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle} numberOfLines={1}>
                {group.name}
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {group.participants?.length || 0} participants
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
    } else if (user) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.privateHeader}>
            <Avatar uri={user.avatar} size="small" showOnline isOnline={user.isOnline} />
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle} numberOfLines={1}>
                {user.name}
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {user.isOnline ? "online" : "offline"}
              </ThemedText>
            </View>
          </View>
        ),
      });
    }
  }, [navigation, user, group, isGroup, theme]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(chatId, text, undefined, replyingTo?.id);
      setReplyingTo(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [chatId, replyingTo]
  );

  const handleLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActionSheet(true);
  }, []);

  const handleReply = useCallback(() => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
    }
  }, [selectedMessage]);

  const handleCopy = useCallback(() => {
    if (selectedMessage?.text) {
      Clipboard.setString(selectedMessage.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [selectedMessage]);

  const handleDelete = useCallback(() => {
    if (selectedMessage) {
      deleteMessage(selectedMessage.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [selectedMessage]);

  const getReplyToMessage = useCallback(
    (replyToId?: string) => {
      if (!replyToId) return undefined;
      return messages.find((m) => m.id === replyToId);
    },
    [messages]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isOwn = item.senderId === "currentUser";
      const sender = isGroup && !isOwn ? getUserById(item.senderId) : null;
      
      return (
        <View>
          {sender && isGroup ? (
            <ThemedText style={[styles.senderName, { color: theme.primary }]}>
              {sender.name}
            </ThemedText>
          ) : null}
          <ChatBubble
            message={item}
            isOwn={isOwn}
            onLongPress={() => handleLongPress(item)}
            replyToMessage={getReplyToMessage(item.replyTo)}
          />
        </View>
      );
    },
    [handleLongPress, getReplyToMessage, isGroup, getUserById, theme]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        image={require("../../assets/images/empty-chats.png")}
        title="No messages yet"
        message="Start the conversation by sending a message"
      />
    </View>
  );

  const renderListHeader = () => {
    if (isTyping) {
      return (
        <Animated.View entering={FadeIn.duration(200)}>
          <TypingIndicator />
        </Animated.View>
      );
    }
    return null;
  };

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
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View style={{ paddingBottom: insets.bottom }}>
        <MessageInput
          onSend={handleSend}
          replyingTo={
            replyingTo
              ? {
                  text: replyingTo.text || "Media",
                  onCancelReply: () => setReplyingTo(null),
                }
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
  container: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  privateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.md,
  },
  emptyListContent: {
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    transform: [{ scaleY: -1 }],
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
});
