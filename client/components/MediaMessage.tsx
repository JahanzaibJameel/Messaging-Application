import React from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { MessageAttachment } from "@/store/types";

interface MediaMessageProps {
  attachment: MessageAttachment;
  isOwn: boolean;
  onPress?: () => void;
}

export function MediaMessage({ attachment, isOwn, onPress }: MediaMessageProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = React.useState(true);

  const aspectRatio = attachment.width && attachment.height
    ? attachment.width / attachment.height
    : 4 / 3;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        isOwn
          ? { backgroundColor: theme.bubbleSender }
          : { backgroundColor: theme.bubbleReceiver },
        Shadows.bubble,
      ]}
    >
      <View style={[styles.mediaContainer, { aspectRatio }]}>
        <Image
          source={{ uri: attachment.uri }}
          style={styles.image}
          contentFit="cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          transition={200}
        />
        
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        ) : null}

        {attachment.type === "video" ? (
          <View style={styles.playButton}>
            <Feather name="play" size={32} color="#FFFFFF" />
          </View>
        ) : null}

        {attachment.duration ? (
          <View style={styles.durationBadge}>
            <Feather name="play" size={10} color="#FFFFFF" />
            <View style={styles.durationText}>
              {formatDuration(attachment.duration)}
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatDuration(seconds: number): React.ReactNode {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.bubble,
    overflow: "hidden",
    maxWidth: 280,
  },
  mediaContainer: {
    width: "100%",
    minHeight: 150,
    maxHeight: 300,
    position: "relative",
  },
  image: {
    flex: 1,
    borderRadius: BorderRadius.bubble - 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
});
