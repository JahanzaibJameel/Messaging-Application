/**
 * App Entry Point
 * Mounts RootStackNavigator which contains the full auth + main tab flow.
 * All state comes from the presentation layer stores (authStore, chatStore,
 * messageStore, uiStore, syncStore).
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar, Modal, Pressable, StyleSheet, View } from "react-native";
import { I18nextProvider } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import i18n from "@/i18n";
import { useAppLock } from "@/hooks/useAppLock";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";

export default function App(): React.ReactElement {
  const appLock = useAppLock();
  const { theme } = useTheme();
  const isLockVisible = appLock.locked || appLock.checking;

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

      <Modal
        visible={isLockVisible}
        transparent
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View style={[styles.lockOverlay, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.lockCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.lockIcon, { backgroundColor: theme.primary }]}>
              <Feather name="lock" size={28} color="#FFFFFF" />
            </View>
            <ThemedText type="h3" style={styles.lockTitle}>
              ChatApp is locked
            </ThemedText>
            <ThemedText type="body" style={[styles.lockMessage, { color: theme.textSecondary }]}>
              {appLock.checking
                ? "Waiting for authentication..."
                : "Authenticate to continue using ChatApp."}
            </ThemedText>
            {appLock.error ? (
              <ThemedText type="small" style={[styles.lockError, { color: theme.error }]}>
                {appLock.error}
              </ThemedText>
            ) : null}
            <Pressable
              onPress={() => void appLock.unlock()}
              disabled={appLock.checking}
              style={({ pressed }) => [
                styles.unlockButton,
                { backgroundColor: theme.primary },
                pressed && !appLock.checking && styles.unlockButtonPressed,
                appLock.checking && styles.unlockButtonDisabled,
              ]}
            >
              <ThemedText
                type="body"
                style={[styles.unlockButtonText, { color: theme.buttonText }]}
              >
                {appLock.checking ? "Authenticating..." : "Unlock"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  lockCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  lockIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  lockTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  lockMessage: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  lockError: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  unlockButton: {
    minHeight: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  unlockButtonPressed: {
    opacity: 0.85,
  },
  unlockButtonDisabled: {
    opacity: 0.6,
  },
  unlockButtonText: {
    fontWeight: "600",
  },
});
