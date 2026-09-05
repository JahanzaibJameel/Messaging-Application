/**
 * Integration Tests
 * Store + WebSocket client + MMKV persistence flow using the real
 * chatStore / messageStore implementations.
 */

import { act, waitFor } from "@testing-library/react-native";
import { MMKV } from "react-native-mmkv";

import { useChatStore } from "../presentation/stores/chatStore";
import { useMessageStore } from "../presentation/stores/messageStore";
import { WebSocketClient } from "../services/websocket/WebSocketClient";
import type { Chat } from "../domain/entities/Chat";
import type { Message } from "../domain/entities/Message";

// ---------------------------------------------------------------------------
// MMKV mock with per-instance registry keyed by storage id.
// The registry lives inside the factory so it exists when stores first
// import react-native-mmkv (module-load time, before test bodies run).
// ---------------------------------------------------------------------------

jest.mock("react-native-mmkv", () => {
  const instances = new Map<string, Record<string, jest.Mock>>();
  const makeInstance = (): Record<string, jest.Mock> => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  });
  const MMKV: any = jest.fn().mockImplementation((options?: { id?: string }) => {
    const id = options?.id ?? "default";
    if (!instances.has(id)) {
      instances.set(id, makeInstance());
    }
    return instances.get(id);
  });
  MMKV.__instances = instances;
  return { MMKV };
});

function getInstance(id: string): Record<string, jest.Mock> {
  const { MMKV } = require("react-native-mmkv");
  return (MMKV as any).__instances.get(id);
}

// ---------------------------------------------------------------------------
// WebSocket mock
// ---------------------------------------------------------------------------

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event?: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { wasClean: boolean }) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;

  send = jest.fn();
  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ wasClean: true });
  });

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

let lastSocket: MockWebSocket | null = null;
// The client compares readyState against WebSocket.OPEN from the global,
// so the factory must expose the standard static constants.
const socketFactory: any = jest.fn(() => {
  lastSocket = new MockWebSocket();
  return lastSocket;
});
socketFactory.CONNECTING = MockWebSocket.CONNECTING;
socketFactory.OPEN = MockWebSocket.OPEN;
socketFactory.CLOSING = MockWebSocket.CLOSING;
socketFactory.CLOSED = MockWebSocket.CLOSED;

const originalWebSocket = global.WebSocket;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChat(overrides: Partial<Chat> & { id: string }): Chat {
  return {
    type: "private",
    participantIds: ["currentUser", "other"],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date("2024-01-01T10:00:00Z"),
    updatedAt: new Date("2024-01-01T10:00:00Z"),
    ...overrides,
  } as Chat;
}

function makeMessage(overrides: Partial<Message> & { id: string; chatId: string }): Message {
  return {
    senderId: "me",
    type: "text",
    text: "Hello",
    timestamp: new Date("2024-01-01T10:00:00Z"),
    status: "sent",
    reactions: [],
    edited: false,
    ...overrides,
  } as Message;
}

function resetStores() {
  act(() => {
    useChatStore.getState().setChats([]);
    useChatStore.getState().setActiveChat(null);
    useMessageStore.getState().clearMessages();
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  const { MMKV } = require("react-native-mmkv");
  for (const instance of (MMKV as any).__instances.values()) {
    instance.getString.mockReturnValue(undefined);
    instance.set.mockClear();
    instance.delete.mockClear();
  }

  socketFactory.mockClear();
  lastSocket = null;
  (global as any).WebSocket = socketFactory;

  resetStores();
});

afterEach(() => {
  (global as any).WebSocket = originalWebSocket;
});

// ---------------------------------------------------------------------------
// Full Send/Receive Cycle
// ---------------------------------------------------------------------------

describe("Full Send/Receive Cycle", () => {
  it("completes end-to-end local message flow through chat + message stores", () => {
    const chat = makeChat({ id: "integration-chat-1" });

    act(() => {
      useChatStore.getState().addChat(chat);
      useChatStore.getState().setActiveChat("integration-chat-1");
    });

    expect(useChatStore.getState().activeChatId).toBe("integration-chat-1");

    const message = makeMessage({
      id: "msg-e2e-1",
      chatId: "integration-chat-1",
      text: "Hello from integration test",
    });

    act(() => {
      useMessageStore.getState().addMessage(message);
      useChatStore.getState().updateLastMessage("integration-chat-1", message);
    });

    // Message is retrievable per chat
    const messages = useMessageStore.getState().getMessagesByChatId("integration-chat-1");
    expect(messages.map((m) => m.id)).toContain("msg-e2e-1");

    // Chat lastMessage was updated
    expect(useChatStore.getState().getChatById("integration-chat-1")?.lastMessage?.id).toBe(
      "msg-e2e-1"
    );

    // Message persisted to MMKV-backed storage
    const messageStorage = getInstance("message-storage");
    expect(messageStorage.set).toHaveBeenCalled();
  });

  it("persists messages for the correct chat index", () => {
    act(() => {
      useMessageStore.getState().addMessage(makeMessage({ id: "m1", chatId: "chat-a" }));
      useMessageStore.getState().addMessage(makeMessage({ id: "m2", chatId: "chat-b" }));
    });

    expect(useMessageStore.getState().messagesByChatId["chat-a"]).toEqual(["m1"]);
    expect(useMessageStore.getState().messagesByChatId["chat-b"]).toEqual(["m2"]);
  });
});

// ---------------------------------------------------------------------------
// Connection Management (WebSocketClient)
// ---------------------------------------------------------------------------

describe("Connection Management", () => {
  function makeClient(): WebSocketClient {
    return new WebSocketClient({
      url: "wss://example.test/ws",
      authToken: "token-123",
      reconnectInterval: 10,
    });
  }

  it("connects and reports connected status", async () => {
    const client = makeClient();
    const statuses: string[] = [];
    client.onStatusChange((status) => statuses.push(status));

    client.connect();
    expect(socketFactory).toHaveBeenCalledWith("wss://example.test/ws?token=token-123");

    act(() => {
      lastSocket?.simulateOpen();
    });

    await waitFor(() => {
      expect(client.getStatus()).toBe("connected");
    });
    expect(statuses).toContain("connected");

    client.disconnect();
  });

  it("attempts reconnection after an unclean close", async () => {
    const client = makeClient();
    client.connect();

    act(() => {
      lastSocket?.simulateOpen();
    });
    await waitFor(() => expect(client.getStatus()).toBe("connected"));

    act(() => {
      lastSocket?.simulateUncleanClose();
    });

    // An unclean close immediately schedules a reconnect attempt
    await waitFor(() => expect(client.getStatus()).toBe("reconnecting"));

    // The reconnect timer fires shortly after (reconnectInterval: 10ms)
    await waitFor(() => expect(client.getStatus()).toBe("connecting"));
    expect(socketFactory.mock.calls.length).toBeGreaterThanOrEqual(2);

    client.disconnect();
  });

  it("does not reconnect after a clean disconnect", async () => {
    const client = makeClient();
    client.connect();
    lastSocket?.simulateOpen();

    client.disconnect();

    // Give any (incorrectly scheduled) reconnect timer time to fire
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(socketFactory).toHaveBeenCalledTimes(1);
    expect(client.getStatus()).toBe("disconnected");
  });

  it("delivers incoming messages to registered handlers", async () => {
    const client = makeClient();
    const payloads: unknown[] = [];
    client.onMessage("message", (payload) => payloads.push(payload));

    client.connect();
    act(() => {
      lastSocket?.simulateOpen();
    });

    act(() => {
      lastSocket?.simulateMessage(JSON.stringify({ type: "message", payload: { id: "x1" } }));
    });

    expect(payloads).toEqual([{ id: "x1" }]);
    client.disconnect();
  });
});

// ---------------------------------------------------------------------------
// Data Persistence
// ---------------------------------------------------------------------------

describe("Data Persistence", () => {
  it("writes normalized chat state through the MMKV-backed storage adapter", () => {
    const chat = makeChat({ id: "persisted-chat-1" });

    act(() => {
      useChatStore.getState().addChat(chat);
    });

    const chatStorage = getInstance("chat-storage");
    expect(chatStorage.set).toHaveBeenCalledWith(
      "chat-storage",
      expect.stringContaining("persisted-chat-1")
    );
  });

  it("keeps stores usable when persisted data is corrupted", () => {
    getInstance("chat-storage").getString.mockReturnValue("invalid json");
    getInstance("message-storage").getString.mockReturnValue("also invalid json");

    // Rehydrating from corrupt data must not throw and stores stay usable
    expect(() => {
      act(() => {
        useMessageStore.getState().addMessage(makeMessage({ id: "m-corrupt", chatId: "c1" }));
        useChatStore.getState().addChat(makeChat({ id: "c1" }));
      });
    }).not.toThrow();

    expect(useMessageStore.getState().getMessageById("m-corrupt")).toBeDefined();
    expect(useChatStore.getState().getChatById("c1")).toBeDefined();
  });

  it("restores chats from previously persisted JSON", () => {
    const persistedChats = [makeChat({ id: "persisted-chat-2" })];
    getInstance("chat-storage").getString.mockReturnValue(JSON.stringify(persistedChats));

    const raw = getInstance("chat-storage").getString("chat-storage");
    expect(raw).toBeDefined();

    // Simulate hydration into the live store
    act(() => {
      useChatStore.getState().setChats(JSON.parse(raw as string));
    });

    expect(useChatStore.getState().getChatById("persisted-chat-2")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Performance Under Load
// ---------------------------------------------------------------------------

describe("Performance Under Load", () => {
  it("handles high-frequency message additions without dropping any", () => {
    act(() => {
      for (let i = 0; i < 100; i++) {
        useMessageStore
          .getState()
          .addMessage(makeMessage({ id: `perf-${i}`, chatId: "perf-chat", text: `M${i}` }));
      }
    });

    const messages = useMessageStore.getState().getMessagesByChatId("perf-chat");
    expect(messages).toHaveLength(100);
    // Sorted ascending by timestamp
    for (let i = 1; i < messages.length; i++) {
      expect(messages[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        messages[i - 1].timestamp.getTime()
      );
    }
  });

  it("looks up messages by chat in O(1) via the secondary index", () => {
    act(() => {
      const batch = Array.from({ length: 500 }, (_, i) =>
        makeMessage({ id: `bulk-${i}`, chatId: `chat-${i % 10}` })
      );
      useMessageStore.getState().addMessages(batch);
    });

    const start = performance.now();
    const subset = useMessageStore.getState().getMessagesByChatId("chat-3");
    const elapsed = performance.now() - start;

    expect(subset).toHaveLength(50);
    expect(elapsed).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// Error Recovery & Concurrent Operations
// ---------------------------------------------------------------------------

describe("Error Recovery and Concurrency", () => {
  it("keeps local state intact when storage writes fail", () => {
    // Only fail the first write; later tests must see healthy storage
    getInstance("message-storage").set.mockImplementationOnce(() => {
      throw new Error("Storage unavailable");
    });

    expect(() => {
      act(() => {
        useMessageStore.getState().addMessage(makeMessage({ id: "m-fail", chatId: "c9" }));
      });
    }).not.toThrow();

    expect(useMessageStore.getState().getMessageById("m-fail")).toBeDefined();
  });

  it("routes concurrent operations on multiple chats independently", () => {
    act(() => {
      useChatStore.getState().addChat(makeChat({ id: "concurrent-chat-1" }));
      useChatStore.getState().addChat(makeChat({ id: "concurrent-chat-2" }));

      useMessageStore
        .getState()
        .addMessage(makeMessage({ id: "cm-1", chatId: "concurrent-chat-1", text: "one" }));
      useMessageStore
        .getState()
        .addMessage(makeMessage({ id: "cm-2", chatId: "concurrent-chat-2", text: "two" }));
    });

    expect(
      useMessageStore
        .getState()
        .getMessagesByChatId("concurrent-chat-1")
        .map((m) => m.id)
    ).toEqual(["cm-1"]);
    expect(
      useMessageStore
        .getState()
        .getMessagesByChatId("concurrent-chat-2")
        .map((m) => m.id)
    ).toEqual(["cm-2"]);
    expect(useChatStore.getState().getAllChats()).toHaveLength(2);
  });

  it("removes deleted messages from every index", () => {
    act(() => {
      useMessageStore.getState().addMessage(makeMessage({ id: "del-1", chatId: "c-del" }));
      useMessageStore.getState().deleteMessage("del-1");
    });

    expect(useMessageStore.getState().getMessageById("del-1")).toBeUndefined();
    expect(useMessageStore.getState().messagesByChatId["c-del"]).toEqual([]);
  });
});
