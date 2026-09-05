/**
 * Unit tests for WebSocketClient
 * Connection lifecycle, reconnection, heartbeat and message routing
 */

import { WebSocketClient } from "../WebSocketClient";

// Mock store side effects (toasts) triggered on connect/disconnect
jest.mock("../../../presentation/stores", () => ({
  useUIStore: {
    getState: () => ({
      showToast: jest.fn(),
    }),
  },
  useAuthStore: {
    getState: () => ({ currentUser: null }),
  },
}));

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { wasClean: boolean }) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;

  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ wasClean: true });
  });

  constructor(url: string) {
    this.url = url;
    instances.push(this);
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }

  simulateUncleanClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ wasClean: false });
  }
}

const instances: MockWebSocket[] = [];
const originalWebSocket = global.WebSocket;

describe("WebSocketClient", () => {
  let socketFactory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    instances.length = 0;
    // The client compares readyState against WebSocket.OPEN from the global,
    // so the factory itself must expose the standard static constants.
    const factory: any = jest.fn((url: string) => new MockWebSocket(url));
    factory.CONNECTING = MockWebSocket.CONNECTING;
    factory.OPEN = MockWebSocket.OPEN;
    factory.CLOSING = MockWebSocket.CLOSING;
    factory.CLOSED = MockWebSocket.CLOSED;
    socketFactory = factory;
    (global as any).WebSocket = socketFactory;
  });

  afterEach(() => {
    jest.useRealTimers();
    (global as any).WebSocket = originalWebSocket;
  });

  function lastSocket(): MockWebSocket {
    return instances[instances.length - 1];
  }

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  describe("Constructor", () => {
    it("initializes in disconnected state", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      expect(client.getStatus()).toBe("disconnected");
      expect(client.isConnected()).toBe(false);
    });

    it("applies default configuration values", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });

      client.connect();
      expect(client.getStatus()).toBe("connecting");

      client.disconnect();
    });
  });

  // -------------------------------------------------------------------------
  // Connection management
  // -------------------------------------------------------------------------

  describe("Connection Management", () => {
    it("connects successfully and reports connected status", async () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      client.connect();

      expect(socketFactory).toHaveBeenCalledWith("ws://localhost:8080");

      lastSocket().simulateOpen();

      await Promise.resolve();
      expect(client.getStatus()).toBe("connected");
      expect(client.isConnected()).toBe(true);

      client.disconnect();
    });

    it("appends the auth token to the connection URL", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080", authToken: "tok-1" });
      client.connect();

      expect(socketFactory).toHaveBeenCalledWith("ws://localhost:8080?token=tok-1");
      client.disconnect();
    });

    it("does not open a second socket while already connected", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      client.connect();
      lastSocket().simulateOpen();

      client.connect();
      expect(socketFactory).toHaveBeenCalledTimes(1);

      client.disconnect();
    });

    it("disconnects cleanly without scheduling reconnects", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      client.connect();
      client.disconnect();

      jest.advanceTimersByTime(15000);

      expect(socketFactory).toHaveBeenCalledTimes(1);
      expect(client.getStatus()).toBe("disconnected");
    });
  });

  // -------------------------------------------------------------------------
  // Status notifications
  // -------------------------------------------------------------------------

  describe("Status notifications", () => {
    it("immediately notifies subscribers with the current status", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      const seen: string[] = [];

      client.onStatusChange((status) => seen.push(status));

      expect(seen).toEqual(["disconnected"]);
    });

    it("broadcasts status transitions", async () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      const seen: string[] = [];
      client.onStatusChange((status) => seen.push(status));

      client.connect();
      lastSocket().simulateOpen();

      await Promise.resolve();
      expect(seen).toContain("connecting");
      expect(seen).toContain("connected");

      client.disconnect();
      expect(seen).toContain("disconnected");
    });
  });

  // -------------------------------------------------------------------------
  // Reconnection
  // -------------------------------------------------------------------------

  describe("Reconnection", () => {
    it("schedules a reconnect after an unclean close", async () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080", reconnectInterval: 1000 });
      client.connect();
      lastSocket().simulateOpen();
      await Promise.resolve();

      lastSocket().simulateUncleanClose();

      jest.advanceTimersByTime(1100);

      expect(socketFactory).toHaveBeenCalledTimes(2);
      client.disconnect();
    });

    it("stops reconnecting after maxReconnectAttempts", async () => {
      const client = new WebSocketClient({
        url: "ws://localhost:8080",
        reconnectInterval: 10,
        maxReconnectAttempts: 2,
      });

      client.connect();

      for (let attempt = 0; attempt < 5; attempt++) {
        lastSocket().simulateUncleanClose();
        await Promise.resolve();
        await Promise.resolve();
        jest.advanceTimersByTime(50);
        if (!instances.length || instances.length >= 3) break;
      }

      // Initial + 2 attempts, no further sockets
      expect(instances.length).toBe(3);

      const statusesAfterMax: string[] = [];
      client.onStatusChange((status) => statusesAfterMax.push(status));
      jest.advanceTimersByTime(60000);
      expect(instances.length).toBe(3);
      expect(statusesAfterMax).not.toContain("reconnecting");
      client.disconnect();
    });
  });

  // -------------------------------------------------------------------------
  // Messaging
  // -------------------------------------------------------------------------

  describe("Messaging", () => {
    it("routes incoming messages to registered handlers by type", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      const payloads: unknown[] = [];

      client.onMessage("chat_event", (payload) => payloads.push(payload));

      client.connect();
      lastSocket().simulateOpen();
      lastSocket().simulateMessage(JSON.stringify({ type: "chat_event", payload: { a: 1 } }));

      expect(payloads).toEqual([{ a: 1 }]);
      client.disconnect();
    });

    it("ignores pong frames and malformed JSON", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      const handler = jest.fn();
      client.onMessage("anything", handler);

      client.connect();
      lastSocket().simulateOpen();
      expect(() => {
        lastSocket().simulateMessage(JSON.stringify({ type: "pong", payload: {} }));
        lastSocket().simulateMessage("not-json{");
      }).not.toThrow();

      expect(handler).not.toHaveBeenCalled();
      client.disconnect();
    });

    it("supports unsubscribing handlers", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      const handler = jest.fn();

      const unsubscribe = client.onMessage("evt", handler);
      unsubscribe();

      client.connect();
      lastSocket().simulateOpen();
      lastSocket().simulateMessage(JSON.stringify({ type: "evt", payload: {} }));

      expect(handler).not.toHaveBeenCalled();
      client.disconnect();
    });

    it("returns false when sending while disconnected", () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });

      const result = client.send({
        type: "ping",
        payload: {},
        timestamp: new Date().toISOString(),
      });

      expect(result).toBe(false);
    });

    it("serializes and sends messages while connected", async () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080" });
      client.connect();
      lastSocket().simulateOpen();
      await Promise.resolve();

      const result = client.send({ type: "greet", payload: { hi: true }, timestamp: "t" });

      expect(result).toBe(true);
      expect(lastSocket().send).toHaveBeenCalledWith(
        JSON.stringify({ type: "greet", payload: { hi: true }, timestamp: "t" })
      );
      client.disconnect();
    });
  });

  // -------------------------------------------------------------------------
  // Heartbeat
  // -------------------------------------------------------------------------

  describe("Heartbeat", () => {
    it("sends ping frames at the configured interval", async () => {
      const client = new WebSocketClient({
        url: "ws://localhost:8080",
        heartbeatInterval: 1000,
      });

      client.connect();
      lastSocket().simulateOpen();
      await Promise.resolve();

      jest.advanceTimersByTime(3500);

      const sentTypes = lastSocket().send.mock.calls.map(([raw]) => JSON.parse(raw as string).type);
      expect(sentTypes.filter((t) => t === "ping")).toHaveLength(3);

      client.disconnect();
    });

    it("stops the heartbeat after disconnect", async () => {
      const client = new WebSocketClient({
        url: "ws://localhost:8080",
        heartbeatInterval: 1000,
      });

      client.connect();
      lastSocket().simulateOpen();
      await Promise.resolve();
      client.disconnect();

      const sendCalls = lastSocket().send.mock.calls.length;
      jest.advanceTimersByTime(5000);

      expect(lastSocket().send.mock.calls.length).toBe(sendCalls);
    });
  });

  // -------------------------------------------------------------------------
  // Auth token updates
  // -------------------------------------------------------------------------

  describe("Auth token updates", () => {
    it("reconnects with the new token when currently connected", async () => {
      const client = new WebSocketClient({ url: "ws://localhost:8080", authToken: "old" });
      client.connect();
      const originalSocket = lastSocket();
      originalSocket.simulateOpen();
      await Promise.resolve();

      client.updateAuthToken("new");

      // The original socket was closed and a new connection was opened
      // with the updated token appended to the URL.
      expect(originalSocket.close).toHaveBeenCalled();
      expect(socketFactory).toHaveBeenLastCalledWith("ws://localhost:8080?token=new");
      expect(client.getStatus()).toBe("connecting");
      client.disconnect();
    });
  });
});
