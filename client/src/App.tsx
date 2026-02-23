/**
 * Main App Entry Point
 * Production-ready React Native Chat Application
 * 
 * Features:
 * - Clean Architecture
 * - Offline-first with sync engine
 * - Error boundaries
 * - Toast notifications
 * - Network monitoring
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@legacy/lib/query-client';
import RootStackNavigator from '@legacy/navigation/RootStackNavigator';
import { ErrorBoundary } from '@legacy/components/ErrorBoundary';
import { ToastContainer } from '@presentation/components/ui/Toast';
import { getSyncEngine } from '@core/sync';
import { getNetworkMonitor } from '@core/sync';
import { useAuthStore } from '@presentation/stores';

export default function App(): React.ReactElement {
  const { loadPersistedState } = useAuthStore();

  useEffect(() => {
    // Initialize stores
    void loadPersistedState();

    // Start sync engine
    const syncEngine = getSyncEngine();
    syncEngine.start();

    // Start network monitoring
    const networkMonitor = getNetworkMonitor();
    networkMonitor.start();

    return () => {
      syncEngine.stop();
      networkMonitor.stop();
    };
  }, [loadPersistedState]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <NavigationContainer>
                <RootStackNavigator />
              </NavigationContainer>
              <StatusBar style="auto" />
              <ToastContainer />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
