/**
 * Main Tab Navigator
 * ChatsTab uses the new presentation layer screen.
 * Status, Calls and Settings tabs keep their UI-layer screens.
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

// New presentation-layer screen
import ChatListScreen from "@/src/presentation/screens/ChatListScreen";

// UI-layer screens (no old-store dependency – they use the new stores after migration)
import StatusScreen from "@/src/presentation/screens/StatusScreen";
import CallsScreen from "@/src/presentation/screens/CallsScreen";
import SettingsScreen from "@/src/presentation/screens/SettingsScreen";

import { useTheme } from "@/hooks/useTheme";

import type { MainTabParamList } from "@/src/navigation/types";

export type { MainTabParamList };

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="ChatsTab"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
            web: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatListScreen}
        options={{
          title: "Chats",
          headerTitle: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StatusTab"
        component={StatusScreen}
        options={{
          title: "Status",
          headerTitle: "Status",
          tabBarIcon: ({ color, size }) => <Feather name="circle" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CallsTab"
        component={CallsScreen}
        options={{
          title: "Calls",
          headerTitle: "Calls",
          tabBarIcon: ({ color, size }) => <Feather name="phone" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerTitle: "Settings",
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
