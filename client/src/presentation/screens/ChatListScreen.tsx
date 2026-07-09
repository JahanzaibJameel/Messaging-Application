/**
 * Chat List Screen
 * Displays sorted chats from useChatStore. Navigates to Chat screen on press.
 */

import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useChatStore, useUIStore } from "@presentation/stores";
import type { Chat, GroupChat } from "@domain/entities/Chat";
import type { NavigationProp } from "../../../src/navigation/types";

function isGroupChat(chat: Chat | GroupChat): chat is GroupChat {
  return chat.type === "group";
}

function formatTime(date: Date | undefined): string {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (diff < oneDayMs) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 7 * oneDayMs) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface Props {
  navigation: NavigationProp;
}

export default function ChatListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const { getSortedChats, isLoading } = useChatStore();
  const { searchQuery, showSearch, setSearchQuery, setShowSearch } = useUIStore();

  const [refreshing, setRefreshing] = useState(false);

  const allChats = getSortedChats();

  const filteredChats = allChats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    if (isGroupChat(chat)) {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // A real implementation would trigger useChatStore.sync() here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleChatPress = (chat: Chat | GroupChat) => {
    if (isGroupChat(chat)) {
      navigation.navigate("Chat", { chatId: chat.id, participantId: "", isGroup: true });
    } else {
      const other = chat.participantIds.find((id) => id !== "currentUser") ?? chat.participantIds[0] ?? "";
      navigation.navigate("Chat", { chatId: chat.id, participantId: other });
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Chat | GroupChat; index: number }) => {
      const chatName = isGroupChat(item) ? item.name : "Private Chat";
      const lastMessageText =
        item.lastMessage?.text ||
        (item.lastMessage?.attachment ? "Media" : t("chatList.empty"));
      const timestamp = item.lastMessage?.timestamp;

      return (
        <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
          <Pressable
            onPress={() => handleChatPress(item)}
            style={styles.chatItem}
            accessibilityRole="button"
            accessibilityLabel={chatName}
          >
            <Avatar size="medium" />
            <View style={styles.chatContent}>
              <View style={styles.topRow}>
                <View style={styles.nameRow}>
                  {item.isPinned ? (
                    <Feather name="bookmark" size={12} color={theme.primary} style={styles.pinIcon} />
                  ) : null}
                  <ThemedText style={styles.chatName} numberOfLines={1}>
                    {chatName}
                  </ThemedText>
                  {item.isMuted ? (
                    <Feather name="volume-x" size={14} color={theme.textSecondary} style={styles.muteIcon} />
                  ) : null}
                </View>
                {timestamp ? (
                  <ThemedText
                    style={[
                      styles.chatTime,
                      { color: item.unreadCount > 0 ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {formatTime(timestamp)}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.bottomRow}>
                <ThemedText
                  style={[styles.lastMessage, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {lastMessageText}
                </ThemedText>
                {item.unreadCount > 0 ? (
                  <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <ThemedText style={styles.badgeText}>
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
          <View style={[styles.separator, { backgroundColor: theme.divider }]} />
        </Animated.View>
      );
    },
    [theme, t]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <SkeletonLoader count={6} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {showSearch ? (
        <View
          style={[
            styles.searchContainer,
            { marginTop: headerHeight, backgroundColor: theme.surface },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search chats…"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <Feather name="x" size={18} color={theme.textSecondary} onPress={() => setSearchQuery("")} />
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: showSearch ? Spacing.md : headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          filteredChats.length === 0 && styles.emptyContent,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={
          <EmptyState
            image={require("../../../../assets/images/empty-chats.png")}
            title="No chats yet"
            message="Start a conversation with your friends and family"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            progressViewOffset={headerHeight}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 16 },
  listContent: { flexGrow: 1 },
  emptyContent: { justifyContent: "center" },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  chatContent: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  nameRow: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: Spacing.sm },
  pinIcon: { marginRight: Spacing.xs },
  muteIcon: { marginLeft: Spacing.xs },
  chatName: { fontSize: 16, fontWeight: "600", flex: 1 },
  chatTime: { fontSize: 12 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastMessage: { fontSize: 14, flex: 1, marginRight: Spacing.sm },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.lg + Spacing.avatarMedium + Spacing.md },
});
