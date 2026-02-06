import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { MediaMessage } from "@/components/MediaMessage";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Message } from "@/store/types";
import { formatMessageTime } from "@/utils/formatTime";

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: () => void;
  replyToMessage?: Message;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChatBubble({
  message,
  isOwn,
  onLongPress,
  replyToMessage,
}: ChatBubbleProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case "sending":
        return <Feather name="clock" size={14} color={isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary} />;
      case "failed":
        return <Feather name="alert-circle" size={14} color={theme.error} />;
      case "sent":
        return <Feather name="check" size={14} color={isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary} />;
      case "delivered":
        return (
          <View style={styles.doubleCheck}>
            <Feather name="check" size={14} color={isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary} />
            <Feather
              name="check"
              size={14}
              color={isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary}
              style={styles.secondCheck}
            />
          </View>
        );
      case "read":
        return (
          <View style={styles.doubleCheck}>
            <Feather name="check" size={14} color={theme.primary} />
            <Feather
              name="check"
              size={14}
              color={theme.primary}
              style={styles.secondCheck}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderReactions = () => {
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

  // If it's a media message
  if (message.attachment) {
    return (
      <View
        style={[
          styles.container,
          isOwn ? styles.containerOwn : styles.containerOther,
        ]}
      >
        <AnimatedPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={300}
          style={animatedStyle}
        >
          <MediaMessage attachment={message.attachment} isOwn={isOwn} />
          {message.text ? (
            <View
              style={[
                styles.captionContainer,
                isOwn
                  ? { backgroundColor: theme.bubbleSender }
                  : { backgroundColor: theme.bubbleReceiver },
              ]}
            >
              <ThemedText
                style={[
                  styles.messageText,
                  { color: isOwn ? "#FFFFFF" : theme.text },
                ]}
              >
                {message.text}
              </ThemedText>
            </View>
          ) : null}
          <View style={[styles.mediaFooter, isOwn ? styles.mediaFooterOwn : styles.mediaFooterOther]}>
            <ThemedText
              style={[
                styles.mediaTimestamp,
                { color: isOwn ? "rgba(255,255,255,0.9)" : theme.textSecondary },
              ]}
            >
              {formatMessageTime(message.timestamp)}
            </ThemedText>
            {isOwn ? <View style={styles.statusIcon}>{getStatusIcon()}</View> : null}
          </View>
        </AnimatedPressable>
        {renderReactions()}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.containerOwn : styles.containerOther,
      ]}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={[
          styles.bubble,
          isOwn
            ? {
                backgroundColor: theme.bubbleSender,
                borderBottomRightRadius: BorderRadius.bubbleTail,
              }
            : {
                backgroundColor: theme.bubbleReceiver,
                borderBottomLeftRadius: BorderRadius.bubbleTail,
              },
          Shadows.bubble,
          animatedStyle,
        ]}
      >
        {replyToMessage ? (
          <View
            style={[
              styles.replyContainer,
              { borderLeftColor: theme.primary },
            ]}
          >
            <ThemedText
              style={[
                styles.replyText,
                { color: isOwn ? "rgba(255,255,255,0.8)" : theme.textSecondary },
              ]}
              numberOfLines={1}
            >
              {replyToMessage.text || "Media"}
            </ThemedText>
          </View>
        ) : null}
        <ThemedText
          style={[
            styles.messageText,
            { color: isOwn ? "#FFFFFF" : theme.text },
          ]}
        >
          {message.text}
        </ThemedText>
        <View style={styles.footer}>
          <ThemedText
            style={[
              styles.timestamp,
              { color: isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary },
            ]}
          >
            {formatMessageTime(message.timestamp)}
          </ThemedText>
          {isOwn ? <View style={styles.statusIcon}>{getStatusIcon()}</View> : null}
        </View>
      </AnimatedPressable>
      {renderReactions()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    maxWidth: "85%",
  },
  containerOwn: {
    alignSelf: "flex-end",
  },
  containerOther: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.bubble,
    minWidth: 80,
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingVertical: 2,
  },
  replyText: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  captionContainer: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: -BorderRadius.bubble,
    borderBottomLeftRadius: BorderRadius.bubble,
    borderBottomRightRadius: BorderRadius.bubble,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  mediaFooter: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    gap: Spacing.xs,
  },
  mediaFooterOwn: {
    right: Spacing.sm,
  },
  mediaFooterOther: {
    right: Spacing.sm,
  },
  timestamp: {
    fontSize: 11,
  },
  mediaTimestamp: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  statusIcon: {
    marginLeft: 2,
  },
  doubleCheck: {
    flexDirection: "row",
    width: 20,
  },
  secondCheck: {
    marginLeft: -8,
  },
  reactionsContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    marginTop: -Spacing.xs,
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  reaction: {
    fontSize: 14,
  },
});
