/**
 * Network Monitor
 * Monitors network connectivity status
 */

import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { logger } from "../logger";

export type NetworkStatus = "online" | "offline" | "unknown";

export class NetworkMonitor {
  private isConnected = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;

      if (this.isConnected !== isConnected) {
        this.isConnected = isConnected;
        this.notifyListeners(isConnected);
      }
    });
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (error) {
        logger.error("Network listener error", error as Error, "NetworkMonitor");
      }
    });
  }

  /**
   * Add network status listener
   */
  addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);

    // Immediately call with current status
    callback(this.isConnected);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    if (this.isConnected) return "online";
    return "offline";
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.removeAllListeners();
  }
}

// Singleton instance
let networkMonitorInstance: NetworkMonitor | null = null;

export function getNetworkMonitor(): NetworkMonitor {
  if (!networkMonitorInstance) {
    networkMonitorInstance = new NetworkMonitor();
  }
  return networkMonitorInstance;
}

export function resetNetworkMonitor(): void {
  if (networkMonitorInstance) {
    networkMonitorInstance.stop();
    networkMonitorInstance = null;
  }
}
