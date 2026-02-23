import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { Call, User } from "@/store/types";
import { formatChatListTime, formatCallDuration } from "@/utils/formatTime";

interface CallItemProps {
  call: Call;
  user: User;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CallItem({ call, user, onPress }: CallItemProps) {
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

  const getCallIcon = () => {
    const iconName = call.direction === "incoming" ? "phone-incoming" : "phone-outgoing";
    const iconColor =
      call.status === "missed" || call.status === "declined" ? theme.error : theme.success;
    return <Feather name={iconName} size={14} color={iconColor} />;
  };

  const getCallTypeIcon = () => {
    return call.type === "video" ? "video" : "phone";
  };

  const getCallInfo = () => {
    if (call.status === "missed") {
      return "Missed";
    }
    if (call.status === "declined") {
      return "Declined";
    }
    if (call.duration) {
      return formatCallDuration(call.duration);
    }
    return "";
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <Avatar uri={user.avatar} size="medium" />

      <View style={styles.content}>
        <ThemedText
          style={[styles.name, call.status === "missed" && { color: theme.error }]}
          numberOfLines={1}
        >
          {user.name}
        </ThemedText>
        <View style={styles.callInfo}>
          {getCallIcon()}
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            {call.type === "video" ? "Video" : "Audio"} {getCallInfo()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.right}>
        <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
          {formatChatListTime(call.timestamp)}
        </ThemedText>
        <Pressable style={styles.callButton}>
          <Feather name={getCallTypeIcon()} size={20} color={theme.primary} />
        </Pressable>
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
  name: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  callInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
  },
  right: {
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  time: {
    fontSize: 12,
  },
  callButton: {
    padding: Spacing.xs,
  },
});
