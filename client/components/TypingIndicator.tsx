import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export function TypingIndicator() {
  const { theme } = useTheme();
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })),
          -1
        )
      );
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  const createDotStyle = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      transform: [{ translateY: -sv.value * 4 }],
      opacity: 0.5 + sv.value * 0.5,
    }));

  const dot1Style = createDotStyle(dot1);
  const dot2Style = createDotStyle(dot2);
  const dot3Style = createDotStyle(dot3);

  return (
    <View style={[styles.container, { alignSelf: "flex-start" }]}>
      <View style={[styles.bubble, { backgroundColor: theme.bubbleReceiver }, Shadows.bubble]}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.textSecondary }, dot1Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.textSecondary }, dot2Style]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.textSecondary }, dot3Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.bubble,
    borderBottomLeftRadius: BorderRadius.bubbleTail,
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
