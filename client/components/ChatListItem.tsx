import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Chat, User } from "@/store/types";
import { formatChatListTime } from "@/utils/formatTime";

interface ChatListItemProps {
  chat: Chat;
  user: User;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChatListItem({ chat, user, onPress }: ChatListItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(0.8, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <Avatar uri={user.avatar} size="medium" showOnline isOnline={user.isOnline} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {user.name}
          </ThemedText>
          {chat.lastMessage ? (
            <ThemedText
              style={[
                styles.time,
                { color: chat.unreadCount > 0 ? theme.primary : theme.textSecondary },
              ]}
            >
              {formatChatListTime(chat.lastMessage.timestamp)}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.bottomRow}>
          <ThemedText
            style={[styles.lastMessage, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {chat.lastMessage?.text || "Start a conversation"}
          </ThemedText>
          {chat.unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.badgeText}>
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
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
});
