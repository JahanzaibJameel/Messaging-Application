/**
 * Unit tests for SyncEngine
 * Testing core synchronization logic without React Native dependencies
 */

import { SyncEngine, getSyncEngine, resetSyncEngine } from "../SyncEngine";
import { NetworkMonitor } from "../NetworkMonitor";
import { SyncUseCase } from "../../../domain/usecases/SyncUseCase";
import { ChatUseCase } from "../../../domain/usecases/ChatUseCase";

// Mock NetworkMonitor with a shared, controllable instance
jest.mock("../NetworkMonitor", () => {
  const mockInstance = {
    mockIsOnline: jest.fn().mockReturnValue(true),
    addListener: jest.fn().mockImplementation((callback) => {
      mockInstance._lastCallback = callback;
      return jest.fn();
    }),
    removeAllListeners: jest.fn(),
    _lastCallback: null,
  };
  (mockInstance as any).isOnline = mockInstance.mockIsOnline;
  const MockedNetworkMonitor = jest.fn().mockImplementation(() => mockInstance);
  (MockedNetworkMonitor as any)._instance = mockInstance;
  return { NetworkMonitor: MockedNetworkMonitor };
});

// Mock domain usecases
jest.mock("../../../domain/usecases/SyncUseCase", () => {
  return {
    SyncUseCase: jest.fn().mockImplementation(() => ({
      getState: jest.fn().mockReturnValue({
        status: "idle",
        pendingMessages: [],
        failedMessages: [],
        lastSyncAt: null,
        error: null,
      }),
      queueMessage: jest.fn(),
      processQueue: jest.fn(),
      sync: jest.fn(),
      retryFailed: jest.fn(),
      getStatus: jest.fn().mockReturnValue("idle"),
      isOnline: jest.fn().mockReturnValue(true),
      start: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn(),
    })),
  };
});

jest.mock("../../../domain/usecases/ChatUseCase", () => {
  return {
    ChatUseCase: jest.fn().mockImplementation(() => ({
      getAllChats: jest.fn(),
      getChatById: jest.fn(),
      createGroup: jest.fn(),
      pinChat: jest.fn(),
      unpinChat: jest.fn(),
      muteChat: jest.fn(),
      unmuteChat: jest.fn(),
      archiveChat: jest.fn(),
      unarchiveChat: jest.fn(),
      markAsRead: jest.fn(),
      sendMessage: jest.fn(),
      getMessages: jest.fn(),
    })),
  };
});

type MockNetworkMonitorInstance = {
  isOnline: jest.Mock;
  addListener: jest.Mock;
  removeAllListeners: jest.Mock;
  _lastCallback: ((isOnline: boolean) => void) | null;
};

describe("SyncEngine", () => {
  let syncEngine: SyncEngine;
  let mockSyncUseCase: jest.Mocked<SyncUseCase>;
  let mockChatUseCase: jest.Mocked<ChatUseCase>;
  let mockNetworkMonitorInstance: MockNetworkMonitorInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    const NetworkMonitorModule = require("../NetworkMonitor");
    mockNetworkMonitorInstance = NetworkMonitorModule.NetworkMonitor._instance;
    mockNetworkMonitorInstance.isOnline.mockReturnValue(true);
    mockNetworkMonitorInstance.removeAllListeners.mockClear();
    mockNetworkMonitorInstance._lastCallback = null;

    const SyncUseCaseModule = require("../../../domain/usecases/SyncUseCase");
    mockSyncUseCase = new SyncUseCaseModule.SyncUseCase();

    const ChatUseCaseModule = require("../../../domain/usecases/ChatUseCase");
    mockChatUseCase = new ChatUseCaseModule.ChatUseCase();

    mockSyncUseCase.getState.mockReturnValue({
      status: "idle",
      pendingMessages: [],
      failedMessages: [],
      lastSyncAt: null,
      error: null,
    });
    mockSyncUseCase.getStatus.mockReturnValue("idle");
    mockSyncUseCase.isOnline.mockReturnValue(true);

    syncEngine = new SyncEngine(
      mockSyncUseCase,
      mockChatUseCase,
      { syncInterval: 1000, retryAttempts: 2, retryDelay: 100 },
      {
        onStatusChange: jest.fn(),
        onSyncingChange: jest.fn(),
      }
    );
  });

  afterEach(() => {
    syncEngine.stop();
    resetSyncEngine();
  });

  describe("Constructor", () => {
    it("should initialize with default config", () => {
      const engine = new SyncEngine(mockSyncUseCase, mockChatUseCase);
      expect(engine.getStatus()).toBe("idle");
    });

    it("should merge custom config with defaults", () => {
      const customConfig = { syncInterval: 5000 };
      const engine = new SyncEngine(mockSyncUseCase, mockChatUseCase, customConfig);
      engine.start();
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
      syncEngine.start();
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
      timestamp: new Date("2024-01-01T00:00:00Z"),
      type: "text" as const,
      reactions: [],
      edited: false,
      status: "sending" as const,
    };

    it("should queue message for sync", async () => {
      mockSyncUseCase.isOnline.mockReturnValue(true);
      await syncEngine.queueMessage(mockMessage);
      expect(mockSyncUseCase.queueMessage).toHaveBeenCalledWith(mockMessage);
    });

    it("should skip processing when offline", async () => {
      mockNetworkMonitorInstance.isOnline.mockReturnValue(false);
      await syncEngine.processQueue();
      expect(mockSyncUseCase.processQueue).not.toHaveBeenCalled();
    });
  });

  describe("Full Sync", () => {
    it("should perform full sync when online", async () => {
      await syncEngine.sync();
      expect(mockSyncUseCase.sync).toHaveBeenCalled();
    });

    it("should skip full sync when offline", async () => {
      mockNetworkMonitorInstance.isOnline.mockReturnValue(false);
      await syncEngine.sync();
      expect(mockSyncUseCase.sync).not.toHaveBeenCalled();
    });
  });

  describe("Retry Failed Messages", () => {
    it("should retry all failed messages", async () => {
      mockSyncUseCase.retryFailed.mockResolvedValue(undefined);
      await syncEngine.retryFailed();
      expect(mockSyncUseCase.retryFailed).toHaveBeenCalled();
    });
  });

  describe("Network Monitoring", () => {
    it("should setup network listener on construction", () => {
      expect(mockNetworkMonitorInstance.addListener).toHaveBeenCalled();
    });

    it("should handle coming online", () => {
      const callback = mockNetworkMonitorInstance._lastCallback;
      expect(callback).not.toBeNull();
      callback?.(true);
      expect(mockSyncUseCase.processQueue).toHaveBeenCalled();
    });

    it("should handle going offline", () => {
      const callback = mockNetworkMonitorInstance._lastCallback;
      expect(callback).not.toBeNull();
      callback?.(false);
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
      expect(mockSyncUseCase.sync).not.toHaveBeenCalled();
    });

    it("should handle destroy gracefully", () => {
      syncEngine.start();
      syncEngine.destroy();
      expect(mockNetworkMonitorInstance.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe("Singleton Pattern", () => {
    it("should return same instance", () => {
      const engine1 = getSyncEngine(mockSyncUseCase, mockChatUseCase);
      const engine2 = getSyncEngine(mockSyncUseCase, mockChatUseCase);
      expect(engine1).toBe(engine2);
    });

    it("should reset instance", () => {
      const engine1 = getSyncEngine(mockSyncUseCase, mockChatUseCase);
      resetSyncEngine();
      const engine2 = getSyncEngine(mockSyncUseCase, mockChatUseCase);
      expect(engine1).not.toBe(engine2);
    });
  });
});
