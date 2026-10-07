import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable } from "react-native";
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
import { useChatStore, useUIStore } from "@/presentation/stores";
import { getOtherParticipantId } from "@/presentation/stores/currentUser";
import type { Chat, GroupChat } from "@/domain/entities/Chat";
import type { NavigationProp } from "@/navigation/types";

function isGroupChat(chat: Chat | GroupChat): chat is GroupChat {
  return chat.type === "group";
}

// Time is rendered relative to "now" using the device locale and timezone.
//
// Clock skew note: a future-dated timestamp (a device with a wrong clock, or a
// server timestamp ahead of it) produces a negative `diff`, which is always less
// than oneDayMs, so it falls into the <1day branch and renders as a clock time
// rather than being flagged. Left as-is deliberately — clamping or labelling
// future timestamps is a product decision, not a formatting one.
function formatTime(date: Date | undefined): string {
  if (!date) return ""; // defensive only; caller guards at :129
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

/** The label a chat row shows. Also the text the search box matches against. */
function chatLabel(chat: Chat | GroupChat): string {
  return isGroupChat(chat) ? chat.name : "Private Chat";
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
  const { searchQuery, showSearch, setSearchQuery } = useUIStore();

  const allChats = getSortedChats();

  // The filter applies to the same label the row renders, for groups and private
  // chats alike. It previously short-circuited to `true` for private chats, so a
  // query only ever narrowed groups with no feedback for private rows.
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredChats = normalizedQuery
    ? allChats.filter((chat) => chatLabel(chat).toLowerCase().includes(normalizedQuery))
    : allChats;

  const handleChatPress = useCallback(
    (chat: Chat | GroupChat) => {
      if (isGroupChat(chat)) {
        navigation.navigate("Chat", { chatId: chat.id, participantId: "", isGroup: true });
      } else {
        navigation.navigate("Chat", {
          chatId: chat.id,
          participantId: getOtherParticipantId(chat.participantIds),
        });
      }
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Chat | GroupChat; index: number }) => {
      const name = chatLabel(item);
      const lastMessageText =
        item.lastMessage?.text || (item.lastMessage?.attachment ? "Media" : t("chatList.empty"));
      const timestamp = item.lastMessage?.timestamp;

      return (
        <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
          <Pressable
            onPress={() => handleChatPress(item)}
            style={styles.chatItem}
            accessibilityRole="button"
            accessibilityLabel={name}
          >
            <Avatar size="medium" />
            <View style={styles.chatContent}>
              <View style={styles.topRow}>
                <View style={styles.nameRow}>
                  {item.isPinned ? (
                    <Feather
                      name="bookmark"
                      size={12}
                      color={theme.primary}
                      style={styles.pinIcon}
                    />
                  ) : null}
                  <ThemedText style={styles.chatName} numberOfLines={1}>
                    {name}
                  </ThemedText>
                  {item.isMuted ? (
                    <Feather
                      name="volume-x"
                      size={14}
                      color={theme.textSecondary}
                      style={styles.muteIcon}
                    />
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
    [theme, t, handleChatPress]
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
            <Feather
              name="x"
              size={18}
              color={theme.textSecondary}
              onPress={() => setSearchQuery("")}
            />
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
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + Spacing.avatarMedium + Spacing.md,
  },
});
