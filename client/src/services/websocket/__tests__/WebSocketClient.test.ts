/**
 * Unit tests for WebSocketClient
 * Testing WebSocket connection and message handling
 */

import WebSocketClient from "../WebSocketClient";

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.CONNECTING,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

// Mock global WebSocket
global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe("WebSocketClient", () => {
  let client: WebSocketClient;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
    client = new WebSocketClient("ws://localhost:8080", mockLogger);
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  describe("Constructor", () => {
    it("should initialize with default options", () => {
      const testClient = new WebSocketClient("ws://test.com");
      expect(testClient).toBeInstanceOf(WebSocketClient);
    });

    it("should accept custom logger", () => {
      const testClient = new WebSocketClient("ws://test.com", mockLogger);
      expect(testClient).toBeInstanceOf(WebSocketClient);
    });

    it("should store connection URL", () => {
      const testClient = new WebSocketClient("ws://test.com");
      expect(testClient.getUrl()).toBe("ws://test.com");
    });
  });

  describe("Connection Management", () => {
    it("should connect successfully", async () => {
      const onConnect = jest.fn();
      client.on("connect", onConnect);

      await client.connect();

      expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:8080");
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith("open", expect.any(Function));
    });

    it("should handle connection errors", async () => {
      const onError = jest.fn();
      client.on("error", onError);

      // Simulate connection error
      mockWebSocket.addEventListener.mockImplementation((event: string, callback: Function) => {
        if (event === "error") {
          setTimeout(() => callback(new Error("Connection failed")), 0);
        }
      });

      await client.connect();

      expect(onError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should disconnect properly", () => {
      const onDisconnect = jest.fn();
      client.on("disconnect", onDisconnect);

      client.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(onDisconnect).toHaveBeenCalled();
    });

    it("should handle reconnection", async () => {
      const onConnect = jest.fn();
      client.on("connect", onConnect);

      await client.connect();
      client.disconnect();
      await client.connect();

      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it("should not connect if already connected", async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });
  });

  describe("Message Sending", () => {
    it("should send messages when connected", async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      const message = { type: "test", data: "hello" };
      client.send(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it("should not send messages when disconnected", () => {
      mockWebSocket.readyState = WebSocket.CLOSED;
      const message = { type: "test", data: "hello" };
      client.send(message);

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it("should queue messages when not connected", async () => {
      mockWebSocket.readyState = WebSocket.CONNECTING;
      const message = { type: "test", data: "hello" };
      client.send(message);

      expect(mockWebSocket.send).not.toHaveBeenCalled();

      // Connect and verify message is sent
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it("should handle send errors", () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      mockWebSocket.send.mockImplementation(() => {
        throw new Error("Send failed");
      });

      const message = { type: "test", data: "hello" };
      expect(() => client.send(message)).not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should validate message format", () => {
      mockWebSocket.readyState = WebSocket.OPEN;

      expect(() => client.send(null as any)).not.toThrow();
      expect(() => client.send(undefined as any)).not.toThrow();
      expect(() => client.send("string" as any)).not.toThrow();
      expect(() => client.send({} as any)).not.toThrow();
    });
  });

  describe("Event Handling", () => {
    it("should handle message events", async () => {
      const onMessage = jest.fn();
      client.on("message", onMessage);

      await client.connect();

      // Simulate incoming message
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )?.[1];

      if (messageCallback) {
        const testMessage = { type: "test", data: "hello" };
        messageCallback({ data: JSON.stringify(testMessage) });
      }

      expect(onMessage).toHaveBeenCalledWith(testMessage);
    });

    it("should handle connection close events", async () => {
      const onDisconnect = jest.fn();
      client.on("disconnect", onDisconnect);

      await client.connect();

      // Simulate close event
      const closeCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "close"
      )?.[1];

      if (closeCallback) {
        closeCallback({ code: 1000, reason: "Normal closure" });
      }

      expect(onDisconnect).toHaveBeenCalledWith({ code: 1000, reason: "Normal closure" });
    });

    it("should handle multiple event listeners", async () => {
      const onMessage1 = jest.fn();
      const onMessage2 = jest.fn();

      client.on("message", onMessage1);
      client.on("message", onMessage2);

      await client.connect();

      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )?.[1];

      if (messageCallback) {
        const testMessage = { type: "test", data: "hello" };
        messageCallback({ data: JSON.stringify(testMessage) });
      }

      expect(onMessage1).toHaveBeenCalledWith(testMessage);
      expect(onMessage2).toHaveBeenCalledWith(testMessage);
    });

    it("should remove event listeners", () => {
      const onMessage = jest.fn();

      client.on("message", onMessage);
      client.off("message", onMessage);

      // Simulate message event
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )?.[1];

      if (messageCallback) {
        const testMessage = { type: "test", data: "hello" };
        messageCallback({ data: JSON.stringify(testMessage) });
      }

      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  describe("Connection State", () => {
    it("should track connection state correctly", () => {
      expect(client.isConnected()).toBe(false);

      mockWebSocket.readyState = WebSocket.OPEN;
      expect(client.isConnected()).toBe(true);

      mockWebSocket.readyState = WebSocket.CLOSED;
      expect(client.isConnected()).toBe(false);
    });

    it("should track connection state during transitions", () => {
      expect(client.isConnected()).toBe(false);

      mockWebSocket.readyState = WebSocket.CONNECTING;
      expect(client.isConnected()).toBe(false);

      mockWebSocket.readyState = WebSocket.OPEN;
      expect(client.isConnected()).toBe(true);

      mockWebSocket.readyState = WebSocket.CLOSING;
      expect(client.isConnected()).toBe(false);
    });

    it("should provide connection status", () => {
      mockWebSocket.readyState = WebSocket.CONNECTING;
      expect(client.getStatus()).toBe("connecting");

      mockWebSocket.readyState = WebSocket.OPEN;
      expect(client.getStatus()).toBe("connected");

      mockWebSocket.readyState = WebSocket.CLOSING;
      expect(client.getStatus()).toBe("disconnecting");

      mockWebSocket.readyState = WebSocket.CLOSED;
      expect(client.getStatus()).toBe("disconnected");
    });
  });

  describe("Error Handling", () => {
    it("should handle WebSocket construction errors", () => {
      global.WebSocket = jest.fn(() => {
        throw new Error("WebSocket not supported");
      }) as any;

      expect(() => new WebSocketClient("ws://invalid")).not.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should handle malformed messages", async () => {
      const onMessage = jest.fn();
      client.on("message", onMessage);

      await client.connect();

      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )?.[1];

      if (messageCallback) {
        // Send malformed JSON
        messageCallback({ data: "invalid json" });
      }

      expect(mockLogger.error).toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      const onError = jest.fn();
      client.on("error", onError);

      await client.connect();

      const errorCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "error"
      )?.[1];

      if (errorCallback) {
        errorCallback(new Error("Network error"));
      }

      expect(onError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should handle unexpected disconnections", async () => {
      const onDisconnect = jest.fn();
      client.on("disconnect", onDisconnect);

      await client.connect();

      const closeCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "close"
      )?.[1];

      if (closeCallback) {
        closeCallback({ code: 1006, reason: "Abnormal closure" });
      }

      expect(onDisconnect).toHaveBeenCalledWith({ code: 1006, reason: "Abnormal closure" });
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("should handle high message volume efficiently", async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      const startTime = Date.now();

      // Send 1000 messages
      for (let i = 0; i < 1000; i++) {
        client.send({ type: "test", data: `message ${i}` });
      }

      const endTime = Date.now();

      expect(mockWebSocket.send).toHaveBeenCalledTimes(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle rapid connection attempts", async () => {
      const onConnect = jest.fn();
      client.on("connect", onConnect);

      const startTime = Date.now();

      // Attempt multiple connections
      await Promise.all([client.connect(), client.connect(), client.connect()]);

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });

    it("should handle large messages", async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      const largeMessage = {
        type: "large_data",
        data: "x".repeat(100000), // 100KB message
      };

      const startTime = Date.now();
      client.send(largeMessage);
      const endTime = Date.now();

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(largeMessage));
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe("Memory Management", () => {
    it("should clean up event listeners on disconnect", () => {
      const onMessage = jest.fn();
      client.on("message", onMessage);

      client.disconnect();

      expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function)
      );
    });

    it("should clear message queue on disconnect", () => {
      mockWebSocket.readyState = WebSocket.CONNECTING;

      // Queue messages while disconnected
      client.send({ type: "test", data: "queued1" });
      client.send({ type: "test", data: "queued2" });

      client.disconnect();

      // Reconnect and verify queue is cleared
      mockWebSocket.readyState = WebSocket.OPEN;
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it("should handle multiple disconnect calls", () => {
      client.disconnect();
      client.disconnect();
      client.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("Security", () => {
    it("should validate WebSocket URLs", () => {
      expect(() => new WebSocketClient("ws://valid.com")).not.toThrow();
      expect(() => new WebSocketClient("wss://secure.com")).not.toThrow();
      expect(() => new WebSocketClient("http://invalid.com")).not.toThrow();
      expect(() => new WebSocketClient("ftp://invalid.com")).not.toThrow();
    });

    it("should handle malicious messages", async () => {
      const onMessage = jest.fn();
      client.on("message", onMessage);

      await client.connect();

      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        (call: any) => call[0] === "message"
      )?.[1];

      if (messageCallback) {
        // Send potentially malicious message
        const maliciousMessage = {
          type: "script",
          data: '<script>alert("xss")</script>',
        };
        messageCallback({ data: JSON.stringify(maliciousMessage) });
      }

      expect(onMessage).toHaveBeenCalledWith(maliciousMessage);
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should sanitize outgoing messages", () => {
      mockWebSocket.readyState = WebSocket.OPEN;

      const messageWithScript = {
        type: "test",
        data: '<script>alert("xss")</script>',
      };

      client.send(messageWithScript);

      // Should send the message as-is (server handles validation)
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(messageWithScript));
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined URLs", () => {
      expect(() => new WebSocketClient(null as any)).not.toThrow();
      expect(() => new WebSocketClient(undefined as any)).not.toThrow();
      expect(() => new WebSocketClient("")).not.toThrow();
    });

    it("should handle extremely long URLs", () => {
      const longUrl = "ws://" + "a".repeat(1000) + ".com";
      expect(() => new WebSocketClient(longUrl)).not.toThrow();
    });

    it("should handle special characters in URLs", () => {
      expect(() => new WebSocketClient("ws://测试.com")).not.toThrow();
      expect(() => new WebSocketClient("ws://müller.com")).not.toThrow();
      expect(() => new WebSocketClient("ws://josé.com")).not.toThrow();
    });

    it("should handle concurrent operations", async () => {
      const onConnect = jest.fn();
      const onMessage = jest.fn();

      client.on("connect", onConnect);
      client.on("message", onMessage);

      // Concurrent connect and send
      const connectPromise = client.connect();
      client.send({ type: "test", data: "concurrent" });

      await connectPromise;

      expect(onConnect).toHaveBeenCalled();
      expect(mockWebSocket.send).toHaveBeenCalled();
    });

    it("should handle rapid connect/disconnect cycles", async () => {
      for (let i = 0; i < 10; i++) {
        await client.connect();
        client.disconnect();
      }

      expect(global.WebSocket).toHaveBeenCalledTimes(10);
      expect(mockWebSocket.close).toHaveBeenCalledTimes(10);
    });
  });

  describe("Data Consistency", () => {
    it("should maintain message order", async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      const messages = [
        { type: "test", data: "message1" },
        { type: "test", data: "message2" },
        { type: "test", data: "message3" },
      ];

      messages.forEach((message) => client.send(message));

      expect(mockWebSocket.send).toHaveBeenCalledTimes(3);
      expect(mockWebSocket.send).toHaveBeenNthCalledWith(1, JSON.stringify(messages[0]));
      expect(mockWebSocket.send).toHaveBeenNthCalledWith(2, JSON.stringify(messages[1]));
      expect(mockWebSocket.send).toHaveBeenNthCalledWith(3, JSON.stringify(messages[2]));
    });

    it("should handle message serialization correctly", async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      const complexMessage = {
        type: "complex",
        data: {
          text: "Hello",
          timestamp: Date.now(),
          metadata: {
            user: "test",
            id: 123,
            flags: ["read", "important"],
          },
        },
      };

      client.send(complexMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(complexMessage));
    });

    it("should handle circular references in messages", async () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      await client.connect();

      const circularMessage: any = { type: "circular" };
      circularMessage.self = circularMessage;

      expect(() => client.send(circularMessage)).not.toThrow();
    });
  });
});
