import React, { useState } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { SettingsItem } from "@/components/SettingsItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useChatStore } from "@/store/chatStore";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface SettingsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { currentUser, settings, toggleDarkMode, clearChatHistory, logout } = useChatStore();

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Chat History",
      "This will delete all your chat messages. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await clearChatHistory();
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: "Splash" }],
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Section */}
      <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
        <Avatar size="large" />
        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileName}>{currentUser?.name || "User"}</ThemedText>
          <ThemedText style={[styles.profilePhone, { color: theme.textSecondary }]}>
            {currentUser?.phone || "+1 234 567 8900"}
          </ThemedText>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Preferences
        </ThemedText>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          <SettingsItem
            icon="moon"
            title="Dark Mode"
            toggle={{
              value: isDark,
              onValueChange: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleDarkMode();
              },
            }}
            showArrow={false}
          />
          <View style={[styles.separator, { backgroundColor: theme.divider }]} />
          <SettingsItem
            icon="image"
            title="Chat Wallpaper"
            subtitle="Choose a background for your chats"
          />
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Data & Storage
        </ThemedText>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          <SettingsItem
            icon="trash-2"
            title="Clear Chat History"
            subtitle="Delete all messages"
            onPress={handleClearHistory}
            showArrow={false}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>About</ThemedText>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          <SettingsItem icon="info" title="App Version" subtitle={appVersion} showArrow={false} />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
          <SettingsItem
            icon="log-out"
            title="Log Out"
            onPress={handleLogout}
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
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
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },
});
