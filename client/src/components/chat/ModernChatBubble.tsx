/**
 * Modern 2026 Chat Bubble Component with glassmorphism effects
 * Optimized for FlashList with proper memoization
 * @module components/chat/ModernChatBubble
 */

import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { MediaMessage } from "@/components/MediaMessage";
import { useTheme } from "@/hooks/useTheme";
import { spacing, borderRadius } from "@/theme/tokens";
import type { Message } from "@/types";
import { formatMessageTime } from "@/utils/formatTime";

interface ModernChatBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: () => void;
  replyToMessage?: Message;
  showTimestamp?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ModernChatBubble = React.memo(function ModernChatBubble({
  message,
  isOwn,
  onLongPress,
  replyToMessage,
  showTimestamp = true,
}: ModernChatBubbleProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (): void => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = (): void => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleLongPress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  const bubbleStyle = useMemo<ViewStyle>(() => {
    const baseStyle: ViewStyle = {
      maxWidth: "85%",
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.xs,
    };

    if (isOwn) {
      return {
        ...baseStyle,
        backgroundColor: theme.primary,
        borderBottomRightRadius: borderRadius.sm,
        marginLeft: "auto",
        marginRight: spacing.md,
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: theme.surface,
        borderBottomLeftRadius: borderRadius.sm,
        marginLeft: spacing.md,
        marginRight: "auto",
      };
    }
  }, [isOwn, theme]);

  const textColor = isOwn ? "#FFFFFF" : theme.text;

  const renderStatusIcon = (): React.ReactNode => {
    if (!isOwn) return null;

    switch (message.status) {
      case "sending":
        return (
          <Feather
            name="clock"
            size={12}
            color="rgba(255, 255, 255, 0.7)"
            style={{ marginLeft: spacing.xs }}
          />
        );
      case "failed":
        return (
          <Feather
            name="alert-circle"
            size={12}
            color="#FF3B30"
            style={{ marginLeft: spacing.xs }}
          />
        );
      case "sent":
        return (
          <Feather
            name="check"
            size={12}
            color="rgba(255, 255, 255, 0.7)"
            style={{ marginLeft: spacing.xs }}
          />
        );
      case "delivered":
      case "read":
        return (
          <View style={{ flexDirection: "row", marginLeft: spacing.xs }}>
            <Feather
              name="check"
              size={12}
              color={message.status === "read" ? theme.primary : "rgba(255, 255, 255, 0.7)"}
            />
            <Feather
              name="check"
              size={12}
              color={message.status === "read" ? theme.primary : "rgba(255, 255, 255, 0.7)"}
              style={{ marginLeft: -6 }}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderReactions = (): React.ReactNode => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) {
      return null;
    }

    const reactions = Object.values(message.reactions);
    return (
      <View style={[styles.reactionsContainer, { backgroundColor: theme.surface }]}>
        {reactions.map((reaction, index) => (
          <ThemedText key={index} style={styles.reaction}>
            {reaction}
          </ThemedText>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { marginBottom: spacing.xs }]}>
      {replyToMessage && (
        <View
          style={[
            styles.replyContainer,
            {
              backgroundColor: theme.surfaceVariant,
              borderLeftColor: theme.primary,
            },
          ]}
        >
          <ThemedText style={styles.replyLabel}>
            {replyToMessage.senderId === "currentUser" ? "You" : "Them"}
          </ThemedText>
          <ThemedText style={[styles.replyText, { color: theme.textSecondary }]} numberOfLines={1}>
            {replyToMessage.text}
          </ThemedText>
        </View>
      )}

      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        style={[bubbleStyle, animatedStyle]}
      >
        {message.edited && (
          <ThemedText style={[styles.editedLabel, { color: textColor, opacity: 0.6 }]}>
            (edited)
          </ThemedText>
        )}

        {message.attachment && <MediaMessage attachment={message.attachment} isOwn={isOwn} />}

        {message.text && (
          <ThemedText style={[styles.messageText, { color: textColor }]}>{message.text}</ThemedText>
        )}

        {showTimestamp && (
          <View style={styles.timestampContainer}>
            <ThemedText style={[styles.timestamp, { color: textColor, opacity: 0.7 }]}>
              {formatMessageTime(message.timestamp)}
            </ThemedText>
            {renderStatusIcon()}
          </View>
        )}
      </AnimatedPressable>

      {renderReactions()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  replyContainer: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 3,
    borderRadius: borderRadius.md,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  editedLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    justifyContent: "flex-end",
  },
  timestamp: {
    fontSize: 12,
  },
  reactionsContainer: {
    flexDirection: "row",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  reaction: {
    fontSize: 16,
    marginHorizontal: 2,
  },
});
