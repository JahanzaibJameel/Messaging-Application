import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface EmptyStateProps {
  image?: ImageSourcePropType;
  title: string;
  message?: string;
}

export function EmptyState({ image, title, message }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {image && <Image source={image} style={styles.image} resizeMode="contain" />}
      <ThemedText style={styles.title}>{title}</ThemedText>
      {message ? (
        <ThemedText style={[styles.message, { color: theme.textSecondary }]}>{message}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
