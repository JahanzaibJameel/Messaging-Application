/**
 * MVP Store Tests
 * Comprehensive unit tests for Zustand store with MMKV persistence
 * Covers all actions, selectors, edge cases, and error scenarios
 */

import { renderHook, act } from '@testing-library/react-native';
import { MMKV } from 'react-native-mmkv';

// Mock MMKV for testing
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock chat service to avoid WebSocket connections during store tests
jest.mock('../../core/networking/chatService', () => ({
  createChatService: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: jest.fn(),
    isConnected: jest.fn(() => false),
  })),
}));

import { useMVPStore, useChats, useCurrentChat, useMessages, useUIState } from '../mvpStore';
import type { Message, Chat } from '../mvpStore';

describe('MVP Store', () => {
  let mockGetString: jest.Mock;
  let mockSet: jest.Mock;
  let mockDelete: jest.Mock;
  let mockClearAll: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mock functions from MMKV constructor
    const mockMMKV = MMKV as jest.MockedClass<typeof MMKV>;
    const mockInstance = {
      getString: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
    };
    mockGetString = mockInstance.getString;
    mockSet = mockInstance.set;
    mockDelete = mockInstance.delete;
    mockClearAll = mockInstance.clearAll;
    
    mockMMKV.mockImplementation(() => mockInstance as any);
  });

  describe('useChats', () => {
    it('should return initial chats when no persisted data exists', () => {
      mockGetString.mockReturnValue(null);
      
      const { result } = renderHook(() => useChats());
      
      expect(result.current).toHaveLength(2);
      expect(result.current[0].name).toBe('John Doe');
      expect(result.current[1].name).toBe('Jane Smith');
    });

    it('should return persisted chats when they exist', () => {
      const persistedChats: Chat[] = [
        { id: '3', name: 'Persisted Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 1 }
      ];
      mockGetString.mockReturnValue(JSON.stringify(persistedChats));
      
      const { result } = renderHook(() => useMVPStore());
      
      act(() => {
        result.current.setChats(persistedChats);
      });
      
      const { result: chatsResult } = renderHook(() => useChats());
      expect(chatsResult.current).toEqual(persistedChats);
    });

    it('should handle corrupted persisted data gracefully', () => {
      mockGetString.mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useChats());
      
      // Should fall back to mock data
      expect(result.current).toHaveLength(2);
      expect(result.current[0].name).toBe('John Doe');
    });
  });

  describe('useCurrentChat', () => {
    it('should return null when no chat is selected', () => {
      const { result } = renderHook(() => useCurrentChat());
      
      expect(result.current).toBeNull();
    });

    it('should return chat data when chat is selected', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.setCurrentChat('1');
      });
      
      const { result: currentChatResult } = renderHook(() => useCurrentChat());
      expect(currentChatResult.current?.chat?.name).toBe('Test Chat');
      expect(currentChatResult.current?.messages).toEqual([]);
    });

    it('should return null when selected chat does not exist', () => {
      const { result } = renderHook(() => useMVPStore());
      
      act(() => {
        result.current.setChats([{ id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }]);
        result.current.setCurrentChat('nonexistent');
      });
      
      const { result: currentChatResult } = renderHook(() => useCurrentChat());
      expect(currentChatResult.current?.chat).toBeUndefined();
    });

    it('should return messages for the current chat', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const testMessage: Message = {
        id: 'msg-1',
        text: 'Test message',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.setCurrentChat('1');
        result.current.addMessage('1', testMessage);
      });
      
      const { result: currentChatResult } = renderHook(() => useCurrentChat());
      expect(currentChatResult.current?.messages).toEqual([testMessage]);
    });
  });

  describe('useMessages', () => {
    it('should return empty array for non-existent chat', () => {
      const { result } = renderHook(() => useMessages('nonexistent'));
      
      expect(result.current).toEqual([]);
    });

    it('should return messages for existing chat', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testMessage: Message = {
        id: 'msg-1',
        text: 'Test message',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([{ id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }]);
        result.current.addMessage('1', testMessage);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toEqual([testMessage]);
    });

    it('should return empty array for chat with no messages', () => {
      const { result } = renderHook(() => useMVPStore());
      
      act(() => {
        result.current.setChats([{ id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }]);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toEqual([]);
    });
  });

  describe('useUIState', () => {
    it('should return initial UI state', () => {
      const { result } = renderHook(() => useUIState());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update loading state', () => {
      const { result } = renderHook(() => useMVPStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      const { result: uiResult } = renderHook(() => useUIState());
      expect(uiResult.current.isLoading).toBe(true);
    });

    it('should update error state', () => {
      const { result } = renderHook(() => useMVPStore());
      const errorMessage = 'Test error';
      
      act(() => {
        result.current.setError(errorMessage);
      });
      
      const { result: uiResult } = renderHook(() => useUIState());
      expect(uiResult.current.error).toBe(errorMessage);
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useMVPStore());
      
      act(() => {
        result.current.setError('Test error');
        result.current.setError(null);
      });
      
      const { result: uiResult } = renderHook(() => useUIState());
      expect(uiResult.current.error).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('should add message to existing chat', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const newMessage: Message = {
        id: 'msg-1',
        text: 'New message',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.addMessage('1', newMessage);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toHaveLength(1);
      expect(messagesResult.current[0]).toEqual(newMessage);
    });

    it('should create new chat message array if none exists', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const newMessage: Message = {
        id: 'msg-1',
        text: 'First message',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.addMessage('1', newMessage);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toHaveLength(1);
      expect(messagesResult.current[0]).toEqual(newMessage);
    });

    it('should handle multiple messages in order', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const message1: Message = {
        id: 'msg-1',
        text: 'First message',
        senderId: 'me',
        timestamp: new Date(Date.now() - 1000),
        isOwn: true,
      };
      const message2: Message = {
        id: 'msg-2',
        text: 'Second message',
        senderId: 'other',
        timestamp: new Date(),
        isOwn: false,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.addMessage('1', message1);
        result.current.addMessage('1', message2);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toHaveLength(2);
      expect(messagesResult.current[0]).toEqual(message1);
      expect(messagesResult.current[1]).toEqual(message2);
    });

    it('should handle messages for different chats independently', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const chat1: Chat = { id: '1', name: 'Chat 1', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const chat2: Chat = { id: '2', name: 'Chat 2', lastMessage: 'Hi', timestamp: new Date(), unreadCount: 0 };
      const message1: Message = {
        id: 'msg-1',
        text: 'Message for chat 1',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      const message2: Message = {
        id: 'msg-2',
        text: 'Message for chat 2',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([chat1, chat2]);
        result.current.addMessage('1', message1);
        result.current.addMessage('2', message2);
      });
      
      const { result: messages1Result } = renderHook(() => useMessages('1'));
      const { result: messages2Result } = renderHook(() => useMessages('2'));
      
      expect(messages1Result.current).toEqual([message1]);
      expect(messages2Result.current).toEqual([message2]);
    });

    it('should handle concurrent message additions', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        text: `Message ${i}`,
        senderId: 'me',
        timestamp: new Date(Date.now() + i),
        isOwn: true,
      }));
      
      act(() => {
        result.current.setChats([testChat]);
        // Add all messages concurrently
        messages.forEach(message => {
          result.current.addMessage('1', message);
        });
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toHaveLength(10);
      expect(messagesResult.current.map(m => m.id)).toEqual(messages.map(m => m.id));
    });
  });

  describe('Persistence', () => {
    it('should save chats to MMKV when setChats is called', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChats: Chat[] = [
        { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }
      ];
      
      act(() => {
        result.current.setChats(testChats);
      });
      
      expect(mockSet).toHaveBeenCalledWith('chats', JSON.stringify(testChats));
    });

    it('should save messages to MMKV when addMessage is called', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const newMessage: Message = {
        id: 'msg-1',
        text: 'New message',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.addMessage('1', newMessage);
      });
      
      expect(mockSet).toHaveBeenCalledWith('messages_1', JSON.stringify([newMessage]));
    });

    it('should handle MMKV write errors gracefully', () => {
      mockSet.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const { result } = renderHook(() => useMVPStore());
      
      const testChats: Chat[] = [
        { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }
      ];
      
      // Should not throw error
      expect(() => {
        act(() => {
          result.current.setChats(testChats);
        });
      }).not.toThrow();
    });

    it('should load persisted messages on store creation', () => {
      const persistedChats: Chat[] = [
        { id: '1', name: 'Persisted Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }
      ];
      const persistedMessages: Message[] = [
        {
          id: 'msg-1',
          text: 'Persisted message',
          senderId: 'me',
          timestamp: new Date(),
          isOwn: true,
        }
      ];
      
      mockGetString
        .mockReturnValueOnce(JSON.stringify(persistedChats))
        .mockReturnValueOnce(JSON.stringify(persistedMessages));
      
      const { result } = renderHook(() => useMVPStore());
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toEqual(persistedMessages);
    });

    it('should handle corrupted message data gracefully', () => {
      const persistedChats: Chat[] = [
        { id: '1', name: 'Persisted Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }
      ];
      
      mockGetString
        .mockReturnValueOnce(JSON.stringify(persistedChats))
        .mockReturnValueOnce('invalid json');
      
      const { result } = renderHook(() => useMVPStore());
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toEqual([]);
    });
  });

  describe('Store Actions', () => {
    it('should handle setCurrentChat with null', () => {
      const { result } = renderHook(() => useMVPStore());
      
      act(() => {
        result.current.setCurrentChat(null as any);
      });
      
      const { result: currentChatResult } = renderHook(() => useCurrentChat());
      expect(currentChatResult.current).toBeNull();
    });

    it('should handle empty chats array', () => {
      const { result } = renderHook(() => useMVPStore());
      
      act(() => {
        result.current.setChats([]);
      });
      
      const { result: chatsResult } = renderHook(() => useChats());
      expect(chatsResult.current).toEqual([]);
    });

    it('should handle adding message to non-existent chat', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const newMessage: Message = {
        id: 'msg-1',
        text: 'Message for non-existent chat',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.addMessage('nonexistent', newMessage);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('nonexistent'));
      expect(messagesResult.current).toEqual([newMessage]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with same ID', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const message1: Message = {
        id: 'duplicate-id',
        text: 'First message',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      const message2: Message = {
        id: 'duplicate-id',
        text: 'Second message',
        senderId: 'other',
        timestamp: new Date(),
        isOwn: false,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.addMessage('1', message1);
        result.current.addMessage('1', message2);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current).toHaveLength(2);
      expect(messagesResult.current[0]).toEqual(message1);
      expect(messagesResult.current[1]).toEqual(message2);
    });

    it('should handle very long messages', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const longText = 'A'.repeat(10000);
      const longMessage: Message = {
        id: 'msg-long',
        text: longText,
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.addMessage('1', longMessage);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current[0].text).toBe(longText);
    });

    it('should handle special characters in messages', () => {
      const { result } = renderHook(() => useMVPStore());
      
      const testChat: Chat = { id: '1', name: 'Test Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 };
      const specialMessage: Message = {
        id: 'msg-special',
        text: 'Special chars: 🎉\n\t"{}[]\'\\',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };
      
      act(() => {
        result.current.setChats([testChat]);
        result.current.addMessage('1', specialMessage);
      });
      
      const { result: messagesResult } = renderHook(() => useMessages('1'));
      expect(messagesResult.current[0].text).toBe('Special chars: 🎉\n\t"{}[]\'\\');
    });
  });
});
