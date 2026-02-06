import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { GroupChat } from "@/store/types";
import { useChatStore } from "@/store/chatStore";

interface GroupChatHeaderProps {
  group: GroupChat;
  onPress?: () => void;
}

export function GroupChatHeader({ group, onPress }: GroupChatHeaderProps) {
  const { theme } = useTheme();
  const { getUserById } = useChatStore();

  const participantNames = (group.participants || [])
    .slice(0, 3)
    .map((id) => {
      if (id === "currentUser") return "You";
      const user = getUserById(id);
      return user?.name?.split(" ")[0] || "Unknown";
    })
    .join(", ");

  const moreCount = (group.participants?.length || 0) - 3;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Avatar size="small" />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {group.name}
        </ThemedText>
        <ThemedText style={[styles.participants, { color: theme.textSecondary }]} numberOfLines={1}>
          {participantNames}
          {moreCount > 0 ? `, +${moreCount} more` : ""}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  participants: {
    fontSize: 12,
  },
});
