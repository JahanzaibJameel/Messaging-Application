/**
 * MVP App - Simple working messaging app
 * Basic functionality without enterprise complexity
 * WCAG 2.1 AA compliant and internationalized
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';

// Components
import ChatListScreen from './src/presentation/screens/ChatListScreen';
import ChatScreen from './src/presentation/screens/ChatScreen';

// Store
import { useMVPStore, useChats } from './src/presentation/stores/mvpStore';

// i18n
import i18n from './src/i18n';

// Navigation types
type RootStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent(): React.ReactElement {
  const { setChats } = useMVPStore();
  const chats = useChats();

  // Initialize chats on app start
  useEffect(() => {
    setChats(chats);
  }, [setChats, chats]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="ChatList" 
            component={ChatListScreen}
            options={{ title: i18n.t('chatList.title') }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: i18n.t('chat.messages') }}
          />
        </Stack.Navigator>
        <StatusBar barStyle="default" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App(): React.ReactElement {
  return (
    <I18nextProvider i18n={i18n}>
      <AppContent />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
