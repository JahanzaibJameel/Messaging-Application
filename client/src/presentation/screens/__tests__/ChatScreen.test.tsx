
import '../../../test-utils/i18nMock'; // Import i18n mock first

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../ChatScreen';
import { useMVPStore } from '../../stores/mvpStore';
import type { Chat, Message } from '../../stores/mvpStore';

// Mock MMKV for store tests
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock chat service to avoid WebSocket connections
jest.mock('../../../core/networking/chatService', () => ({
  createChatService: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: jest.fn(),
    isConnected: jest.fn(() => false),
  })),
}));

// Mock navigation
const Stack = createNativeStackNavigator();
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

// Helper component to preload store with test data
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  initialChats?: Chat[]; 
  initialMessages?: Record<string, Message[]>;
  chatId?: string;
}> = ({ 
  children, 
  initialChats = [], 
  initialMessages = {},
  chatId = 'test-chat-1'
}) => {
  const { setChats, addMessage, setCurrentChat } = useMVPStore();

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
    
    // Set current chat
    setCurrentChat(chatId);
  }, [initialChats, initialMessages, setChats, addMessage, setCurrentChat, chatId]);

  return <>{children}</>;
};

const renderChatScreen = (chatId: string = 'test-chat-1', initialChats?: Chat[], initialMessages?: Record<string, Message[]>) => {
  const mockRoute = { params: { chatId } };
  
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Chat" 
          component={() => (
            <TestWrapper initialChats={initialChats} initialMessages={initialMessages} chatId={chatId}>
              <ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />
            </TestWrapper>
          )}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('ChatScreen', () => {
  const testChat: Chat = {
    id: 'test-chat-1',
    name: 'Test Chat',
    lastMessage: 'Last message',
    timestamp: new Date('2023-01-01T10:00:00Z'),
    unreadCount: 0,
  };

  const testMessages: Message[] = [
    {
      id: 'msg-1',
      text: 'Hello from other',
      senderId: 'other-user',
      timestamp: new Date('2023-01-01T09:00:00Z'),
      isOwn: false,
    },
    {
      id: 'msg-2',
      text: 'Hello from me',
      senderId: 'me',
      timestamp: new Date('2023-01-01T09:05:00Z'),
      isOwn: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render chat header with chat name', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      expect(screen.getByText('Test Chat')).toBeTruthy();
    });

    it('should render loading state when chat is not available', () => {
      renderChatScreen('nonexistent-chat', []);
      
      expect(screen.getByText('Loading chat...')).toBeTruthy();
    });

    it('should render message input and send button', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      expect(screen.getByPlaceholderText('Type a message...')).toBeTruthy();
      expect(screen.getByText('Send')).toBeTruthy();
    });

    it('should render existing messages', () => {
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': testMessages });
      
      expect(screen.getByText('Hello from other')).toBeTruthy();
      expect(screen.getByText('Hello from me')).toBeTruthy();
    });

    it('should render empty state when no messages', () => {
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': [] });
      
      // Should not show any message text
      expect(screen.queryByText('Hello from other')).toBeNull();
      expect(screen.queryByText('Hello from me')).toBeNull();
      
      // Should still show input and send button
      expect(screen.getByPlaceholderText('Type a message...')).toBeTruthy();
      expect(screen.getByText('Send')).toBeTruthy();
    });
  });

  describe('Message Sending', () => {
    it('should send message when typing and pressing send', async () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat]);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.changeText(input, 'New message');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(addMessage).toHaveBeenCalledWith('test-chat-1', 
          expect.objectContaining({ 
            text: 'New message',
            senderId: 'me',
            isOwn: true 
          })
        );
      });
    });

    it('should clear input after sending message', async () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.changeText(input, 'Test message');
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });

    it('should not send empty message', () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat]);
      
      const sendButton = screen.getByText('Send');
      
      fireEvent.press(sendButton);
      
      expect(addMessage).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only message', () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat]);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.changeText(input, '   ');
      fireEvent.press(sendButton);
      
      expect(addMessage).not.toHaveBeenCalled();
    });

    it('should handle multiline messages', async () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat]);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      
      fireEvent.changeText(input, multilineMessage);
      fireEvent.press(sendButton);
      
      await waitFor(() => {
        expect(addMessage).toHaveBeenCalledWith('test-chat-1', 
          expect.objectContaining({ text: multilineMessage })
        );
      });
    });

    it('should respect message length limit', () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat]);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const longMessage = 'A'.repeat(600); // Exceeds 500 character limit
      
      fireEvent.changeText(input, longMessage);
      
      // Input should be truncated to 500 characters
      expect(input.props.value).toBe('A'.repeat(500));
    });
  });

  describe('Message Display', () => {
    it('should display messages in correct order', () => {
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': testMessages });
      
      const messages = screen.getAllByText(/Hello from/);
      expect(messages).toHaveLength(2);
    });

    it('should display message timestamps', () => {
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': testMessages });
      
      // Should display time format (HH:MM)
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('should differentiate own and other messages', () => {
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': testMessages });
      
      // Both messages should be displayed
      expect(screen.getByText('Hello from other')).toBeTruthy();
      expect(screen.getByText('Hello from me')).toBeTruthy();
    });

    it('should handle messages with special characters', () => {
      const specialMessages: Message[] = [
        {
          id: 'special-1',
          text: 'Special chars: 🎉\n\t"{}[]\'\\',
          senderId: 'other',
          timestamp: new Date(),
          isOwn: false,
        },
      ];
      
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': specialMessages });
      
      expect(screen.getByText('Special chars: 🎉\n\t"{}[]\'\\')).toBeTruthy();
    });

    it('should handle very long messages', () => {
      const longMessage: Message[] = [
        {
          id: 'long-1',
          text: 'A'.repeat(1000),
          senderId: 'other',
          timestamp: new Date(),
          isOwn: false,
        },
      ];
      
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': longMessage });
      
      expect(screen.getByText('A'.repeat(1000))).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const backButton = screen.getByText('← Back');
      fireEvent.press(backButton);
      
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should handle navigation errors gracefully', () => {
      mockNavigation.goBack.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      renderChatScreen('test-chat-1', [testChat]);
      
      const backButton = screen.getByText('← Back');
      
      // Should not crash when navigation fails
      expect(() => fireEvent.press(backButton)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible send button with proper role and label', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const sendButton = screen.getByLabelText(/send message/i);
      expect(sendButton).toBeTruthy();
      expect(sendButton).toHaveProp('accessibilityRole', 'button');
      expect(sendButton).toHaveProp('accessibilityHint', /sends the typed message/i);
    });

    it('should have accessible message input with proper label and hint', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const messageInput = screen.getByLabelText(/message input/i);
      expect(messageInput).toBeTruthy();
      expect(messageInput).toHaveProp('accessibilityHint', /type a message to send/i);
      expect(messageInput).toHaveProp('allowFontScaling', true);
    });

    it('should have accessible back button with proper role and label', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const backButton = screen.getByLabelText(/go back to chat list/i);
      expect(backButton).toBeTruthy();
      expect(backButton).toHaveProp('accessibilityRole', 'button');
      expect(backButton).toHaveProp('accessibilityHint', /returns to the chat list screen/i);
    });

    it('should have accessible message bubbles with proper roles and labels', () => {
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': testMessages });
      
      // Verify message bubbles are accessible
      const message1 = screen.getByLabelText(/message from other-user: Hello from other/i);
      expect(message1).toBeTruthy();
      expect(message1).toHaveProp('accessibilityRole', 'text');
      
      const message2 = screen.getByLabelText(/message from me: Hello from me/i);
      expect(message2).toBeTruthy();
      expect(message2).toHaveProp('accessibilityRole', 'text');
    });

    it('should have accessible chat name header', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const chatName = screen.getByLabelText(/chat with test chat/i);
      expect(chatName).toBeTruthy();
      expect(chatName).toHaveProp('accessibilityRole', 'header');
    });

    it('should have accessible messages list', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      // Verify FlatList has proper accessibility props
      const messagesList = screen.getByRole('list');
      expect(messagesList).toBeTruthy();
      expect(messagesList).toHaveProp('accessibilityLabel', 'Messages');
    });

    it('should have accessible loading state', () => {
      renderChatScreen('nonexistent-chat', []);
      
      const loadingText = screen.getByLabelText(/loading chat/i);
      expect(loadingText).toBeTruthy();
      expect(loadingText).toHaveProp('accessibilityRole', 'text');
    });

    it('should have minimum touch target sizes for interactive elements', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      // Check send button touch target
      const sendButton = screen.getByLabelText(/send message/i);
      const sendButtonStyle = sendButton.props.style;
      
      if (Array.isArray(sendButtonStyle)) {
        const flattenedStyle = Object.assign({}, ...sendButtonStyle);
        expect(flattenedStyle.minWidth).toBeGreaterThanOrEqual(44);
        expect(flattenedStyle.minHeight).toBeGreaterThanOrEqual(44);
      } else if (typeof sendButtonStyle === 'object') {
        expect(sendButtonStyle.minWidth).toBeGreaterThanOrEqual(44);
        expect(sendButtonStyle.minHeight).toBeGreaterThanOrEqual(44);
      }
      
      // Check back button touch target
      const backButton = screen.getByLabelText(/go back to chat list/i);
      const backButtonStyle = backButton.props.style;
      
      if (Array.isArray(backButtonStyle)) {
        const flattenedStyle = Object.assign({}, ...backButtonStyle);
        expect(flattenedStyle.minHeight).toBeGreaterThanOrEqual(44);
        expect(flattenedStyle.minWidth).toBeGreaterThanOrEqual(44);
      } else if (typeof backButtonStyle === 'object') {
        expect(backButtonStyle.minHeight).toBeGreaterThanOrEqual(44);
        expect(backButtonStyle.minWidth).toBeGreaterThanOrEqual(44);
      }
    });

    it('should have proper accessibility state for disabled send button', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const sendButton = screen.getByLabelText(/send message/i);
      
      // Initially disabled (no message text)
      expect(sendButton).toHaveProp('accessibilityState', {
        disabled: true,
      });
      
      // Type message to enable button
      const input = screen.getByLabelText(/message input/i);
      fireEvent.changeText(input, 'Test message');
      
      // Should now be enabled
      expect(sendButton).toHaveProp('accessibilityState', {
        disabled: false,
      });
    });

    it('should handle accessibility for special characters in messages', () => {
      const specialMessages: Message[] = [
        {
          id: 'special-1',
          text: 'Special chars: 🎉\n\t"{}[]\'\\',
          senderId: 'other',
          timestamp: new Date(),
          isOwn: false,
        },
      ];
      
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': specialMessages });
      
      const message = screen.getByLabelText(/message from other: Special chars: 🎉/i);
      expect(message).toBeTruthy();
      expect(message).toHaveProp('accessibilityRole', 'text');
    });

    it('should handle accessibility for very long messages', () => {
      const longMessage: Message[] = [
        {
          id: 'long-1',
          text: 'A'.repeat(1000),
          senderId: 'other',
          timestamp: new Date(),
          isOwn: false,
        },
      ];
      
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': longMessage });
      
      const message = screen.getByLabelText(new RegExp(`message from other: A{1000}`, 'i'));
      expect(message).toBeTruthy();
      expect(message).toHaveProp('accessibilityRole', 'text');
    });
  });

  describe('Real-time Updates', () => {
    it('should display new messages when they arrive', async () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': [] });
      
      // Initially no messages
      expect(screen.queryByText('New message')).toBeNull();
      
      // Simulate receiving a new message
      const newMessage: Message = {
        id: 'new-msg',
        text: 'New message',
        senderId: 'other',
        timestamp: new Date(),
        isOwn: false,
      };
      
      addMessage('test-chat-1', newMessage);
      
      await waitFor(() => {
        expect(screen.getByText('New message')).toBeTruthy();
      });
    });

    it('should handle rapid message updates', async () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': [] });
      
      // Add multiple messages rapidly
      const rapidMessages: Message[] = Array.from({ length: 10 }, (_, i) => ({
        id: `rapid-${i}`,
        text: `Rapid message ${i}`,
        senderId: i % 2 === 0 ? 'me' : 'other',
        timestamp: new Date(Date.now() + i),
        isOwn: i % 2 === 0,
      }));
      
      rapidMessages.forEach(message => {
        addMessage('test-chat-1', message);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Rapid message 0')).toBeTruthy();
        expect(screen.getByText('Rapid message 9')).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of messages efficiently', () => {
      const manyMessages: Message[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        text: `Message ${i}`,
        senderId: i % 2 === 0 ? 'me' : 'other',
        timestamp: new Date(Date.now() + i),
        isOwn: i % 2 === 0,
      }));
      
      const startTime = performance.now();
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': manyMessages });
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should render first and last messages
      expect(screen.getByText('Message 0')).toBeTruthy();
      expect(screen.getByText('Message 99')).toBeTruthy();
    });

    it('should handle rapid input changes without lag', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      // Simulate rapid typing
      for (let i = 0; i < 50; i++) {
        fireEvent.changeText(input, `Typing ${i}`);
      }
      
      // Should handle rapid changes without crashing
      expect(() => fireEvent.changeText(input, 'Final text')).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed message data gracefully', () => {
      const malformedMessages: Message[] = [
        {
          id: '',
          text: '',
          senderId: '',
          timestamp: new Date(),
          isOwn: false,
        },
      ];
      
      // Should not crash with malformed data
      expect(() => 
        renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': malformedMessages })
      ).not.toThrow();
    });

    it('should handle missing chat data gracefully', () => {
      // Should not crash when chat doesn't exist
      expect(() => renderChatScreen('nonexistent-chat', [])).not.toThrow();
    });

    it('should handle input field errors gracefully', () => {
      renderChatScreen('test-chat-1', [testChat]);
      
      const input = screen.getByPlaceholderText('Type a message...');
      
      // Should handle various input scenarios
      expect(() => {
        fireEvent.changeText(input, null as any);
        fireEvent.changeText(input, undefined as any);
        fireEvent.changeText(input, 123 as any);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chat name', () => {
      const emptyNameChat: Chat = {
        ...testChat,
        name: '',
      };
      
      renderChatScreen('test-chat-1', [emptyNameChat]);
      
      // Should still render other elements
      expect(screen.getByPlaceholderText('Type a message...')).toBeTruthy();
      expect(screen.getByText('Send')).toBeTruthy();
    });

    it('should handle extreme timestamp values', () => {
      const extremeMessages: Message[] = [
        {
          id: 'past',
          text: 'Past message',
          senderId: 'other',
          timestamp: new Date(0), // Unix epoch
          isOwn: false,
        },
        {
          id: 'future',
          text: 'Future message',
          senderId: 'other',
          timestamp: new Date(8640000000000000), // Max date
          isOwn: false,
        },
      ];
      
      expect(() => 
        renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': extremeMessages })
      ).not.toThrow();
    });

    it('should handle concurrent message operations', async () => {
      const { addMessage } = useMVPStore();
      
      renderChatScreen('test-chat-1', [testChat], { 'test-chat-1': [] });
      
      // Simulate concurrent message additions
      const concurrentMessages: Message[] = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-${i}`,
        text: `Concurrent message ${i}`,
        senderId: 'me',
        timestamp: new Date(),
        isOwn: true,
      }));
      
      // Add all messages concurrently
      concurrentMessages.forEach(message => {
        addMessage('test-chat-1', message);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Concurrent message 0')).toBeTruthy();
        expect(screen.getByText('Concurrent message 4')).toBeTruthy();
      });
    });
  });
});
