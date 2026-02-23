import React from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface MessageActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function MessageActionSheet({
  visible,
  onClose,
  onReply,
  onCopy,
  onDelete,
}: MessageActionSheetProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(100, { duration: 150 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
    onClose();
  };

  const actions = [
    { icon: "corner-up-left" as const, label: "Reply", onPress: onReply },
    { icon: "copy" as const, label: "Copy", onPress: onCopy },
    { icon: "trash-2" as const, label: "Delete", onPress: onDelete, destructive: true },
  ];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.backgroundRoot },
            Shadows.card,
            sheetStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.backgroundDefault }]} />

          {actions.map((action, index) => (
            <Pressable
              key={action.label}
              onPress={() => handleAction(action.onPress)}
              style={({ pressed }) => [
                styles.action,
                pressed && { backgroundColor: theme.backgroundDefault },
                index < actions.length - 1 && styles.actionBorder,
                { borderBottomColor: theme.divider },
              ]}
            >
              <Feather
                name={action.icon}
                size={22}
                color={action.destructive ? theme.error : theme.text}
              />
              <ThemedText
                style={[styles.actionLabel, action.destructive && { color: theme.error }]}
              >
                {action.label}
              </ThemedText>
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing["3xl"],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  actionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
});
