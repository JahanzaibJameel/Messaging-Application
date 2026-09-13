/**
 * Unit tests for syncStore
 */

import { useSyncStore } from "../syncStore";

// Mock the secureStorageAdapter
jest.mock("@/lib/secureStorageAdapter", () => {
  const cache = new Map<string, string>();
  return {
    createSecureStorageAdapterWithKeys: jest.fn(() => ({
      getItem: (name: string) => cache.get(name) ?? null,
      setItem: (name: string, value: string) => {
        cache.set(name, value);
      },
      removeItem: (name: string) => {
        cache.delete(name);
      },
    })),
  };
});

const initialState = {
  status: "idle" as const,
  lastSyncAt: null,
  pendingMessages: [],
  failedMessages: [],
  error: null,
};

describe("syncStore", () => {
  beforeEach(() => {
    useSyncStore.setState(initialState);
  });

  it("initializes with correct default state", () => {
    const state = useSyncStore.getState();
    expect(state.status).toBe("idle");
    expect(state.lastSyncAt).toBeNull();
    expect(state.pendingMessages).toEqual([]);
    expect(state.failedMessages).toEqual([]);
    expect(state.error).toBeNull();
  });

  describe("setStatus", () => {
    it("updates sync status", () => {
      useSyncStore.getState().setStatus("syncing");
      expect(useSyncStore.getState().status).toBe("syncing");

      useSyncStore.getState().setStatus("error");
      expect(useSyncStore.getState().status).toBe("error");

      useSyncStore.getState().setStatus("offline");
      expect(useSyncStore.getState().status).toBe("offline");
    });
  });

  describe("setLastSync", () => {
    it("updates last sync timestamp", () => {
      const timestamp = "2024-01-01T12:00:00Z";
      useSyncStore.getState().setLastSync(timestamp);
      expect(useSyncStore.getState().lastSyncAt).toBe(timestamp);
    });
  });

  describe("queueMessage", () => {
    it("adds a message to the pending queue", () => {
      useSyncStore.getState().queueMessage("msg-1", "chat-1");

      const pending = useSyncStore.getState().pendingMessages;
      expect(pending).toHaveLength(1);
      expect(pending[0].messageId).toBe("msg-1");
      expect(pending[0].chatId).toBe("chat-1");
      expect(pending[0].retryCount).toBe(0);
      expect(pending[0].priority).toBe("normal");
    });

    it("does not add duplicate messages", () => {
      useSyncStore.getState().queueMessage("msg-1", "chat-1");
      useSyncStore.getState().queueMessage("msg-1", "chat-1");

      expect(useSyncStore.getState().pendingMessages).toHaveLength(1);
    });

    it("adds multiple different messages", () => {
      useSyncStore.getState().queueMessage("msg-1", "chat-1");
      useSyncStore.getState().queueMessage("msg-2", "chat-2");

      const pending = useSyncStore.getState().pendingMessages;
      expect(pending).toHaveLength(2);
    });
  });

  describe("removeFromQueue", () => {
    it("removes a message from the pending queue", () => {
      useSyncStore.getState().queueMessage("msg-1", "chat-1");
      useSyncStore.getState().queueMessage("msg-2", "chat-2");

      useSyncStore.getState().removeFromQueue("msg-1");

      const pending = useSyncStore.getState().pendingMessages;
      expect(pending).toHaveLength(1);
      expect(pending[0].messageId).toBe("msg-2");
    });
  });

  describe("markAsFailed", () => {
    it("moves a message from pending to failed", () => {
      useSyncStore.getState().queueMessage("msg-1", "chat-1");

      useSyncStore.getState().markAsFailed("msg-1");

      expect(useSyncStore.getState().pendingMessages).toHaveLength(0);
      expect(useSyncStore.getState().failedMessages).toHaveLength(1);
      expect(useSyncStore.getState().failedMessages[0].messageId).toBe("msg-1");
    });
  });

  describe("retryMessage", () => {
    it("moves a failed message back to pending with reset retry count", () => {
      useSyncStore.getState().queueMessage("msg-1", "chat-1");
      useSyncStore.getState().markAsFailed("msg-1");

      // Modify the failed message to have a retry count
      useSyncStore.setState({
        failedMessages: [{ ...useSyncStore.getState().failedMessages[0], retryCount: 3 }],
      });

      useSyncStore.getState().retryMessage("msg-1");

      expect(useSyncStore.getState().failedMessages).toHaveLength(0);
      expect(useSyncStore.getState().pendingMessages).toHaveLength(1);
      expect(useSyncStore.getState().pendingMessages[0].retryCount).toBe(0);
    });
  });

  describe("clearFailed", () => {
    it("clears all failed messages", () => {
      useSyncStore.getState().queueMessage("msg-1", "chat-1");
      useSyncStore.getState().markAsFailed("msg-1");
      useSyncStore.getState().queueMessage("msg-2", "chat-2");
      useSyncStore.getState().markAsFailed("msg-2");

      useSyncStore.getState().clearFailed();

      expect(useSyncStore.getState().failedMessages).toEqual([]);
    });
  });

  describe("setError", () => {
    it("sets the error message", () => {
      useSyncStore.getState().setError("Sync failed");
      expect(useSyncStore.getState().error).toBe("Sync failed");

      useSyncStore.getState().setError(null);
      expect(useSyncStore.getState().error).toBeNull();
    });
  });
});
