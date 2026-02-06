import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface MessageInputProps {
  onSend: (text: string) => void;
  replyingTo?: { text: string; onCancelReply: () => void };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MessageInput({ onSend, replyingTo }: MessageInputProps) {
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const sendButtonScale = useSharedValue(0);
  const sendButtonRotation = useSharedValue(0);

  const hasText = text.trim().length > 0;

  React.useEffect(() => {
    sendButtonScale.value = withSpring(hasText ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [hasText]);

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: sendButtonScale.value },
      {
        rotate: `${interpolate(
          sendButtonRotation.value,
          [0, 1],
          [0, 360],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
    opacity: sendButtonScale.value,
  }));

  const handleSend = () => {
    if (!hasText) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendButtonRotation.value = 0;
    sendButtonRotation.value = withTiming(1, { duration: 300 });
    
    onSend(text.trim());
    setText("");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {replyingTo ? (
        <View style={[styles.replyBar, { backgroundColor: theme.surface }]}>
          <View style={[styles.replyIndicator, { backgroundColor: theme.primary }]} />
          <View style={styles.replyContent}>
            <Animated.Text
              style={[styles.replyText, { color: theme.text }]}
              numberOfLines={1}
            >
              {replyingTo.text}
            </Animated.Text>
          </View>
          <Pressable onPress={replyingTo.onCancelReply} style={styles.cancelReply}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      ) : null}
      
      <View style={styles.inputRow}>
        <Pressable style={styles.iconButton}>
          <Feather name="smile" size={24} color={theme.textSecondary} />
        </Pressable>

        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Message"
            placeholderTextColor={theme.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <Pressable style={styles.attachButton}>
            <Feather name="paperclip" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {hasText ? (
          <AnimatedPressable
            onPress={handleSend}
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary },
              Shadows.fab,
              sendButtonStyle,
            ]}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
          </AnimatedPressable>
        ) : (
          <Pressable style={styles.iconButton}>
            <Feather name="mic" size={24} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  replyIndicator: {
    width: 4,
    height: "100%",
  },
  replyContent: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  replyText: {
    fontSize: 14,
  },
  cancelReply: {
    padding: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.xl,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? Spacing.sm : 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === "android" ? Spacing.sm : 0,
    maxHeight: 100,
  },
  attachButton: {
    paddingLeft: Spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 0 : Spacing.sm,
    alignSelf: "flex-end",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
