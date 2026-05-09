/**
 * ChatListScreen Component Tests
 * Comprehensive component tests for chat list screen with accessibility
 * Uses real Zustand store with preloaded test data and mocked navigation
 */

import '../../../test-utils/i18nMock'; // Import i18n mock first

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import ChatListScreen from '../ChatListScreen';
import { useMVPStore } from '../../stores/mvpStore';
import type { Chat, Message } from '../../stores/mvpStore';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
};

// Mock MMKV for store tests
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock saveChats and saveMessages to prevent infinite loops
jest.mock('../../stores/mvpStore', () => {
  const actualModule = jest.requireActual('../../stores/mvpStore');
  return {
    ...actualModule,
    saveChats: jest.fn(),
    saveMessages: jest.fn(),
  };
});

// Helper component to preload store with test data
const TestWrapper: React.FC<{ children: React.ReactNode; initialChats?: Chat[]; initialMessages?: Record<string, Message[]> }> = ({ 
  children, 
  initialChats = [], 
  initialMessages = {} 
}) => {
  const { setChats, addMessage } = useMVPStore();

  React.useEffect(() => {
    if (initialChats.length > 0) {
      setChats(initialChats);
    }
    
    // Load initial messages
    Object.entries(initialMessages).forEach(([chatId, messages]) => {
      messages.forEach(message => {
        addMessage(chatId, message);
      });
    });
  }, [initialChats, initialMessages, setChats, addMessage]);

  return <>{children}</>;
};

describe('ChatListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderChatListScreen = (initialChats?: Chat[], initialMessages?: Record<string, Message[]>) => {
    return render(
      <TestWrapper initialChats={initialChats} initialMessages={initialMessages}>
        <ChatListScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );
  };

  describe('Rendering', () => {
    it('should render chat list with default mock data', () => {
      renderChatListScreen();
      
      // Should render default chats from store
      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
      expect(screen.getByText('Hey, how are you?')).toBeTruthy();
      expect(screen.getByText('See you tomorrow!')).toBeTruthy();
    });

    it('should render empty state when no chats', () => {
      renderChatListScreen([]);
      
      // Should not show any chat names
      expect(screen.queryByText('John Doe')).toBeNull();
      expect(screen.queryByText('Jane Smith')).toBeNull();
    });

    it('should render chats with custom test data', () => {
      const testChats: Chat[] = [
        {
          id: 'test-1',
          name: 'Test Chat 1',
          lastMessage: 'Test message 1',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          unreadCount: 3,
        },
        {
          id: 'test-2',
          name: 'Test Chat 2',
          lastMessage: 'Test message 2',
          timestamp: new Date('2023-01-01T09:00:00Z'),
          unreadCount: 0,
        },
      ];

      renderChatListScreen(testChats);

      expect(screen.getByText('Test Chat 1')).toBeTruthy();
      expect(screen.getByText('Test Chat 2')).toBeTruthy();
      expect(screen.getByText('Test message 1')).toBeTruthy();
      expect(screen.getByText('Test message 2')).toBeTruthy();
    });
  });

  describe('Unread Badges', () => {
    it('should display unread badge when unreadCount > 0', () => {
      const testChats: Chat[] = [
        {
          id: 'test-1',
          name: 'Chat with Unread',
          lastMessage: 'You have unread messages',
          timestamp: new Date(),
          unreadCount: 5,
        },
      ];

      renderChatListScreen(testChats);

      expect(screen.getByText('5')).toBeTruthy();
    });

    it('should not display unread badge when unreadCount = 0', () => {
      const testChats: Chat[] = [
        {
          id: 'test-1',
          name: 'Chat with No Unread',
          lastMessage: 'No unread messages',
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      renderChatListScreen(testChats);

      expect(screen.queryByText('0')).toBeNull();
    });

    it('should handle large unread counts', () => {
      const testChats: Chat[] = [
        {
          id: 'test-1',
          name: 'Popular Chat',
          lastMessage: 'Many messages',
          timestamp: new Date(),
          unreadCount: 999,
        },
      ];

      renderChatListScreen(testChats);

      expect(screen.getByText('999')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to chat screen when chat item is pressed', () => {
      const testChats: Chat[] = [
        {
          id: 'target-chat',
          name: 'Target Chat',
          lastMessage: 'Press me',
          timestamp: new Date(),
          unreadCount: 1,
        },
      ];

      renderChatListScreen(testChats);

      const chatItem = screen.getByText('Target Chat');
      fireEvent.press(chatItem);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Chat', { chatId: 'target-chat' });
    });

    it('should navigate with correct chatId for each chat', () => {
      const testChats: Chat[] = [
        {
          id: 'chat-1',
          name: 'Chat 1',
          lastMessage: 'Message 1',
          timestamp: new Date(),
          unreadCount: 0,
        },
        {
          id: 'chat-2',
          name: 'Chat 2',
          lastMessage: 'Message 2',
          timestamp: new Date(),
          unreadCount: 2,
        },
      ];

      renderChatListScreen(testChats);

      // Press first chat
      fireEvent.press(screen.getByText('Chat 1'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Chat', { chatId: 'chat-1' });

      // Press second chat
      fireEvent.press(screen.getByText('Chat 2'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Chat', { chatId: 'chat-2' });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible chat items with proper roles and labels', () => {
      const testChats: Chat[] = [
        {
          id: 'accessible-chat',
          name: 'John Doe',
          lastMessage: 'Hey, how are you?',
          timestamp: new Date(),
          unreadCount: 2,
        },
      ];

      renderChatListScreen(testChats);

      // Verify chat item is a button with proper label
      const chatItem = screen.getByLabelText(/John Doe, Chat, 2 unread messages/i);
      expect(chatItem).toBeTruthy();
      expect(chatItem).toHaveProp('accessibilityRole', 'button');
      expect(chatItem).toHaveProp('accessibilityHint', 'Opens conversation with John Doe');
    });

    it('should have accessible chat items without unread count', () => {
      const testChats: Chat[] = [
        {
          id: 'no-unread-chat',
          name: 'Jane Smith',
          lastMessage: 'See you tomorrow!',
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      renderChatListScreen(testChats);

      // Verify chat item without unread count
      const chatItem = screen.getByLabelText(/Jane Smith, Chat/i);
      expect(chatItem).toBeTruthy();
      expect(chatItem).toHaveProp('accessibilityRole', 'button');
      expect(chatItem).toHaveProp('accessibilityHint', 'Opens conversation with Jane Smith');
    });

    it('should have accessible unread badges', () => {
      const testChats: Chat[] = [
        {
          id: 'unread-chat',
          name: 'Chat with Unread',
          lastMessage: 'You have unread messages',
          timestamp: new Date(),
          unreadCount: 5,
        },
      ];

      renderChatListScreen(testChats);

      // Verify unread badge
      const badge = screen.getByText('5');
      expect(badge).toBeTruthy();
      
      // Find parent badge container
      const badgeContainer = badge.parent;
      expect(badgeContainer).toHaveProp('importantForAccessibility', 'yes');
      expect(badgeContainer).toHaveProp('accessibilityLabel', '5 unread messages');
    });

    it('should have accessible list container', () => {
      renderChatListScreen();
      
      // Verify FlatList has proper accessibility props
      const flatList = screen.getByRole('list');
      expect(flatList).toBeTruthy();
      expect(flatList).toHaveProp('accessibilityLabel', 'Chat list');
    });

    it('should have minimum touch target sizes', () => {
      const testChats: Chat[] = [
        {
          id: 'touch-target-chat',
          name: 'Touch Target Test',
          lastMessage: 'Testing touch targets',
          timestamp: new Date(),
          unreadCount: 1,
        },
      ];

      renderChatListScreen(testChats);

      const chatItem = screen.getByLabelText(/Touch Target Test, Chat/i);
      const style = chatItem.props.style;
      
      // Verify minimum touch target size (44x44 points)
      if (Array.isArray(style)) {
        const flattenedStyle = Object.assign({}, ...style);
        expect(flattenedStyle.minHeight).toBeGreaterThanOrEqual(44);
      } else if (typeof style === 'object') {
        expect(style.minHeight).toBeGreaterThanOrEqual(44);
      }
    });

    it('should handle accessibility for empty state', () => {
      renderChatListScreen([]);
      
      // Should still have accessible list container
      const flatList = screen.getByRole('list');
      expect(flatList).toBeTruthy();
      expect(flatList).toHaveProp('accessibilityLabel', 'Chat list');
    });
  });

  describe('Performance', () => {
    it('should handle large number of chats efficiently', () => {
      const manyChats: Chat[] = Array.from({ length: 100 }, (_, i) => ({
        id: `chat-${i}`,
        name: `Chat ${i}`,
        lastMessage: `Message ${i}`,
        timestamp: new Date(Date.now() - i * 1000),
        unreadCount: i % 5,
      }));

      const startTime = performance.now();
      renderChatListScreen(manyChats);
      const endTime = performance.now();

      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should render all chats
      expect(screen.getByText('Chat 0')).toBeTruthy();
      expect(screen.getByText('Chat 99')).toBeTruthy();
    });

    it('should handle rapid navigation without errors', () => {
      const testChats: Chat[] = Array.from({ length: 10 }, (_, i) => ({
        id: `chat-${i}`,
        name: `Chat ${i}`,
        lastMessage: `Message ${i}`,
        timestamp: new Date(),
        unreadCount: 0,
      }));

      renderChatListScreen(testChats);

      // Rapidly press multiple chats
      for (let i = 0; i < 10; i++) {
        fireEvent.press(screen.getByText(`Chat ${i}`));
      }

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed chat data gracefully', () => {
      const malformedChats: Chat[] = [
        {
          id: '',
          name: '',
          lastMessage: '',
          timestamp: new Date(),
          unreadCount: -1,
        },
      ];

      // Should not crash when rendering malformed data
      expect(() => renderChatListScreen(malformedChats)).not.toThrow();
    });

    it('should handle navigation errors gracefully', () => {
      mockNavigation.navigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const testChats: Chat[] = [
        {
          id: 'error-chat',
          name: 'Error Chat',
          lastMessage: 'This will cause navigation error',
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      renderChatListScreen(testChats);

      // Should not crash when navigation fails
      expect(() => fireEvent.press(screen.getByText('Error Chat'))).not.toThrow();
    });
  });

  describe('Store Integration', () => {
    it('should update when store data changes', () => {
      const { rerender } = renderChatListScreen([
        {
          id: 'dynamic-chat',
          name: 'Initial Name',
          lastMessage: 'Initial Message',
          timestamp: new Date(),
          unreadCount: 0,
        },
      ]);

      expect(screen.getByText('Initial Name')).toBeTruthy();
      expect(screen.getByText('Initial Message')).toBeTruthy();

      // Update store with new data
      const updatedChats: Chat[] = [
        {
          id: 'dynamic-chat',
          name: 'Updated Name',
          lastMessage: 'Updated Message',
          timestamp: new Date(),
          unreadCount: 5,
        },
      ];

      rerender(
        <TestWrapper initialChats={updatedChats}>
          <ChatListScreen navigation={mockNavigation as any} />
        </TestWrapper>
      );

      expect(screen.getByText('Updated Name')).toBeTruthy();
      expect(screen.getByText('Updated Message')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
    });

    it('should handle store errors gracefully', () => {
      // Mock store to throw error
      const originalError = console.error;
      console.error = jest.fn();

      const { setChats } = useMVPStore();
      
      // Force store error
      try {
        setChats(null as any);
      } catch (error) {
        // Expected error
      }

      // Should not crash the component
      expect(() => renderChatListScreen()).not.toThrow();

      console.error = originalError;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings in chat data', () => {
      const testChats: Chat[] = [
        {
          id: 'empty-chat',
          name: '',
          lastMessage: '',
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      renderChatListScreen(testChats);

      // Should render without crashing
      expect(() => screen.getByText('')).not.toThrow();
    });

    it('should handle null/undefined values in chat data', () => {
      const testChats: Chat[] = [
        {
          id: 'null-chat',
          name: 'Null Chat',
          lastMessage: null as any,
          timestamp: new Date(),
          unreadCount: null as any,
        },
      ];

      // Should handle null values gracefully
      expect(() => renderChatListScreen(testChats)).not.toThrow();
    });

    it('should handle extreme timestamp values', () => {
      const testChats: Chat[] = [
        {
          id: 'past-chat',
          name: 'Past Chat',
          lastMessage: 'Very old message',
          timestamp: new Date(0), // Unix epoch
          unreadCount: 0,
        },
        {
          id: 'future-chat',
          name: 'Future Chat',
          lastMessage: 'Future message',
          timestamp: new Date(8640000000000000), // Max date
          unreadCount: 0,
        },
      ];

      expect(() => renderChatListScreen(testChats)).not.toThrow();
    });
  });
});
