/**
 * SimpleChatService Tests
 * Comprehensive unit tests for WebSocket-based chat service
 * Covers connection, messaging, reconnection, error handling, and cleanup
 */

import { SimpleChatService, ChatMessage } from "../chatService";

// Mock WebSocket
const createMockWebSocket = () => {
  const mockWebSocket = {
    readyState: 0 as number, // WebSocket.CONNECTING = 0
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onopen: null as any,
    onmessage: null as any,
    onclose: null as any,
    onerror: null as any,
  };

  // Mock event simulation
  const simulateOpen = () => {
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

  const simulateError = (error: any) => {
    if (mockWebSocket.onerror) mockWebSocket.onerror(error);
    const errorCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === "error"
    )?.[1];
    if (errorCallback) errorCallback(error);
  };

  return {
    mockWebSocket,
    simulateOpen,
    simulateMessage,
    simulateClose,
    simulateError,
  };
};

// Mock global WebSocket
const mockWebSocketClass = jest.fn();
global.WebSocket = mockWebSocketClass as any;

describe("SimpleChatService", () => {
  let service: SimpleChatService;
  let mockWebSocket: any;
  let simulateOpen: any;
  let simulateMessage: any;
  let simulateClose: any;
  let simulateError: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const mock = createMockWebSocket();
    mockWebSocket = mock.mockWebSocket;
    simulateOpen = mock.simulateOpen;
    simulateMessage = mock.simulateMessage;
    simulateClose = mock.simulateClose;
    simulateError = mock.simulateError;

    mockWebSocketClass.mockImplementation(() => mockWebSocket);

    service = new SimpleChatService("ws://localhost:8080");
  });

  afterEach(() => {
    jest.useRealTimers();
    service.disconnect();
  });

  describe("Connection Management", () => {
    it("should create WebSocket with correct URL", () => {
      service.connect();
      expect(mockWebSocketClass).toHaveBeenCalledWith("ws://localhost:8080");
    });

    it("should set up event listeners on connect", () => {
      service.connect();
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith("open", expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith("close", expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("should report connected status after successful connection", () => {
      service.connect();
      expect(service.isConnected()).toBe(false);

      simulateOpen();
      expect(service.isConnected()).toBe(true);
    });

    it("should reset reconnect attempts on successful connection", () => {
      service.connect();
      simulateClose(); // First disconnect
      jest.advanceTimersByTime(1000);
      simulateClose(); // Second disconnect
      jest.advanceTimersByTime(2000);

      simulateOpen(); // Reconnect successfully
      expect(service.isConnected()).toBe(true);
    });

    it("should handle connection errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      service.connect();
      simulateError(new Error("Connection failed"));

      expect(consoleSpy).toHaveBeenCalledWith("WebSocket error:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should handle WebSocket constructor errors", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockWebSocketClass.mockImplementation(() => {
        throw new Error("WebSocket not supported");
      });

      expect(() => service.connect()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to connect WebSocket:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe("Message Handling", () => {
    beforeEach(() => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
    });

    it("should send messages when connected", () => {
      service.sendMessage("chat1", "Hello World");

      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("Hello World"));
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"message"'));
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"chatId":"chat1"'));
    });

    it("should not send messages when disconnected", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockWebSocket.readyState = WebSocket.CLOSED;

      service.sendMessage("chat1", "Hello World");

      expect(mockWebSocket.send).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("WebSocket not connected, message not sent");

      consoleSpy.mockRestore();
    });

    it("should handle incoming message events", () => {
      const callback = jest.fn();
      service.onMessage(callback);

      const messageData = {
        type: "message",
        id: "msg-1",
        text: "Hello",
        senderId: "user1",
        timestamp: new Date().toISOString(),
        chatId: "chat1",
      };

      simulateMessage(JSON.stringify(messageData));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "msg-1",
          text: "Hello",
          senderId: "user1",
          chatId: "chat1",
        })
      );
    });

    it("should handle incoming history events", () => {
      const callback = jest.fn();
      service.onMessage(callback);

      const historyData = {
        type: "history",
        messages: [
          {
            id: "msg-1",
            text: "Old message 1",
            senderId: "user1",
            timestamp: new Date().toISOString(),
            chatId: "chat1",
          },
          {
            id: "msg-2",
            text: "Old message 2",
            senderId: "user2",
            timestamp: new Date().toISOString(),
            chatId: "chat1",
          },
        ],
      };

      simulateMessage(JSON.stringify(historyData));

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: "msg-1", text: "Old message 1" })
      );
      expect(callback).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: "msg-2", text: "Old message 2" })
      );
    });

    it("should handle malformed message data gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const callback = jest.fn();
      service.onMessage(callback);

      simulateMessage("invalid json");
      simulateMessage('{"invalid": "structure"}');

      expect(callback).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it("should support multiple message callbacks", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.onMessage(callback1);
      service.onMessage(callback2);

      const messageData = {
        type: "message",
        id: "msg-1",
        text: "Hello",
        senderId: "user1",
        timestamp: new Date().toISOString(),
        chatId: "chat1",
      };

      simulateMessage(JSON.stringify(messageData));

      expect(callback1).toHaveBeenCalledWith(expect.any(Object));
      expect(callback2).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("Reconnection Logic", () => {
    beforeEach(() => {
      service.connect();
    });

    it("should attempt reconnection on disconnect", () => {
      simulateClose();

      expect(mockWebSocketClass).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);

      expect(mockWebSocketClass).toHaveBeenCalledTimes(2);
    });

    it("should use exponential backoff for reconnection", () => {
      // First disconnect
      simulateClose();
      jest.advanceTimersByTime(1000);
      expect(mockWebSocketClass).toHaveBeenCalledTimes(2);

      // Second disconnect
      simulateClose();
      jest.advanceTimersByTime(2000);
      expect(mockWebSocketClass).toHaveBeenCalledTimes(3);

      // Third disconnect
      simulateClose();
      jest.advanceTimersByTime(3000);
      expect(mockWebSocketClass).toHaveBeenCalledTimes(4);
    });

    it("should stop reconnection after max attempts", () => {
      // Simulate max reconnection attempts (5)
      for (let i = 0; i < 6; i++) {
        simulateClose();
        jest.advanceTimersByTime((i + 1) * 1000);
      }

      // Should have initial connection + 5 reconnection attempts
      expect(mockWebSocketClass).toHaveBeenCalledTimes(6);

      // No more reconnection attempts after max
      jest.advanceTimersByTime(10000);
      expect(mockWebSocketClass).toHaveBeenCalledTimes(6);
    });

    it("should request message history on connection", () => {
      service.connect();
      simulateOpen();

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"request_history"')
      );
    });
  });

  describe("Cleanup", () => {
    beforeEach(() => {
      service.connect();
    });

    it("should close WebSocket on disconnect", () => {
      service.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it("should clear WebSocket reference on disconnect", () => {
      service.disconnect();

      expect(service.isConnected()).toBe(false);
    });

    it("should clear message callbacks on disconnect", () => {
      const callback = jest.fn();
      service.onMessage(callback);
      service.disconnect();

      simulateMessage(
        JSON.stringify({
          type: "message",
          id: "msg-1",
          text: "Hello",
          senderId: "user1",
          timestamp: new Date().toISOString(),
          chatId: "chat1",
        })
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle disconnect when not connected", () => {
      service.disconnect();

      // Should not throw error
      expect(() => service.disconnect()).not.toThrow();
    });

    it("should handle disconnect when WebSocket is null", () => {
      service.disconnect();
      service.disconnect(); // Second disconnect

      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty message text", () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;

      service.sendMessage("chat1", "");

      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"text":""'));
    });

    it("should handle special characters in messages", () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;

      const specialText = "Special chars: 🎉\n\t\"{}[]'\\";
      service.sendMessage("chat1", specialText);

      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining(specialText));
    });

    it("should handle very long messages", () => {
      service.connect();
      mockWebSocket.readyState = WebSocket.OPEN;

      const longText = "A".repeat(10000);
      service.sendMessage("chat1", longText);

      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining(longText));
    });

    it("should handle rapid connect/disconnect cycles", () => {
      for (let i = 0; i < 10; i++) {
        service.connect();
        service.disconnect();
      }

      expect(mockWebSocketClass).toHaveBeenCalledTimes(10);
      expect(mockWebSocket.close).toHaveBeenCalledTimes(10);
    });

    it("should handle message callbacks that throw errors", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Callback error");
      });
      const normalCallback = jest.fn();

      service.onMessage(errorCallback);
      service.onMessage(normalCallback);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      simulateMessage(
        JSON.stringify({
          type: "message",
          id: "msg-1",
          text: "Hello",
          senderId: "user1",
          timestamp: new Date().toISOString(),
          chatId: "chat1",
        })
      );

      expect(normalCallback).toHaveBeenCalled();
      // Error should be caught and not crash the service
      expect(() => service.connect()).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("Type Safety", () => {
    it("should maintain correct ChatMessage interface", () => {
      const callback = jest.fn();
      service.onMessage(callback);

      const messageData = {
        type: "message",
        id: "msg-1",
        text: "Hello",
        senderId: "user1",
        timestamp: "2023-01-01T00:00:00.000Z",
        chatId: "chat1",
      };

      simulateMessage(JSON.stringify(messageData));

      const receivedMessage: ChatMessage = callback.mock.calls[0][0];

      expect(receivedMessage).toHaveProperty("id");
      expect(receivedMessage).toHaveProperty("text");
      expect(receivedMessage).toHaveProperty("senderId");
      expect(receivedMessage).toHaveProperty("timestamp");
      expect(receivedMessage).toHaveProperty("chatId");
      expect(receivedMessage.timestamp).toBeInstanceOf(Date);
    });
  });
});
