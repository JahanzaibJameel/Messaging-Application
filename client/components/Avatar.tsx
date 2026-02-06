import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AvatarProps {
  uri?: string;
  size?: "small" | "medium" | "large";
  showOnline?: boolean;
  isOnline?: boolean;
}

const sizeMap = {
  small: Spacing.avatarSmall,
  medium: Spacing.avatarMedium,
  large: Spacing.avatarLarge,
};

export function Avatar({
  uri,
  size = "medium",
  showOnline = false,
  isOnline = false,
}: AvatarProps) {
  const { theme } = useTheme();
  const avatarSize = sizeMap[size];
  const onlineDotSize = size === "small" ? 8 : size === "medium" ? 12 : 16;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      <Image
        source={uri ? { uri } : require("../../assets/images/avatar-placeholder.png")}
        style={[
          styles.image,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: theme.backgroundDefault,
          },
        ]}
        resizeMode="cover"
      />
      {showOnline && isOnline ? (
        <View
          style={[
            styles.onlineDot,
            {
              width: onlineDotSize,
              height: onlineDotSize,
              borderRadius: onlineDotSize / 2,
              backgroundColor: theme.online,
              borderColor: theme.backgroundRoot,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    overflow: "hidden",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});
