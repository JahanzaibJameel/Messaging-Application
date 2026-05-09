/**
 * Unit tests for NetworkMonitor
 * Testing network connectivity monitoring logic
 */

import { NetworkMonitor, getNetworkMonitor, resetNetworkMonitor } from "../NetworkMonitor";
import NetInfo from "@react-native-community/netinfo";

// Mock NetInfo
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
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
    it("should detect online state", async () => {
      const mockNetInfoState = {
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
        details: {
          isConnectionExpensive: false,
          isConnectionDowngraded: false,
        },
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);

      // Wait for the event listener to process the state change
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(networkMonitor.isOnline()).toBe(true);
    });

    it("should detect offline state", async () => {
      const mockNetInfoState = {
        isConnected: false,
        isInternetReachable: false,
        type: "none",
        details: null,
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(networkMonitor.isOnline()).toBe(false);
    });

    it("should handle connection without internet reachability", async () => {
      const mockNetInfoState = {
        isConnected: true,
        isInternetReachable: false,
        type: "cellular",
        details: {
          isConnectionExpensive: true,
          isConnectionDowngraded: false,
        },
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(networkMonitor.isOnline()).toBe(false);
    });

    it("should handle NetInfo fetch errors", async () => {
      const error = new Error("Network info fetch failed");
      (NetInfo.fetch as jest.Mock).mockRejectedValue(error);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(networkMonitor.isOnline()).toBe(false); // Fail safe to offline
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
      const removeFn2 = networkMonitor.addListener(mockListener2);

      removeFn1();

      // Trigger event
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });

      expect(mockListener1).not.toHaveBeenCalled();
      expect(mockListener2).toHaveBeenCalled();
    });

    it("should remove all listeners", () => {
      networkMonitor.addListener(mockListener1);
      networkMonitor.addListener(mockListener2);

      networkMonitor.removeAllListeners();

      // Trigger event
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });

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

      // Trigger event
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      expect(() => {
        eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalledWith(true);
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

      networkMonitor.stop();

      // Trigger event after stop
      const eventListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      eventListener({ isConnected: true, isInternetReachable: true, type: "wifi" });

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
