/**
 * Navigation Types
 * Single source of truth for all route param lists.
 */

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  OTP: { phone: string };
  Main: undefined;
  Chat: { chatId: string; participantId: string; isGroup?: boolean };
  GroupInfo: { groupId: string };
  DeveloperMenu: undefined;
};

export type MainTabParamList = {
  ChatsTab: undefined;
  StatusTab: undefined;
  CallsTab: undefined;
  SettingsTab: undefined;
};

// Convenience prop-types for screens
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type SplashNavProp = NativeStackNavigationProp<RootStackParamList, "Splash">;
export type LoginNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;
export type OTPNavProp = NativeStackNavigationProp<RootStackParamList, "OTP">;
export type ChatNavProp = NativeStackNavigationProp<RootStackParamList, "Chat">;
export type GroupInfoNavProp = NativeStackNavigationProp<RootStackParamList, "GroupInfo">;

export type OTPRouteProp = RouteProp<RootStackParamList, "OTP">;
export type ChatRouteProp = RouteProp<RootStackParamList, "Chat">;
export type GroupInfoRouteProp = RouteProp<RootStackParamList, "GroupInfo">;
