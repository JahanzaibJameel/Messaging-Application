/**
 * Integration Tests
 * End-to-end integration tests for store + chat service + MMKV flow
 * Tests real-time behavior without actual network using fake timers
 */

import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { MMKV } from "react-native-mmkv";
import { useMVPStore } from "../presentation/stores/mvpStore";
import { createChatService } from "../core/networking/chatService";
import type { Chat, Message } from "../presentation/stores/mvpStore";

// Mock WebSocket for integration tests
const createMockWebSocket = () => {
  const mockWebSocket = {
    readyState: 0 as number,
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onopen: null as any,
    onmessage: null as any,
    onclose: null as any,
    onerror: null as any,
  };

  const simulateOpen = () => {
    mockWebSocket.readyState = 1; // WebSocket.OPEN = 1
    if (mockWebSocket.onopen) mockWebSocket.onopen({} as Event);
    const openCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === "open"
    )?.[1];
    if (openCallback) openCallback({} as Event);
  };

  const simulateMessage = (data: any) => {
    if (mockWebSocket.onmessage) mockWebSocket.onmessage({ data } as MessageEvent);
    const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === "message"
    )?.[1];
    if (messageCallback) messageCallback({ data } as MessageEvent);
  };

  const simulateClose = () => {
    mockWebSocket.readyState = 3; // WebSocket.CLOSED = 3
    if (mockWebSocket.onclose) mockWebSocket.onclose({} as CloseEvent);
    const closeCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === "close"
    )?.[1];
    if (closeCallback) closeCallback({} as CloseEvent);
  };

  return {
    mockWebSocket,
    simulateOpen,
    simulateMessage,
    simulateClose,
  };
};

// Mock global WebSocket
const mockWebSocketClass = jest.fn();
global.WebSocket = mockWebSocketClass as any;

// Mock MMKV instances for testing
let mockChatsStorage: any;
let mockMessagesStorage: any;

// Test helper component
const TestComponent: React.FC<{
  initialChats?: Chat[];
  onMessageSent?: (chatId: string, message: Message) => void;
}> = ({ initialChats = [], onMessageSent }) => {
  const { setChats, addMessage, messages, currentChatId, setCurrentChat } = useMVPStore();

  React.useEffect(() => {
    if (initialChats.length > 0) {
      setChats(initialChats);
    }
  }, [initialChats, setChats]);

  const handleSendMessage = (chatId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId: "me",
      timestamp: new Date(),
      isOwn: true,
    };

    addMessage(chatId, newMessage);
    onMessageSent?.(chatId, newMessage);
  };

  return (
    <View testID="chat-list">
      {initialChats.map((chat) => (
        <TouchableOpacity
          key={chat.id}
          testID={`chat-${chat.id}`}
          onPress={() => setCurrentChat(chat.id)}
        >
          <Text testID={`chat-name-${chat.id}`}>{chat.name}</Text>
          <Text testID={`chat-last-message-${chat.id}`}>{chat.lastMessage}</Text>
        </TouchableOpacity>
      ))}

      {currentChatId && (
        <View testID="chat-screen">
          <ScrollView testID="messages">
            {messages[currentChatId]?.map((message) => (
              <View key={message.id} testID={`message-${message.id}`}>
                <Text testID={`message-text-${message.id}`}>{message.text}</Text>
                <Text testID={`message-sender-${message.id}`}>{message.senderId}</Text>
              </View>
            ))}
          </ScrollView>

          <TextInput
            testID="message-input"
            placeholder="Type a message..."
            onChangeText={(text: string) => {
              // Simulate typing
            }}
          />
          <TouchableOpacity
            testID="send-button"
            onPress={() => {
              const input = screen.getByTestId("message-input");
              const text = input.props.value || "";
              if (text.trim()) {
                handleSendMessage(currentChatId, text);
                // Clear input
                fireEvent.changeText(input, "");
              }
            }}
          >
            <Text>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

describe("Integration Tests: Store + Chat Service + MMKV", () => {
  let mockWebSocket: any;
  let simulateOpen: any;
  let simulateMessage: any;
  let simulateClose: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create fresh mock WebSocket
    const mock = createMockWebSocket();
    mockWebSocket = mock.mockWebSocket;
    simulateOpen = mock.simulateOpen;
    simulateMessage = mock.simulateMessage;
    simulateClose = mock.simulateClose;

    mockWebSocketClass.mockImplementation(() => mockWebSocket);

    // Create fresh MMKV mocks
    mockChatsStorage = {
      getString: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
    };

    mockMessagesStorage = {
      getString: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
    };

    // Mock MMKV constructor
    (MMKV as jest.MockedClass<typeof MMKV>).mockImplementation((options) => {
      if (options?.id === "chats") {
        return mockChatsStorage;
      } else if (options?.id === "messages") {
        return mockMessagesStorage;
      }
      return {
        getString: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        clearAll: jest.fn(),
      };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Full Send/Receive Cycle", () => {
    it("should complete end-to-end message flow", async () => {
      const testChats: Chat[] = [
        {
          id: "integration-chat-1",
          name: "Integration Test Chat",
          lastMessage: "Initial message",
          timestamp: new Date("2023-01-01T10:00:00Z"),
          unreadCount: 0,
        },
      ];

      const onMessageSent = jest.fn();

      render(<TestComponent initialChats={testChats} onMessageSent={onMessageSent} />);

      // Verify initial state
      expect(screen.getByTestId("chat-name-integration-chat-1")).toBeTruthy();
      expect(screen.getByTestId("chat-last-message-integration-chat-1")).toBeTruthy();

      // Select chat
      fireEvent.press(screen.getByTestId("chat-integration-chat-1"));

      // Verify chat screen is shown
      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Connect to WebSocket (simulated)
      simulateOpen();

      // Type and send message
      const input = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      fireEvent.changeText(input, "Hello from integration test");
      fireEvent.press(sendButton);

      // Verify message was added to store
      await waitFor(() => {
        expect(screen.getByTestId("message-text-Hello from integration test")).toBeTruthy();
        expect(screen.getByTestId("message-sender-me")).toBeTruthy();
      });

      // Verify callback was called
      expect(onMessageSent).toHaveBeenCalledWith(
        "integration-chat-1",
        expect.objectContaining({
          text: "Hello from integration test",
          senderId: "me",
          isOwn: true,
        })
      );

      // Verify MMKV persistence
      expect(mockMessagesStorage.set).toHaveBeenCalledWith(
        "messages_integration-chat-1",
        expect.stringContaining("Hello from integration test")
      );
    });

    it("should handle real-time message reception", async () => {
      const testChats: Chat[] = [
        {
          id: "realtime-chat-1",
          name: "Realtime Test Chat",
          lastMessage: "Waiting for messages",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      render(<TestComponent initialChats={testChats} />);

      // Select chat and connect
      fireEvent.press(screen.getByTestId("chat-realtime-chat-1"));
      simulateOpen();

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Simulate receiving a message via WebSocket
      const incomingMessage = {
        type: "message",
        id: "incoming-1",
        text: "Hello from remote user",
        senderId: "remote-user",
        timestamp: new Date().toISOString(),
        chatId: "realtime-chat-1",
      };

      simulateMessage(JSON.stringify(incomingMessage));

      // Verify message appears in UI
      await waitFor(() => {
        expect(screen.getByTestId("message-text-Hello from remote user")).toBeTruthy();
        expect(screen.getByTestId("message-sender-remote-user")).toBeTruthy();
      });

      // Verify message was persisted to MMKV
      expect(mockMessagesStorage.set).toHaveBeenCalledWith(
        "messages_realtime-chat-1",
        expect.stringContaining("Hello from remote user")
      );
    });

    it("should handle message history loading", async () => {
      const testChats: Chat[] = [
        {
          id: "history-chat-1",
          name: "History Test Chat",
          lastMessage: "Loading history...",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      render(<TestComponent initialChats={testChats} />);

      // Select chat and connect
      fireEvent.press(screen.getByTestId("chat-history-chat-1"));
      simulateOpen();

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Simulate receiving message history
      const historyData = {
        type: "history",
        messages: [
          {
            id: "history-1",
            text: "Historical message 1",
            senderId: "user1",
            timestamp: new Date("2023-01-01T09:00:00Z").toISOString(),
            chatId: "history-chat-1",
          },
          {
            id: "history-2",
            text: "Historical message 2",
            senderId: "user2",
            timestamp: new Date("2023-01-01T09:05:00Z").toISOString(),
            chatId: "history-chat-1",
          },
        ],
      };

      simulateMessage(JSON.stringify(historyData));

      // Verify all historical messages appear
      await waitFor(() => {
        expect(screen.getByTestId("message-text-Historical message 1")).toBeTruthy();
        expect(screen.getByTestId("message-text-Historical message 2")).toBeTruthy();
      });
    });
  });

  describe("Connection Management", () => {
    it("should handle WebSocket reconnection", async () => {
      const testChats: Chat[] = [
        {
          id: "reconnect-chat-1",
          name: "Reconnect Test Chat",
          lastMessage: "Testing reconnection",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      render(<TestComponent initialChats={testChats} />);

      // Select chat and connect
      fireEvent.press(screen.getByTestId("chat-reconnect-chat-1"));
      simulateOpen();

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Simulate connection loss
      simulateClose();

      // Should attempt reconnection after delay
      jest.advanceTimersByTime(1000);
      expect(mockWebSocketClass).toHaveBeenCalledTimes(2); // Initial + reconnect

      // Simulate successful reconnection
      simulateOpen();

      // Should be able to send messages after reconnection
      const input = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      fireEvent.changeText(input, "Message after reconnection");
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId("message-text-Message after reconnection")).toBeTruthy();
      });
    });

    it("should handle connection errors gracefully", async () => {
      const testChats: Chat[] = [
        {
          id: "error-chat-1",
          name: "Error Test Chat",
          lastMessage: "Testing error handling",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      render(<TestComponent initialChats={testChats} />);

      // Select chat
      fireEvent.press(screen.getByTestId("chat-error-chat-1"));

      // Should still show chat screen even with connection issues
      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Should be able to send messages (they'll be queued)
      const input = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      fireEvent.changeText(input, "Message during error");
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId("message-text-Message during error")).toBeTruthy();
      });
    });
  });

  describe("Data Persistence", () => {
    it("should persist and restore chats across sessions", async () => {
      const persistedChats: Chat[] = [
        {
          id: "persisted-chat-1",
          name: "Persisted Chat",
          lastMessage: "This should persist",
          timestamp: new Date("2023-01-01T10:00:00Z"),
          unreadCount: 2,
        },
      ];

      // Mock persisted data
      mockChatsStorage.getString.mockReturnValue(JSON.stringify(persistedChats));

      render(<TestComponent />);

      // Should load persisted chats
      await waitFor(() => {
        expect(screen.getByTestId("chat-name-persisted-chat-1")).toBeTruthy();
        expect(screen.getByTestId("chat-last-message-This should persist")).toBeTruthy();
      });

      // Add new chat
      const { setChats } = useMVPStore();
      const newChats = [
        ...persistedChats,
        {
          id: "new-chat-1",
          name: "New Chat",
          lastMessage: "New message",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      setChats(newChats);

      // Should persist new chats
      expect(mockChatsStorage.set).toHaveBeenCalledWith("chats", JSON.stringify(newChats));
    });

    it("should persist and restore messages across sessions", async () => {
      const testChats: Chat[] = [
        {
          id: "message-persist-chat-1",
          name: "Message Persistence Test",
          lastMessage: "Testing message persistence",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      const persistedMessages: Message[] = [
        {
          id: "persisted-msg-1",
          text: "Persisted message",
          senderId: "other-user",
          timestamp: new Date("2023-01-01T09:00:00Z"),
          isOwn: false,
        },
      ];

      // Mock persisted messages
      mockMessagesStorage.getString.mockReturnValue(JSON.stringify(persistedMessages));

      render(<TestComponent initialChats={testChats} />);

      // Select chat
      fireEvent.press(screen.getByTestId("chat-message-persist-chat-1"));

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Should load persisted messages
      expect(screen.getByTestId("message-text-Persisted message")).toBeTruthy();
      expect(screen.getByTestId("message-sender-other-user")).toBeTruthy();
    });

    it("should handle corrupted persisted data gracefully", async () => {
      // Mock corrupted data
      mockChatsStorage.getString.mockReturnValue("invalid json");
      mockMessagesStorage.getString.mockReturnValue("also invalid json");

      render(<TestComponent />);

      // Should fall back to default data and not crash
      await waitFor(() => {
        expect(screen.getByTestId("chat-list")).toBeTruthy();
      });

      // Should handle errors without crashing
      expect(() => {
        const { setChats } = useMVPStore();
        setChats([]);
      }).not.toThrow();
    });
  });

  describe("Performance Under Load", () => {
    it("should handle high-frequency message operations", async () => {
      const testChats: Chat[] = [
        {
          id: "performance-chat-1",
          name: "Performance Test Chat",
          lastMessage: "Testing performance",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      render(<TestComponent initialChats={testChats} />);

      // Select chat
      fireEvent.press(screen.getByTestId("chat-performance-chat-1"));

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Send multiple messages rapidly
      const input = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      for (let i = 0; i < 20; i++) {
        fireEvent.changeText(input, `Performance message ${i}`);
        fireEvent.press(sendButton);

        // Small delay to simulate realistic typing
        jest.advanceTimersByTime(10);
      }

      // Should handle all messages without crashing
      await waitFor(() => {
        expect(screen.getByTestId("message-text-Performance message 0")).toBeTruthy();
        expect(screen.getByTestId("message-text-Performance message 19")).toBeTruthy();
      });

      // Should persist all messages
      expect(mockMessagesStorage.set).toHaveBeenCalledTimes(20);
    });

    it("should handle large message datasets efficiently", async () => {
      const testChats: Chat[] = [
        {
          id: "large-dataset-chat-1",
          name: "Large Dataset Test",
          lastMessage: "Testing large dataset",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      // Simulate large message history
      const largeMessageSet: Message[] = Array.from({ length: 100 }, (_, i) => ({
        id: `large-msg-${i}`,
        text: `Large dataset message ${i}`,
        senderId: i % 2 === 0 ? "me" : "other",
        timestamp: new Date(Date.now() + i),
        isOwn: i % 2 === 0,
      }));

      mockMessagesStorage.getString.mockReturnValue(JSON.stringify(largeMessageSet));

      const startTime = performance.now();
      render(<TestComponent initialChats={testChats} />);

      fireEvent.press(screen.getByTestId("chat-large-dataset-chat-1"));

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Should render first and last messages
      expect(screen.getByTestId("message-text-Large dataset message 0")).toBeTruthy();
      expect(screen.getByTestId("message-text-Large dataset message 99")).toBeTruthy();
    });
  });

  describe("Error Recovery", () => {
    it("should recover from WebSocket connection failures", async () => {
      const testChats: Chat[] = [
        {
          id: "recovery-chat-1",
          name: "Recovery Test Chat",
          lastMessage: "Testing recovery",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      render(<TestComponent initialChats={testChats} />);

      // Select chat
      fireEvent.press(screen.getByTestId("chat-recovery-chat-1"));

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Simulate multiple connection failures
      for (let i = 0; i < 3; i++) {
        simulateClose();
        jest.advanceTimersByTime((i + 1) * 1000);
      }

      // Should attempt reconnection multiple times
      expect(mockWebSocketClass).toHaveBeenCalledTimes(4); // Initial + 3 reconnections

      // Eventually connect successfully
      simulateOpen();

      // Should work normally after recovery
      const input = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      fireEvent.changeText(input, "Message after recovery");
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId("message-text-Message after recovery")).toBeTruthy();
      });
    });

    it("should handle storage failures gracefully", async () => {
      const testChats: Chat[] = [
        {
          id: "storage-error-chat-1",
          name: "Storage Error Test",
          lastMessage: "Testing storage errors",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      // Mock storage failures
      mockMessagesStorage.set.mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

      render(<TestComponent initialChats={testChats} />);

      fireEvent.press(screen.getByTestId("chat-storage-error-chat-1"));

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Should still be able to send messages even if storage fails
      const input = screen.getByTestId("message-input");
      const sendButton = screen.getByTestId("send-button");

      fireEvent.changeText(input, "Message despite storage error");
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId("message-text-Message despite storage error")).toBeTruthy();
      });
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle simultaneous chat operations", async () => {
      const testChats: Chat[] = [
        {
          id: "concurrent-chat-1",
          name: "Concurrent Test Chat 1",
          lastMessage: "Concurrent test 1",
          timestamp: new Date(),
          unreadCount: 0,
        },
        {
          id: "concurrent-chat-2",
          name: "Concurrent Test Chat 2",
          lastMessage: "Concurrent test 2",
          timestamp: new Date(),
          unreadCount: 0,
        },
      ];

      render(<TestComponent initialChats={testChats} />);

      // Select first chat
      fireEvent.press(screen.getByTestId("chat-concurrent-chat-1"));

      await waitFor(() => {
        expect(screen.getByTestId("chat-screen")).toBeTruthy();
      });

      // Send message in first chat
      const input1 = screen.getByTestId("message-input");
      const sendButton1 = screen.getByTestId("send-button");

      fireEvent.changeText(input1, "Message in chat 1");
      fireEvent.press(sendButton1);

      // Switch to second chat
      fireEvent.press(screen.getByTestId("chat-concurrent-chat-2"));

      // Send message in second chat
      fireEvent.changeText(input1, "Message in chat 2");
      fireEvent.press(sendButton1);

      await waitFor(() => {
        expect(screen.getByTestId("message-text-Message in chat 1")).toBeTruthy();
        expect(screen.getByTestId("message-text-Message in chat 2")).toBeTruthy();
      });

      // Should persist messages for both chats
      expect(mockMessagesStorage.set).toHaveBeenCalledWith(
        "messages_concurrent-chat-1",
        expect.stringContaining("Message in chat 1")
      );
      expect(mockMessagesStorage.set).toHaveBeenCalledWith(
        "messages_concurrent-chat-2",
        expect.stringContaining("Message in chat 2")
      );
    });
  });
});
