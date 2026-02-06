import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { SettingsItem } from "@/components/SettingsItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useChatStore } from "@/store/chatStore";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface GroupInfoScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "GroupInfo">;
  route: RouteProp<RootStackParamList, "GroupInfo">;
}

export default function GroupInfoScreen({ navigation, route }: GroupInfoScreenProps) {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const {
    groupChats,
    getUserById,
    muteChat,
    unmuteChat,
    leaveGroup,
    makeAdmin,
    removeAdmin,
    removeFromGroup,
  } = useChatStore();

  const group = groupChats.find((g) => g.id === groupId);
  
  if (!group) {
    return null;
  }

  const isAdmin = group.adminIds.includes("currentUser");

  const handleMuteToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (group.isMuted) {
      unmuteChat(groupId);
    } else {
      muteChat(groupId);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            leaveGroup(groupId);
            navigation.goBack();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMemberPress = (userId: string) => {
    if (!isAdmin || userId === "currentUser") return;

    const isUserAdmin = group.adminIds.includes(userId);
    const user = getUserById(userId);

    Alert.alert(
      user?.name || "Member",
      undefined,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isUserAdmin ? "Remove Admin" : "Make Admin",
          onPress: () => {
            if (isUserAdmin) {
              removeAdmin(groupId, userId);
            } else {
              makeAdmin(groupId, userId);
            }
          },
        },
        {
          text: "Remove from Group",
          style: "destructive",
          onPress: () => {
            removeFromGroup(groupId, userId);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Group Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Avatar size="large" />
        <ThemedText style={styles.groupName}>{group.name}</ThemedText>
        <ThemedText style={[styles.groupInfo, { color: theme.textSecondary }]}>
          Group · {group.participants?.length || 0} participants
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
          {group.participants?.length || 0} Participants
        </ThemedText>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          {(group.participants || []).map((userId, index) => {
            const user = userId === "currentUser" 
              ? { id: "currentUser", name: "You", phone: "", isOnline: true }
              : getUserById(userId);
            const isUserAdmin = group.adminIds.includes(userId);

            if (!user) return null;

            return (
              <React.Fragment key={userId}>
                <Pressable
                  onPress={() => handleMemberPress(userId)}
                  style={styles.participant}
                >
                  <Avatar size="medium" />
                  <View style={styles.participantInfo}>
                    <ThemedText style={styles.participantName}>
                      {user.name}
                      {userId === "currentUser" ? " (You)" : ""}
                    </ThemedText>
                    {isUserAdmin ? (
                      <ThemedText style={[styles.adminBadge, { color: theme.primary }]}>
                        Admin
                      </ThemedText>
                    ) : null}
                  </View>
                </Pressable>
                {index < (group.participants?.length || 0) - 1 ? (
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  groupInfo: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.md,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  participant: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
  },
  adminBadge: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + Spacing.avatarMedium + Spacing.md,
  },
});
