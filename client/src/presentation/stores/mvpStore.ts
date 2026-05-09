/**
 * MVP Store - Simple working messaging store
 * Basic functionality without enterprise complexity
 */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { createChatService } from '../../core/networking/chatService';
import { addStoreBreadcrumb, captureException } from '../../monitoring/sentry';

// Types
export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

interface MVPStore {
  // Chats
  chats: Chat[];
  currentChatId: string | null;
  
  // Messages
  messages: Record<string, Message[]>;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// MMKV storage instances
const chatsStorage = new MMKV({ id: 'chats' });
const messagesStorage = new MMKV({ id: 'messages' });

// Mock data for seeding
const mockChats: Chat[] = [
  {
    id: '1',
    name: 'John Doe',
    lastMessage: 'Hey, how are you?',
    timestamp: new Date(),
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Jane Smith',
    lastMessage: 'See you tomorrow!',
    timestamp: new Date(Date.now() - 3600000),
    unreadCount: 0,
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1-1',
      text: 'Hey, how are you?',
      senderId: 'john',
      timestamp: new Date(),
      isOwn: false,
    },
    {
      id: '1-2',
      text: "I'm doing great, thanks!",
      senderId: 'me',
      timestamp: new Date(Date.now() - 60000),
      isOwn: true,
    },
  ],
  '2': [
    {
      id: '2-1',
      text: 'See you tomorrow!',
      senderId: 'jane',
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false,
    },
  ],
};

// Storage helpers
const loadChats = (): Chat[] => {
  try {
    const stored = chatsStorage.getString('chats');
    if (stored) {
      const chats = JSON.parse(stored);
      addStoreBreadcrumb('load_chats', { count: chats.length });
      return chats;
    }
  } catch (error) {
    captureException(error as Error, {
      action: 'load_chats',
      screen: 'store_initialization',
      additionalData: { storage: 'mmkv' },
    });
  }
  return [];
};

const saveChats = (chats: Chat[]): void => {
  try {
    chatsStorage.set('chats', JSON.stringify(chats));
    addStoreBreadcrumb('save_chats', { count: chats.length });
  } catch (error) {
    captureException(error as Error, {
      action: 'save_chats',
      screen: 'store_persistence',
      additionalData: { chatCount: chats.length },
    });
  }
};

const loadMessages = (chatId: string): Message[] => {
  try {
    const stored = messagesStorage.getString(`messages_${chatId}`);
    if (stored) {
      const messages = JSON.parse(stored);
      addStoreBreadcrumb('load_messages', { chatId, count: messages.length });
      return messages;
    }
  } catch (error) {
    captureException(error as Error, {
      action: 'load_messages',
      screen: 'store_initialization',
      additionalData: { chatId },
    });
  }
  return [];
};

const saveMessages = (chatId: string, messages: Message[]): void => {
  try {
    messagesStorage.set(`messages_${chatId}`, JSON.stringify(messages));
    addStoreBreadcrumb('save_messages', { chatId, count: messages.length });
  } catch (error) {
    captureException(error as Error, {
      action: 'save_messages',
      screen: 'store_persistence',
      additionalData: { chatId, messageCount: messages.length },
    });
  }
};

export const useMVPStore = create<MVPStore>((set, get) => {
  // Create chat service instance
  const chatService = createChatService();

  // Load persisted data on store creation
  const persistedChats = loadChats();
  const persistedMessages: Record<string, Message[]> = {};
  
  // Load messages for each chat
  persistedChats.forEach(chat => {
    persistedMessages[chat.id] = loadMessages(chat.id);
  });

  return {
    // Initial state (persisted or seeded)
    chats: persistedChats.length > 0 ? persistedChats : mockChats,
    currentChatId: null,
    messages: persistedMessages,
    isLoading: false,
    error: null,

    // Actions
    setChats: (chats) => {
      addStoreBreadcrumb('set_chats', { count: chats.length });
      set({ chats });
      saveChats(chats);
    },
    
    setCurrentChat: (chatId) => {
      addStoreBreadcrumb('set_current_chat', { chatId });
      set({ currentChatId: chatId });
      // Connect to WebSocket when chat is selected
      if (chatId && !chatService.isConnected()) {
        try {
          chatService.connect();
          addStoreBreadcrumb('websocket_connect', { chatId });
        } catch (error) {
          captureException(error as Error, {
            action: 'websocket_connect',
            screen: 'chat_selection',
            additionalData: { chatId },
          });
        }
      }
    },
    
    addMessage: (chatId, message) => {
      addStoreBreadcrumb('add_message', { 
        chatId, 
        messageId: message.id, 
        isOwn: message.isOwn,
        messageLength: message.text.length 
      });
      
      const currentMessages = get().messages[chatId] || [];
      const updatedMessages = [...currentMessages, message];
      
      set({
        messages: {
          ...get().messages,
          [chatId]: updatedMessages,
        },
      });
      
      // Persist immediately
      saveMessages(chatId, updatedMessages);
      
      // Send via WebSocket if connected
      if (chatService.isConnected()) {
        try {
          chatService.sendMessage(chatId, message.text);
          addStoreBreadcrumb('message_sent', { chatId, messageId: message.id });
        } catch (error) {
          captureException(error as Error, {
            action: 'send_message',
            screen: 'chat_screen',
            additionalData: { chatId, messageId: message.id },
          });
        }
      }
    },
    
    setLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ error }),
  };
});

// Selectors
export const useChats = () => useMVPStore((state) => state.chats);
export const useCurrentChat = () => useMVPStore((state) => {
  const { currentChatId, messages } = state;
  if (!currentChatId) return null;
  
  return {
    chat: state.chats.find(c => c.id === currentChatId),
    messages: messages[currentChatId] || [],
  };
});
export const useMessages = (chatId: string) => 
  useMVPStore((state) => state.messages[chatId] || []);
export const useUIState = () => useMVPStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
}));
