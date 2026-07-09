/**
 * Group Info Screen
 * Displays group details and participants. Uses useChatStore from the
 * presentation layer.
 */

import React from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { SettingsItem } from "@/components/SettingsItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useChatStore, useAuthStore } from "@presentation/stores";
import type { GroupChat } from "@domain/entities/Chat";
import type { GroupInfoNavProp, GroupInfoRouteProp } from "../../../src/navigation/types";

interface Props {
  navigation: GroupInfoNavProp;
  route: GroupInfoRouteProp;
}

export default function GroupInfoScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { currentUser } = useAuthStore();
  const { getChatById, muteChat, unmuteChat, pinChat, unpinChat, removeChat } = useChatStore();

  const chat = getChatById(groupId);

  if (!chat || chat.type !== "group") return null;

  const group = chat as GroupChat;
  const currentUserId = currentUser?.id ?? "currentUser";
  const isAdmin = group.adminIds.includes(currentUserId);

  const handleMuteToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (group.isMuted) {
      unmuteChat(groupId);
    } else {
      muteChat(groupId);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          removeChat(groupId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Group Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Avatar size="large" />
        <ThemedText style={styles.groupName}>{group.name}</ThemedText>
        <ThemedText style={[styles.groupInfo, { color: theme.textSecondary }]}>
          Group · {group.participantIds.length} participants
        </ThemedText>
        {group.description ? (
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {group.description}
          </ThemedText>
        ) : null}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          <SettingsItem
            icon={group.isMuted ? "bell-off" : "bell"}
            title={group.isMuted ? "Unmute Notifications" : "Mute Notifications"}
            onPress={handleMuteToggle}
            showArrow={false}
          />
        </View>
      </View>

      {/* Participants */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {group.participantIds.length} Participants
        </ThemedText>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          {group.participantIds.map((userId, index) => {
            const isCurrentUser = userId === currentUserId;
            const isUserAdmin = group.adminIds.includes(userId);
            const displayName = isCurrentUser ? "You" : userId;

            return (
              <React.Fragment key={userId}>
                <View style={styles.participant}>
                  <Avatar size="medium" />
                  <View style={styles.participantInfo}>
                    <ThemedText style={styles.participantName}>
                      {displayName}
                    </ThemedText>
                    {isUserAdmin ? (
                      <ThemedText style={[styles.adminBadge, { color: theme.primary }]}>
                        Admin
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
                {index < group.participantIds.length - 1 ? (
                  <View style={[styles.separator, { backgroundColor: theme.divider }]} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Leave Group */}
      <View style={styles.section}>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          <SettingsItem
            icon="log-out"
            title="Leave Group"
            onPress={handleLeaveGroup}
            destructive
            showArrow={false}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  groupName: { fontSize: 24, fontWeight: "700", marginTop: Spacing.md, marginBottom: Spacing.xs, textAlign: "center" },
  groupInfo: { fontSize: 14 },
  description: { fontSize: 14, marginTop: Spacing.md, textAlign: "center" },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.md,
  },
  sectionContent: { borderRadius: BorderRadius.md, overflow: "hidden" },
  participant: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: Spacing.md },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 16, fontWeight: "500" },
  adminBadge: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.lg + Spacing.avatarMedium + Spacing.md },
});
