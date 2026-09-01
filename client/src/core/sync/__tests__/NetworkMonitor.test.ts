/**
 * Unit tests for NetworkMonitor
 * Testing network connectivity monitoring logic
 */

import { NetworkMonitor, getNetworkMonitor, resetNetworkMonitor } from "../NetworkMonitor";
import NetInfo from "@react-native-community/netinfo";

// Mock NetInfo
const netInfoState: any = { isConnected: true, isInternetReachable: true, type: "wifi" };
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(() => Promise.resolve(netInfoState)),
  addEventListener: jest.fn((callback: (state: any) => void) => {
    // Immediately notify with current state, mimicking real NetInfo behavior
    callback(netInfoState);
    return () => {};
  }),
}));

describe("NetworkMonitor", () => {
  let networkMonitor: NetworkMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    networkMonitor = new NetworkMonitor();
  });

  afterEach(() => {
    resetNetworkMonitor();
  });

  describe("Constructor", () => {
    it("should initialize with default state", () => {
      expect(networkMonitor.isOnline()).toBe(true); // Default assumption
    });

    it("should create instance without throwing", () => {
      expect(() => new NetworkMonitor()).not.toThrow();
    });
  });

  describe("Network State Detection", () => {
    it("should detect online state", () => {
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });

      expect(networkMonitor.isOnline()).toBe(true);
    });

    it("should detect offline state", () => {
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: false, isInternetReachable: false, type: "none" });

      expect(networkMonitor.isOnline()).toBe(false);
    });

    it("should treat lack of connectivity as offline", () => {
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: false, isInternetReachable: false, type: "cellular" });

      expect(networkMonitor.isOnline()).toBe(false);
    });

    it("should default to online before any state update", () => {
      // Fresh monitor with no events should assume online (fail-safe default)
      expect(networkMonitor.isOnline()).toBe(true);
    });
  });

  describe("Event Listeners", () => {
    let mockListener1: jest.Mock;
    let mockListener2: jest.Mock;

    beforeEach(() => {
      mockListener1 = jest.fn();
      mockListener2 = jest.fn();
    });

    it("should add and notify listeners", () => {
      networkMonitor.addListener(mockListener1);
      networkMonitor.addListener(mockListener2);

      // Simulate network state change
      const mockNetInfoState = {
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
      };

      // Trigger the event listener
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener(mockNetInfoState);

      expect(mockListener1).toHaveBeenCalledWith(true);
      expect(mockListener2).toHaveBeenCalledWith(true);
    });

    it("should remove specific listeners", () => {
      const removeFn1 = networkMonitor.addListener(mockListener1);
      networkMonitor.addListener(mockListener2);

      // Discard the immediate invocation that addListener performs
      mockListener1.mockClear();
      mockListener2.mockClear();

      removeFn1();

      // Trigger a real state change (online -> offline)
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: false, isInternetReachable: false, type: "none" });

      expect(mockListener1).not.toHaveBeenCalled();
      expect(mockListener2).toHaveBeenCalled();
    });

    it("should remove all listeners", () => {
      networkMonitor.addListener(mockListener1);
      networkMonitor.addListener(mockListener2);

      // Discard the immediate invocation that addListener performs
      mockListener1.mockClear();
      mockListener2.mockClear();

      networkMonitor.removeAllListeners();

      // Trigger a real state change (online -> offline)
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: false, isInternetReachable: false, type: "none" });

      expect(mockListener1).not.toHaveBeenCalled();
      expect(mockListener2).not.toHaveBeenCalled();
    });

    it("should handle listener that throws", () => {
      const throwingListener = jest.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });
      const normalListener = jest.fn();

      networkMonitor.addListener(throwingListener);
      networkMonitor.addListener(normalListener);

      // Discard the immediate invocation that addListener performs
      throwingListener.mockClear();
      normalListener.mockClear();

      // Trigger a real state change (online -> offline)
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      expect(() => {
        eventListener({ isConnected: false, isInternetReachable: false, type: "none" });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe("Status Methods", () => {
    it("should return correct status when online", () => {
      // Mock online state
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });

      expect(networkMonitor.isOnline()).toBe(true);
      expect(networkMonitor.getStatus()).toBe("online");
    });

    it("should return correct status when offline", () => {
      // Mock offline state
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: false, isInternetReachable: false, type: "none" });

      expect(networkMonitor.isOnline()).toBe(false);
      expect(networkMonitor.getStatus()).toBe("offline");
    });
  });

  describe("Stop Monitoring", () => {
    it("should stop monitoring and cleanup", () => {
      networkMonitor.stop();

      expect(networkMonitor.isOnline()).toBe(false); // Should be offline after stop
    });

    it("should handle stop when not monitoring", () => {
      expect(() => networkMonitor.stop()).not.toThrow();
    });
  });

  describe("Singleton Pattern", () => {
    it("should return same instance", () => {
      const monitor1 = getNetworkMonitor();
      const monitor2 = getNetworkMonitor();
      expect(monitor1).toBe(monitor2);
    });

    it("should reset instance", () => {
      const monitor1 = getNetworkMonitor();
      resetNetworkMonitor();
      const monitor2 = getNetworkMonitor();
      expect(monitor1).not.toBe(monitor2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid network state changes", async () => {
      const listener = jest.fn();
      networkMonitor.addListener(listener);

      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      // Rapid state changes
      eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });
      eventListener({ isConnected: false, isInternetReachable: false, type: "none" });
      eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });
      eventListener({ isConnected: false, isInternetReachable: false, type: "none" });

      expect(listener).toHaveBeenCalledTimes(4);
      expect(listener).toHaveBeenLastCalledWith(false);
    });

    it("should handle null network details", async () => {
      const mockNetInfoState = {
        isConnected: true,
        isInternetReachable: true,
        type: "unknown",
        details: null,
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(networkMonitor.isOnline()).toBe(true);
    });

    it("should handle undefined connection type", async () => {
      const mockNetInfoState = {
        isConnected: true,
        isInternetReachable: true,
        type: undefined,
        details: null,
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(networkMonitor.isOnline()).toBe(true);
    });
  });

  describe("Memory Management", () => {
    it("should cleanup listeners on stop", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      networkMonitor.addListener(listener1);
      networkMonitor.addListener(listener2);

      // Discard the immediate invocation that addListener performs
      listener1.mockClear();
      listener2.mockClear();

      networkMonitor.stop();

      // Trigger event after stop
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: false, isInternetReachable: false, type: "none" });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it("should handle reset properly", () => {
      const monitor1 = getNetworkMonitor();
      resetNetworkMonitor();
      const monitor2 = getNetworkMonitor();
      expect(monitor1).not.toBe(monitor2);
    });
  });
});
