/**
 * Unit tests for SyncEngine
 * Testing core synchronization logic without React Native dependencies
 */

import { SyncEngine, getSyncEngine, resetSyncEngine } from "../SyncEngine";
import { NetworkMonitor } from "../NetworkMonitor";
import {
  useSyncStore,
  useMessageStore,
  useChatStore,
  useUIStore,
} from "../../../presentation/stores";

// Mock dependencies
jest.mock("../NetworkMonitor");
jest.mock("../../../presentation/stores");

const mockNetworkMonitor = NetworkMonitor as jest.MockedClass<typeof NetworkMonitor>;
const mockSyncStore = useSyncStore as jest.MockedFunction<typeof useSyncStore>;
const mockMessageStore = useMessageStore as jest.MockedFunction<typeof useMessageStore>;
const mockChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;
const mockUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;

// Mock chat repository
jest.mock("../../../data/repositories", () => ({
  chatRepository: {
    saveMessage: jest.fn(),
    syncWithRemote: jest.fn(),
  },
}));

describe("SyncEngine", () => {
  let syncEngine: SyncEngine;
  let mockStoreStates: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock store states
    mockStoreStates = {
      syncStore: {
        status: "idle",
        pendingMessages: [],
        failedMessages: [],
        lastSyncAt: null,
        queueMessage: jest.fn(),
        removeFromQueue: jest.fn(),
        markAsFailed: jest.fn(),
        retryMessage: jest.fn(),
        setStatus: jest.fn(),
        setLastSync: jest.fn(),
        setError: jest.fn(),
      },
      messageStore: {
        addMessage: jest.fn(),
        getMessageById: jest.fn(),
        updateMessage: jest.fn(),
      },
      chatStore: {
        updateChat: jest.fn(),
      },
      uiStore: {
        setSyncing: jest.fn(),
      },
    };

    mockSyncStore.mockReturnValue(mockStoreStates.syncStore);
    mockMessageStore.mockReturnValue(mockStoreStates.messageStore);
    mockChatStore.mockReturnValue(mockStoreStates.chatStore);
    mockUIStore.mockReturnValue(mockStoreStates.uiStore);

    // Mock network monitor
    mockNetworkMonitor.mockImplementation(() => ({
      isOnline: jest.fn().mockReturnValue(true),
      addListener: jest.fn(),
      removeAllListeners: jest.fn(),
    }));

    syncEngine = new SyncEngine({
      syncInterval: 1000, // Short interval for tests
      retryAttempts: 2,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    syncEngine.stop();
    resetSyncEngine();
  });

  describe("Constructor", () => {
    it("should initialize with default config", () => {
      const engine = new SyncEngine();
      expect(engine.getStatus()).toBe("idle");
    });

    it("should merge custom config with defaults", () => {
      const customConfig = { syncInterval: 5000 };
      const engine = new SyncEngine(customConfig);
      engine.start();
      // Should not throw with custom config
      expect(engine.getStatus()).toBe("idle");
      engine.stop();
    });
  });

  describe("Start/Stop", () => {
    it("should start periodic sync", () => {
      syncEngine.start();
      expect(syncEngine.getStatus()).toBe("idle");
    });

    it("should stop periodic sync", () => {
      syncEngine.start();
      syncEngine.stop();
      expect(syncEngine.getStatus()).toBe("idle");
    });

    it("should clear existing timer when starting", () => {
      syncEngine.start();
      const firstStatus = syncEngine.getStatus();
      syncEngine.start(); // Start again
      expect(syncEngine.getStatus()).toBe(firstStatus);
    });

    it("should handle stop when no timer exists", () => {
      expect(() => syncEngine.stop()).not.toThrow();
    });
  });

  describe("Queue Management", () => {
    const mockMessage = {
      id: "msg_123",
      chatId: "chat_456",
      senderId: "user_789",
      text: "Test message",
      timestamp: "2024-01-01T00:00:00Z",
      status: "pending" as const,
    };

    it("should queue message for sync", () => {
      syncEngine.queueMessage(mockMessage);

      expect(mockStoreStates.messageStore.addMessage).toHaveBeenCalledWith(mockMessage);
      expect(mockStoreStates.syncStore.queueMessage).toHaveBeenCalledWith(
        mockMessage.id,
        mockMessage.chatId
      );
    });

    it("should process queue when online", async () => {
      mockStoreStates.syncStore.pendingMessages = [{ messageId: mockMessage.id, retryCount: 0 }];
      mockStoreStates.messageStore.getMessageById.mockReturnValue(mockMessage);

      await syncEngine.processQueue();

      expect(mockStoreStates.messageStore.updateMessage).toHaveBeenCalledWith(mockMessage.id, {
        status: "sending",
      });
    });

    it("should skip processing when already processing", async () => {
      // Set processing flag by starting a long-running process
      const processPromise = syncEngine.processQueue();
      const secondProcessPromise = syncEngine.processQueue();

      await Promise.all([processPromise, secondProcessPromise]);

      // Should only process once
      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledTimes(1);
    });

    it("should skip processing when offline", async () => {
      mockNetworkMonitor.mockImplementation(() => ({
        isOnline: jest.fn().mockReturnValue(false),
        addListener: jest.fn(),
        removeAllListeners: jest.fn(),
      }));

      await syncEngine.processQueue();

      expect(mockStoreStates.syncStore.setStatus).not.toHaveBeenCalledWith("syncing");
    });
  });

  describe("Message Processing", () => {
    const mockMessage = {
      id: "msg_123",
      chatId: "chat_456",
      senderId: "user_789",
      text: "Test message",
      timestamp: "2024-01-01T00:00:00Z",
      status: "pending" as const,
    };

    it("should handle successful message sync", async () => {
      const { chatRepository } = require("../../../data/repositories");
      chatRepository.saveMessage.mockResolvedValue(undefined);

      mockStoreStates.syncStore.pendingMessages = [{ messageId: mockMessage.id, retryCount: 0 }];
      mockStoreStates.messageStore.getMessageById.mockReturnValue(mockMessage);

      await syncEngine.processQueue();

      expect(chatRepository.saveMessage).toHaveBeenCalledWith(mockMessage);
      expect(mockStoreStates.messageStore.updateMessage).toHaveBeenCalledWith(mockMessage.id, {
        status: "sent",
        localOnly: false,
      });
      expect(mockStoreStates.syncStore.removeFromQueue).toHaveBeenCalledWith(mockMessage.id);
    });

    it("should handle message sync failure", async () => {
      const { chatRepository } = require("../../../data/repositories");
      const error = new Error("Network error");
      chatRepository.saveMessage.mockRejectedValue(error);

      mockStoreStates.syncStore.pendingMessages = [{ messageId: mockMessage.id, retryCount: 0 }];
      mockStoreStates.messageStore.getMessageById.mockReturnValue(mockMessage);

      await syncEngine.processQueue();

      expect(mockStoreStates.syncStore.retryMessage).toHaveBeenCalledWith(mockMessage.id);
    });

    it("should mark message as failed after max retries", async () => {
      const { chatRepository } = require("../../../data/repositories");
      chatRepository.saveMessage.mockRejectedValue(new Error("Persistent failure"));

      mockStoreStates.syncStore.pendingMessages = [
        { messageId: mockMessage.id, retryCount: 1 }, // Already retried once
      ];
      mockStoreStates.messageStore.getMessageById.mockReturnValue(mockMessage);

      await syncEngine.processQueue();

      expect(mockStoreStates.syncStore.markAsFailed).toHaveBeenCalledWith(mockMessage.id);
      expect(mockStoreStates.messageStore.updateMessage).toHaveBeenCalledWith(mockMessage.id, {
        status: "error",
      });
    });

    it("should skip already sent messages", async () => {
      const sentMessage = { ...mockMessage, status: "sent" as const };
      mockStoreStates.syncStore.pendingMessages = [{ messageId: sentMessage.id, retryCount: 0 }];
      mockStoreStates.messageStore.getMessageById.mockReturnValue(sentMessage);

      await syncEngine.processQueue();

      expect(mockStoreStates.syncStore.removeFromQueue).toHaveBeenCalledWith(sentMessage.id);
      expect(
        require("../../../data/repositories").chatRepository.saveMessage
      ).not.toHaveBeenCalled();
    });

    it("should handle missing messages gracefully", async () => {
      mockStoreStates.syncStore.pendingMessages = [{ messageId: "nonexistent", retryCount: 0 }];
      mockStoreStates.messageStore.getMessageById.mockReturnValue(undefined);

      await syncEngine.processQueue();

      expect(mockStoreStates.syncStore.removeFromQueue).toHaveBeenCalledWith("nonexistent");
    });
  });

  describe("Full Sync", () => {
    it("should perform full sync when online", async () => {
      const { chatRepository } = require("../../../data/repositories");
      const syncResult = {
        chats: [],
        messages: [],
        timestamp: "2024-01-01T00:00:00Z",
      };
      chatRepository.syncWithRemote.mockResolvedValue(syncResult);

      await syncEngine.sync();

      expect(chatRepository.syncWithRemote).toHaveBeenCalled();
      expect(mockStoreStates.syncStore.setLastSync).toHaveBeenCalledWith(syncResult.timestamp);
      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledWith("idle");
    });

    it("should skip full sync when offline", async () => {
      mockNetworkMonitor.mockImplementation(() => ({
        isOnline: jest.fn().mockReturnValue(false),
        addListener: jest.fn(),
        removeAllListeners: jest.fn(),
      }));

      await syncEngine.sync();

      expect(
        require("../../../data/repositories").chatRepository.syncWithRemote
      ).not.toHaveBeenCalled();
    });

    it("should handle sync errors", async () => {
      const { chatRepository } = require("../../../data/repositories");
      chatRepository.syncWithRemote.mockRejectedValue(new Error("Sync failed"));

      await syncEngine.sync();

      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledWith("error");
    });
  });

  describe("Retry Failed Messages", () => {
    it("should retry all failed messages", async () => {
      mockStoreStates.syncStore.failedMessages = [
        { messageId: "msg1", retryCount: 0 },
        { messageId: "msg2", retryCount: 0 },
      ];

      await syncEngine.retryFailed();

      expect(mockStoreStates.syncStore.retryMessage).toHaveBeenCalledWith("msg1");
      expect(mockStoreStates.syncStore.retryMessage).toHaveBeenCalledWith("msg2");
    });
  });

  describe("Network Monitoring", () => {
    it("should setup network listener on construction", () => {
      expect(mockNetworkMonitor.prototype.addListener).toHaveBeenCalled();
    });

    it("should handle coming online", () => {
      const mockAddListener = mockNetworkMonitor.prototype.addListener;
      let onlineCallback: (isOnline: boolean) => void;

      mockAddListener.mockImplementation((callback) => {
        onlineCallback = callback;
      });

      new SyncEngine();

      // Simulate coming online
      onlineCallback(true);

      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledWith("idle");
    });

    it("should handle going offline", () => {
      const mockAddListener = mockNetworkMonitor.prototype.addListener;
      let onlineCallback: (isOnline: boolean) => void;

      mockAddListener.mockImplementation((callback) => {
        onlineCallback = callback;
      });

      new SyncEngine();

      // Simulate going offline
      onlineCallback(false);

      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledWith("offline");
    });
  });

  describe("Timer Management", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should clear timers on stop", () => {
      syncEngine.start();
      syncEngine.stop();

      jest.advanceTimersByTime(2000);
      // Should not process after stop
      expect(mockStoreStates.syncStore.setStatus).not.toHaveBeenCalledWith("syncing");
    });

    it("should handle destroy gracefully", () => {
      syncEngine.start();
      syncEngine.destroy();

      expect(mockNetworkMonitor.prototype.removeAllListeners).toHaveBeenCalled();
    });

    it("should not process after destroy", async () => {
      syncEngine.destroy();

      await syncEngine.processQueue();

      expect(mockStoreStates.syncStore.setStatus).not.toHaveBeenCalled();
    });
  });

  describe("Singleton Pattern", () => {
    it("should return same instance", () => {
      const engine1 = getSyncEngine();
      const engine2 = getSyncEngine();
      expect(engine1).toBe(engine2);
    });

    it("should reset instance", () => {
      const engine1 = getSyncEngine();
      resetSyncEngine();
      const engine2 = getSyncEngine();
      expect(engine1).not.toBe(engine2);
    });
  });

  describe("Error Handling", () => {
    it("should handle repository errors gracefully", async () => {
      const { chatRepository } = require("../../../data/repositories");
      const error = new Error("Repository error");
      chatRepository.saveMessage.mockRejectedValue(error);

      mockStoreStates.syncStore.pendingMessages = [{ messageId: "msg_123", retryCount: 0 }];
      const mockMessage = { id: "msg_123", chatId: "chat_456" };
      mockStoreStates.messageStore.getMessageById.mockReturnValue(mockMessage);

      await syncEngine.processQueue();

      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledWith("idle");
      expect(mockStoreStates.uiStore.setSyncing).toHaveBeenCalledWith(false);
    });

    it("should maintain processing state correctly", async () => {
      const { chatRepository } = require("../../../data/repositories");

      // Mock slow operation
      let resolvePromise: () => void;
      chatRepository.saveMessage.mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve;
        });
      });

      const processPromise1 = syncEngine.processQueue();
      const processPromise2 = syncEngine.processQueue();

      // Should not start second process
      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledTimes(1);

      // Resolve first process
      resolvePromise!();
      await processPromise1;

      // Now should be able to process again
      await processPromise2;
      expect(mockStoreStates.syncStore.setStatus).toHaveBeenCalledTimes(2);
    });
  });
});
