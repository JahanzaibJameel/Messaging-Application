/**
 * Integration Tests - Store + Service + Persistence
 * Tests the complete offline-first real-time loop
 */

import '../../test-utils/i18nMock'; // Import i18n mock first

import { renderHook, act } from '@testing-library/react-native';
import { MMKV } from 'react-native-mmkv';

// Mock MMKV
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock WebSocket
const mockWebSocket = {
  readyState: WebSocket.OPEN,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

import { useMVPStore } from '../mvpStore';

describe('Integration Tests', () => {
  let mockSet: jest.Mock;
  let mockGetString: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSet = jest.fn();
    mockGetString = jest.fn();
    
    (MMKV as jest.Mock).mockImplementation(() => ({
      getString: mockGetString,
      set: mockSet,
      delete: jest.fn(),
      clearAll: jest.fn(),
    }));
  });

  describe('Complete Message Flow', () => {
    it('should send message and persist to MMKV', async () => {
      const { result } = renderHook(() => useMVPStore());
      
      // Set up a chat
      act(() => {
        result.current.setChats([
          { id: '1', name: 'Test Chat', lastMessage: '', timestamp: new Date(), unreadCount: 0 }
        ]);
        result.current.setCurrentChat('1');
      });

      // Send a message
      const newMessage = {
        id: 'msg-1',
        text: 'Hello World',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };

      act(() => {
        result.current.addMessage('1', newMessage);
      });

      // Verify message is in store
      expect(result.current.messages['1']).toContainEqual(newMessage);
      
      // Verify message was persisted to MMKV
      expect(mockSet).toHaveBeenCalledWith(
        'messages_1',
        JSON.stringify([newMessage])
      );
      
      // Verify message was sent via WebSocket
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Hello World')
      );
    });

    it('should receive message via WebSocket and persist', async () => {
      const { result } = renderHook(() => useMVPStore());
      
      // Set up a chat
      act(() => {
        result.current.setChats([
          { id: '1', name: 'Test Chat', lastMessage: '', timestamp: new Date(), unreadCount: 0 }
        ]);
        result.current.setCurrentChat('1');
      });

      // Simulate receiving a message via WebSocket
      const incomingMessage = {
        id: 'msg-2',
        text: 'Incoming message',
        senderId: 'other',
        timestamp: new Date(),
        isOwn: false,
      };

      act(() => {
        result.current.addMessage('1', incomingMessage);
      });

      // Verify message is in store
      expect(result.current.messages['1']).toContainEqual(incomingMessage);
      
      // Verify message was persisted to MMKV
      expect(mockSet).toHaveBeenCalledWith(
        'messages_1',
        JSON.stringify([incomingMessage])
      );
    });

    it('should handle empty storage and seed with mock data', () => {
      // Mock empty storage
      mockGetString.mockReturnValue(null);
      
      const { result } = renderHook(() => useMVPStore());
      
      // Should have seeded with mock data
      expect(result.current.chats).toHaveLength(2);
      expect(result.current.chats[0].name).toBe('John Doe');
      expect(result.current.chats[1].name).toBe('Jane Smith');
    });

    it('should load persisted data from storage', () => {
      const persistedChats = [
        { id: '1', name: 'Persisted Chat', lastMessage: 'Hello', timestamp: new Date(), unreadCount: 0 }
      ];
      const persistedMessages = [
        { id: 'msg-1', text: 'Persisted message', senderId: 'me', timestamp: new Date(), isOwn: true }
      ];

      // Mock persisted data
      mockGetString
        .mockReturnValueOnce(JSON.stringify(persistedChats)) // chats
        .mockReturnValueOnce(JSON.stringify(persistedMessages)); // messages

      const { result } = renderHook(() => useMVPStore());
      
      // Should load persisted data
      expect(result.current.chats).toEqual(persistedChats);
      expect(result.current.messages['1']).toEqual(persistedMessages);
    });

    it('should handle WebSocket connection on chat selection', () => {
      const { result } = renderHook(() => useMVPStore());
      
      // Set up chats
      act(() => {
        result.current.setChats([
          { id: '1', name: 'Test Chat', lastMessage: '', timestamp: new Date(), unreadCount: 0 }
        ]);
      });

      // Select chat - should trigger WebSocket connection
      act(() => {
        result.current.setCurrentChat('1');
      });

      expect(WebSocket).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', () => {
      // Mock storage error
      mockSet.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useMVPStore());
      
      // Set up a chat
      act(() => {
        result.current.setChats([
          { id: '1', name: 'Test Chat', lastMessage: '', timestamp: new Date(), unreadCount: 0 }
        ]);
        result.current.setCurrentChat('1');
      });

      // Send message - should not crash
      const newMessage = {
        id: 'msg-1',
        text: 'Hello World',
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      };

      expect(() => {
        act(() => {
          result.current.addMessage('1', newMessage);
        });
      }).not.toThrow();

      // Message should still be in store even if persistence failed
      expect(result.current.messages['1']).toContainEqual(newMessage);
    });
  });
});
