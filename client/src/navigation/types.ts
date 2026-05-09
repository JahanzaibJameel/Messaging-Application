/**
 * Navigation Types
 * Type definitions for React Navigation
 */

export type RootStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string };
};

export type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};
