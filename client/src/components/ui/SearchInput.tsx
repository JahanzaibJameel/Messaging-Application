/**
 * Modern 2026 Search Input component with animated placeholder
 * @module components/ui/SearchInput
 */

import React, { useState, useMemo } from "react";
import { TextInput, StyleSheet, ViewStyle, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { spacing, borderRadius, shadows } from "@/theme/tokens";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchInput = React.memo(function SearchInput({
  value,
  onChangeText,
  placeholder = "Search...",
  onClear,
  style,
}: SearchInputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = (): void => {
    setIsFocused(true);
    scale.value = withSpring(1.02, { damping: 15, stiffness: 200 });
  };

  const handleBlur = (): void => {
    setIsFocused(false);
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const containerStyle = useMemo<ViewStyle>(() => {
    return {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      borderWidth: isFocused ? 2 : 1,
      borderColor: isFocused ? theme.primary : theme.surfaceVariant,
      ...shadows.sm,
    };
  }, [isFocused, theme]);

  return (
    <Animated.View style={[containerStyle, animatedStyle, style]}>
      <Feather name="search" size={18} color={theme.textSecondary} />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
      />
      {value.length > 0 && (
        <Pressable onPress={onClear}>
          <Feather name="x" size={18} color={theme.textSecondary} />
        </Pressable>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
});
