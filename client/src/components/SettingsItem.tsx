import React from "react";
import { View, StyleSheet, Pressable, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  toggle?: {
    value: boolean;
    onValueChange: (value: boolean) => void;
  };
  destructive?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  toggle,
  destructive = false,
}: SettingsItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!toggle) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const textColor = destructive ? theme.error : theme.text;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!!toggle}
      style={[styles.container, animatedStyle]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: destructive ? theme.error : theme.primary },
        ]}
      >
        <Feather name={icon} size={18} color="#FFFFFF" />
      </View>

      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onValueChange}
          trackColor={{ false: theme.backgroundDefault, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      ) : showArrow ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
