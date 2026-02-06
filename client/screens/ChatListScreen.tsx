import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { ChatListItem } from "@/components/ChatListItem";
import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useChatStore } from "@/store/chatStore";
import { Chat, GroupChat } from "@/store/types";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import { formatChatListTime } from "@/utils/formatTime";

type ChatListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "ChatsTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ChatListScreenProps {
  navigation: ChatListScreenNavigationProp;
}

function isGroupChat(chat: Chat | GroupChat): chat is GroupChat {
  return chat.type === "group";
}

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { getAllChats, getUserById, isLoading } = useChatStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const allChats = getAllChats().filter((c) => !c.isArchived);

  const filteredChats = allChats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    
    if (isGroupChat(chat)) {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    const user = getUserById(chat.participantId || "");
    return user?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleChatPress = (chat: Chat | GroupChat) => {
    if (isGroupChat(chat)) {
      navigation.navigate("Chat", { chatId: chat.id, participantId: "", isGroup: true });
    } else {
      navigation.navigate("Chat", { chatId: chat.id, participantId: chat.participantId || "" });
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Chat | GroupChat; index: number }) => {
      if (isGroupChat(item)) {
        return (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable
              onPress={() => handleChatPress(item)}
              style={styles.groupChatItem}
            >
              <Avatar size="medium" />
              <View style={styles.chatContent}>
                <View style={styles.topRow}>
                  <View style={styles.nameRow}>
                    {item.isPinned ? (
                      <Feather name="bookmark" size={12} color={theme.primary} style={styles.pinIcon} />
                    ) : null}
                    <ThemedText style={styles.chatName} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    {item.isMuted ? (
                      <Feather name="volume-x" size={14} color={theme.textSecondary} style={styles.muteIcon} />
                    ) : null}
                  </View>
                  {item.lastMessage ? (
                    <ThemedText
                      style={[
                        styles.chatTime,
                        { color: item.unreadCount > 0 ? theme.primary : theme.textSecondary },
                      ]}
                    >
                      {formatChatListTime(item.lastMessage.timestamp)}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.bottomRow}>
                  <ThemedText
                    style={[styles.lastMessage, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.lastMessage?.text || "Start a conversation"}
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
      }

      const user = getUserById(item.participantId || "");
      if (!user) return null;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          <Pressable
            onPress={() => handleChatPress(item)}
            style={styles.groupChatItem}
          >
            <Avatar uri={user.avatar} size="medium" showOnline isOnline={user.isOnline} />
            <View style={styles.chatContent}>
              <View style={styles.topRow}>
                <View style={styles.nameRow}>
                  {item.isPinned ? (
                    <Feather name="bookmark" size={12} color={theme.primary} style={styles.pinIcon} />
                  ) : null}
                  <ThemedText style={styles.chatName} numberOfLines={1}>
                    {user.name}
                  </ThemedText>
                  {item.isMuted ? (
                    <Feather name="volume-x" size={14} color={theme.textSecondary} style={styles.muteIcon} />
                  ) : null}
                </View>
                {item.lastMessage ? (
                  <ThemedText
                    style={[
                      styles.chatTime,
                      { color: item.unreadCount > 0 ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {formatChatListTime(item.lastMessage.timestamp)}
                  </ThemedText>
                ) : null}
              </View>
              <View style={styles.bottomRow}>
                <ThemedText
                  style={[styles.lastMessage, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.lastMessage?.attachment ? "Media" : item.lastMessage?.text || "Start a conversation"}
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
    [getUserById, theme]
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-chats.png")}
      title="No chats yet"
      message="Start a conversation with your friends and family"
    />
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
            {
              marginTop: headerHeight,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search chats..."
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
        ListEmptyComponent={renderEmpty}
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
  container: {
    flex: 1,
  },
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
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContent: {
    justifyContent: "center",
  },
  groupChatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.sm,
  },
  pinIcon: {
    marginRight: Spacing.xs,
  },
  muteIcon: {
    marginLeft: Spacing.xs,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: Spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + Spacing.avatarMedium + Spacing.md,
  },
});
