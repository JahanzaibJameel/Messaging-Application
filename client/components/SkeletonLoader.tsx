import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SkeletonLoaderProps {
  count?: number;
}

function SkeletonItem() {
  const { theme } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View style={[styles.item, shimmerStyle]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundDefault }]} />
      <View style={styles.content}>
        <View style={[styles.namePlaceholder, { backgroundColor: theme.backgroundDefault }]} />
        <View style={[styles.messagePlaceholder, { backgroundColor: theme.backgroundDefault }]} />
      </View>
      <View style={[styles.timePlaceholder, { backgroundColor: theme.backgroundDefault }]} />
    </Animated.View>
  );
}

export function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: Spacing.avatarMedium,
    height: Spacing.avatarMedium,
    borderRadius: Spacing.avatarMedium / 2,
  },
  content: {
    flex: 1,
    gap: Spacing.sm,
  },
  namePlaceholder: {
    width: "60%",
    height: 16,
    borderRadius: BorderRadius.xs,
  },
  messagePlaceholder: {
    width: "80%",
    height: 14,
    borderRadius: BorderRadius.xs,
  },
  timePlaceholder: {
    width: 40,
    height: 12,
    borderRadius: BorderRadius.xs,
  },
});
