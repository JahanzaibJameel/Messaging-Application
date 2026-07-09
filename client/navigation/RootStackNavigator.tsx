/**
 * Root Stack Navigator
 * Single navigation tree – all screens live under
 * client/src/presentation/screens/.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth + chat screens (new presentation layer)
import SplashScreen from "@/src/presentation/screens/SplashScreen";
import LoginScreen from "@/src/presentation/screens/LoginScreen";
import OTPScreen from "@/src/presentation/screens/OTPScreen";
import ChatScreen from "@/src/presentation/screens/ChatScreen";
import GroupInfoScreen from "@/src/presentation/screens/GroupInfoScreen";

// Tab navigator (contains Calls, Status, Settings tab screens)
import MainTabNavigator from "@/navigation/MainTabNavigator";

import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

import type { RootStackParamList } from "@/src/navigation/types";

export type { RootStackParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{ headerTitle: "", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerTransparent: false,
          headerStyle: { backgroundColor: theme.backgroundRoot },
        }}
      />
      <Stack.Screen
        name="GroupInfo"
        component={GroupInfoScreen}
        options={{
          headerTitle: "Group Info",
          headerTransparent: false,
          headerStyle: { backgroundColor: theme.backgroundRoot },
        }}
      />
    </Stack.Navigator>
  );
}
