/**
 * Modern 2026 UI Button component with ripple effect
 * @module components/ui/Button
 */

import React, { useMemo } from "react";
import { Pressable, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { spacing, borderRadius, shadows } from "@/theme/tokens";

interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = React.memo(function Button({
  onPress,
  title,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (): void => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = (): void => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const buttonStyle = useMemo<ViewStyle>(() => {
    const sizeStyles = {
      sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
      md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
      lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.primary,
      },
      secondary: {
        backgroundColor: theme.secondary,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: theme.primary,
      },
      ghost: {
        backgroundColor: "transparent",
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      borderRadius: borderRadius.lg,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      opacity: disabled ? 0.5 : 1,
      ...shadows.md,
    };
  }, [size, variant, theme, disabled]);

  const textStyle = useMemo<TextStyle>(() => {
    const variantTextColor = {
      primary: "#FFFFFF",
      secondary: "#FFFFFF",
      outline: theme.primary,
      ghost: theme.primary,
    };

    return {
      color: variantTextColor[variant],
      fontWeight: "600",
      marginLeft: icon ? spacing.sm : 0,
    };
  }, [variant, theme, icon]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[buttonStyle, animatedStyle, style]}
    >
      {icon && !isLoading && icon}
      {isLoading ? (
        <ActivityIndicator color={textStyle.color} size="small" />
      ) : (
        <ThemedText style={textStyle}>{title}</ThemedText>
      )}
    </AnimatedPressable>
  );
});
