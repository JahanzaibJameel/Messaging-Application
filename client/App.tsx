/**
 * App Entry Point
 * Mounts RootStackNavigator which contains the full auth + main tab flow.
 * All state comes from the presentation layer stores (authStore, chatStore,
 * messageStore, uiStore, syncStore). The old client/store/ is no longer used.
 */

import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { I18nextProvider } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import RootStackNavigator from "./navigation/RootStackNavigator";
import i18n from "./src/i18n";

export default function App(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootStackNavigator />
            <StatusBar barStyle="default" />
          </NavigationContainer>
        </SafeAreaProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
