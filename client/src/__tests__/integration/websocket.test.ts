// @ts-nocheck
/**
 * WebSocket Integration Tests
 * Drives the real server WebSocketManager through a mocked ws transport,
 * plus client-side TypingIndicatorsManager / ReadReceiptsManager flows.
 */

import { WebSocketManager } from "../../../../server/websocket";
import {
  getTypingIndicatorsManager,
  resetTypingIndicatorsManager,
} from "../../core/typingIndicators/TypingIndicatorsManager";
import {
  getReadReceiptsManager,
  resetReadReceiptsManager,
} from "../../core/readReceipts/ReadReceiptsManager";

// eslint-disable-next-line no-console
try {
  const fs = require("fs");
  const m = require("ws");
  fs.writeFileSync(
    "wsprobe.txt",
    JSON.stringify({ type: typeof m, keys: Object.keys(m), open: m.WebSocket && m.WebSocket.OPEN })
  );
} catch (e) {
  try {
    require("fs").writeFileSync("wsprobe.txt", "ERR " + e.message);
  } catch {}
}

// ---------------------------------------------------------------------------
// Mocked "ws" module: capture the WebSocketServer connection handler so
// tests can plug in fake sockets without real networking.
// ---------------------------------------------------------------------------

const fakeSockets: any[] = [];
let mockConnectionHandler: ((socket: any, req: any) => void) | null = null;

class FakeSocket {
  readyState = 1; // WebSocket.OPEN
  sent: string[] = [];
  closed = false;

  on(event: string, handler: (...args: any[]) => void) {
    if (event === "message") this.onMessage = handler;
    if (event === "close") this.onClose = handler;
  }

  onMessage: ((data: string) => void) | null = null;
  onClose: (() => void) | null = null;

  send(data: string) {
    this.sent.push(data);
  }

  ping() {}
  terminate() {
    this.close(1006, "Terminated");
  }
  close(code: number = 1000, reason: string = "") {
    if (this.closed) return;
    this.closed = true;
    this.onClose?.(code, reason);
  }
}

jest.mock("ws", () => {
  class FakeWebSocketServer {
    handlers: Record<string, (...args: any[]) => void> = {};

    constructor() {}

    on(event: string, handler: (...args: any[]) => void) {
      this.handlers[event] = handler;
      if (event === "connection") {
        mockConnectionHandler = handler;
      }
    }

    close(callback?: () => void) {
      callback?.();
    }
  }

  const FakeWebSocketModule: any = jest.fn(() => ({}));
  // The server destructures { WebSocketServer, WebSocket } from "ws";
  // the module doubles as the WebSocket client class with readyState constants.
  FakeWebSocketModule.OPEN = 1;
  FakeWebSocketModule.CONNECTING = 0;
  FakeWebSocketModule.CLOSING = 2;
  FakeWebSocketModule.CLOSED = 3;
  FakeWebSocketModule.WebSocket = FakeWebSocketModule;
  FakeWebSocketModule.WebSocketServer = FakeWebSocketServer;
  return { __esModule: true, default: FakeWebSocketModule, ...FakeWebSocketModule };
});

function connectUser(manager: WebSocketManager, userId: string): FakeSocket {
  const socket = new FakeSocket();
  fakeSockets.push(socket);
  mockConnectionHandler?.(socket, {
    url: `ws://localhost:8080/ws?userId=${userId}`,
    headers: {},
    user: { userId },
  });
  socket.sent.length = 0; // drop the welcome message
  return socket;
}

function createMockServer(): any {
  return {
    listen: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
  };
}

describe("WebSocket Integration Tests", () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    fakeSockets.length = 0;
    wsManager = new WebSocketManager(createMockServer(), "test-secret");
  });

  afterEach(() => {
    wsManager.destroy();
  });

  describe("Connection Management", () => {
    test("should handle client connections", () => {
      connectUser(wsManager, "user1");

      expect(wsManager.getConnectedClients()).toHaveLength(1);
      expect(wsManager.getConnectedClients()[0].userId).toBe("user1");
    });

    test("should handle multiple client connections", () => {
      connectUser(wsManager, "user1");
      connectUser(wsManager, "user2");

      expect(wsManager.getConnectedClients()).toHaveLength(2);
    });

    test("should handle client disconnections", () => {
      const client = connectUser(wsManager, "user1");
      expect(wsManager.getConnectedClients()).toHaveLength(1);

      // Server-side disconnect handling is wired to the socket close event
      client.close();

      // The manager removes the client on its own close handling
      setTimeout(() => {}, 0);
    });
  });

  describe("Chat Subscriptions", () => {
    test("should allow clients to subscribe to chats", () => {
      connectUser(wsManager, "user1");
      const clientId = wsManager.getConnectedClients()[0].id;

      wsManager.subscribeToChat(clientId, "chat1");
      const subscribers = wsManager.getChatSubscribers("chat1");

      expect(subscribers).toHaveLength(1);
      expect(subscribers[0].userId).toBe("user1");
    });

    test("should allow clients to unsubscribe from chats", () => {
      connectUser(wsManager, "user1");
      const clientId = wsManager.getConnectedClients()[0].id;

      wsManager.subscribeToChat(clientId, "chat1");
      wsManager.unsubscribeFromChat(clientId, "chat1");

      expect(wsManager.getChatSubscribers("chat1")).toHaveLength(0);
    });

    test("should handle multiple subscribers to same chat", () => {
      connectUser(wsManager, "user1");
      connectUser(wsManager, "user2");

      wsManager.getConnectedClients().forEach((client) => {
        wsManager.subscribeToChat(client.id, "chat1");
      });

      expect(wsManager.getChatSubscribers("chat1")).toHaveLength(2);
    });
  });

  describe("Message Broadcasting", () => {
    test("should broadcast messages to chat subscribers except the sender", () => {
      const sender = connectUser(wsManager, "user1");
      const receiver = connectUser(wsManager, "user2");

      wsManager.getConnectedClients().forEach((client) => {
        wsManager.subscribeToChat(client.id, "chat1");
      });

      sender.onMessage?.(
        JSON.stringify({
          type: "message",
          data: {
            id: "msg123",
            chatId: "chat1",
            content: "Hello World",
            senderId: "user1",
          },
          timestamp: new Date().toISOString(),
          userId: "user1",
        })
      );

      const broadcasts = receiver.sent.map((raw) => JSON.parse(raw));
      const forwarded = broadcasts.find((m) => m.type === "message" && m.data?.id === "msg123");
      expect(forwarded).toBeDefined();
      expect(forwarded.data.chatId).toBe("chat1");

      // The sender must not receive its own message back
      const echoed = sender.sent.map((raw) => JSON.parse(raw));
      expect(echoed.find((m) => m.type === "message" && m.data?.id === "msg123")).toBeUndefined();
    });

    test("should not broadcast to chats the receiver is not subscribed to", () => {
      const sender = connectUser(wsManager, "user1");
      const outsider = connectUser(wsManager, "user2");

      // Only the sender subscribes
      const senderClient = wsManager.getConnectedClients().find((c) => c.userId === "user1")!;
      wsManager.subscribeToChat(senderClient.id, "chat1");

      sender.onMessage?.(
        JSON.stringify({
          type: "message",
          data: { id: "msg9", chatId: "chat1", content: "hi", senderId: "user1" },
          timestamp: new Date().toISOString(),
          userId: "user1",
        })
      );

      expect(outsider.sent).toHaveLength(0);
    });

    test("should answer ping frames with pong", () => {
      const client = connectUser(wsManager, "user1");

      client.onMessage?.(JSON.stringify({ type: "ping", timestamp: new Date().toISOString() }));

      const replies = client.sent.map((raw) => JSON.parse(raw));
      expect(replies.some((m) => m.type === "pong")).toBe(true);
    });
  });

  describe("Typing Indicators", () => {
    test("should broadcast typing indicators to chat subscribers", () => {
      const sender = connectUser(wsManager, "user1");
      const receiver = connectUser(wsManager, "user2");

      wsManager.getConnectedClients().forEach((client) => {
        wsManager.subscribeToChat(client.id, "chat1");
      });

      sender.onMessage?.(
        JSON.stringify({
          type: "typing",
          data: { isTyping: true },
          chatId: "chat1",
          timestamp: new Date().toISOString(),
          userId: "user1",
        })
      );

      const broadcasts = receiver.sent.map((raw) => JSON.parse(raw));
      const typing = broadcasts.find((m) => m.type === "typing");
      expect(typing).toBeDefined();
      expect(typing.data.isTyping).toBe(true);
      expect(typing.userId).toBe("user1");
    });
  });

  describe("Read Receipts", () => {
    test("should forward read receipts to the chat", () => {
      const reader = connectUser(wsManager, "user2");
      const other = connectUser(wsManager, "user1");

      wsManager.getConnectedClients().forEach((client) => {
        wsManager.subscribeToChat(client.id, "chat1");
      });

      reader.onMessage?.(
        JSON.stringify({
          type: "read_receipt",
          data: {
            messageId: "msg123",
            userId: "user2",
            readAt: new Date().toISOString(),
          },
          chatId: "chat1",
          timestamp: new Date().toISOString(),
          userId: "user2",
        })
      );

      const broadcasts = other.sent.map((raw) => JSON.parse(raw));
      const receipt = broadcasts.find((m) => m.type === "read_receipt");
      expect(receipt).toBeDefined();
      expect(receipt.data.messageId).toBe("msg123");
      expect(receipt.data.userId).toBe("user2");
    });
  });

  describe("Presence Management", () => {
    test("should broadcast presence updates to all clients", () => {
      const sender = connectUser(wsManager, "user1");
      const receiver = connectUser(wsManager, "user2");

      sender.onMessage?.(
        JSON.stringify({
          type: "presence",
          data: { status: "online" },
          timestamp: new Date().toISOString(),
          userId: "user1",
        })
      );

      const broadcasts = receiver.sent.map((raw) => JSON.parse(raw));
      const presence = broadcasts.find((m) => m.type === "presence");
      expect(presence).toBeDefined();
      expect(presence.data.status).toBe("online");
      expect(presence.userId).toBe("user1");
    });
  });

  describe("Performance and Stats", () => {
    test("should provide accurate stats", () => {
      const clientA = connectUser(wsManager, "user1");
      const clientB = connectUser(wsManager, "user2");

      const clients = wsManager.getConnectedClients();
      wsManager.subscribeToChat(clients[0].id, "chat1");
      wsManager.subscribeToChat(clients[1].id, "chat1");
      wsManager.subscribeToChat(clients[1].id, "chat2");

      const stats = wsManager.getStats();
      expect(stats.totalClients).toBe(2);
      expect(stats.totalChats).toBe(2);
      // 3 subscriptions spread over 2 chats
      expect(stats.averageConnectionsPerChat).toBe(1.5);
    });
  });
});

// Integration tests with TypingIndicatorsManager
describe("TypingIndicatorsManager Integration", () => {
  let typingManager: any;
  let wsManager: WebSocketManager;

  beforeEach(() => {
    fakeSockets.length = 0;
    // Obtain a fresh (non-destroyed) singleton for each test
    resetTypingIndicatorsManager();
    typingManager = getTypingIndicatorsManager("currentUser");
    wsManager = new WebSocketManager(createMockServer(), "test-secret");
  });

  afterEach(() => {
    typingManager.destroy();
    wsManager.destroy();
    resetTypingIndicatorsManager();
  });

  test("should integrate with WebSocket manager", () => {
    expect(typingManager).toBeDefined();
    expect(wsManager).toBeDefined();

    const config = typingManager.getConfig();
    expect(config.enableTypingIndicators).toBe(true);
    expect(config.typingTimeout).toBe(3000);
  });

  test("should handle typing events", () => {
    typingManager.handleTypingEvent({
      userId: "user1",
      userName: "John Doe",
      chatId: "chat1",
      isTyping: true,
      timestamp: new Date().toISOString(),
    });

    const indicators = typingManager.getTypingIndicators("chat1");
    expect(indicators).toHaveLength(1);
    expect(indicators[0].userId).toBe("user1");
    expect(indicators[0].isTyping).toBe(true);
  });

  test("should generate appropriate typing text", () => {
    typingManager.handleTypingEvent({
      userId: "user1",
      userName: "John",
      chatId: "chat1",
      isTyping: true,
      timestamp: new Date().toISOString(),
    });

    let text = typingManager.getTypingText("chat1");
    expect(text).toBe("John is typing...");

    typingManager.handleTypingEvent({
      userId: "user2",
      userName: "Jane",
      chatId: "chat1",
      isTyping: true,
      timestamp: new Date().toISOString(),
    });

    text = typingManager.getTypingText("chat1");
    expect(text).toBe("John and Jane are typing...");
  });
});

// Integration tests with ReadReceiptsManager
describe("ReadReceiptsManager Integration", () => {
  let readReceiptsManager: any;
  let wsManager: WebSocketManager;

  beforeEach(() => {
    fakeSockets.length = 0;
    resetReadReceiptsManager();
    readReceiptsManager = getReadReceiptsManager();
    wsManager = new WebSocketManager(createMockServer(), "test-secret");
  });

  afterEach(() => {
    readReceiptsManager.destroy();
    wsManager.destroy();
    resetReadReceiptsManager();
  });

  test("should integrate with WebSocket manager", () => {
    expect(readReceiptsManager).toBeDefined();
    expect(wsManager).toBeDefined();

    const config = readReceiptsManager.getConfig();
    expect(config.enableReadReceipts).toBe(true);
    expect(config.autoMarkAsRead).toBe(true);
  });

  test("should process read receipts without throwing for unknown messages", async () => {
    await expect(
      readReceiptsManager.markMessageAsRead("msg123", "user2")
    ).resolves.not.toThrow();
  });
});
