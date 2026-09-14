/**
 * Sync Engine
 * Manages offline-first synchronization with conflict resolution
 */

import { NetworkMonitor } from "./NetworkMonitor";
import { logger } from "../logger";
import type { Message } from "../../domain/entities/Message";
import type { SyncUseCase } from "../../domain/usecases/SyncUseCase";
import type { ChatUseCase } from "../../domain/usecases/ChatUseCase";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncEngineConfig {
  syncInterval: number;
  retryAttempts: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: SyncEngineConfig = {
  syncInterval: 30000,
  retryAttempts: 3,
  retryDelay: 5000,
};

export class SyncEngine {
  private config: SyncEngineConfig;
  private networkMonitor: NetworkMonitor;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isProcessing = false;
  private isDestroyed = false;
  private syncUseCase: SyncUseCase;
  private chatUseCase: ChatUseCase;
  private onStatusChange?: (status: SyncStatus) => void;
  private onSyncingChange?: (isSyncing: boolean) => void;

  constructor(
    syncUseCase: SyncUseCase,
    chatUseCase: ChatUseCase,
    config: Partial<SyncEngineConfig> = {},
    callbacks?: {
      onStatusChange?: (status: SyncStatus) => void;
      onSyncingChange?: (isSyncing: boolean) => void;
    }
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.syncUseCase = syncUseCase;
    this.chatUseCase = chatUseCase;
    this.networkMonitor = new NetworkMonitor();
    this.onStatusChange = callbacks?.onStatusChange;
    this.onSyncingChange = callbacks?.onSyncingChange;
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    this.networkMonitor.addListener((isOnline: boolean) => {
      if (isOnline) {
        this.onStatusChange?.("idle");
        this.processQueue();
      } else {
        this.onStatusChange?.("offline");
      }
    });
  }

  start(): void {
    if (this.isDestroyed) {
      return;
    }
    this.stop();
    this.syncTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.sync();
      }
    }, this.config.syncInterval);
  }

  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
  }

  destroy(): void {
    this.isDestroyed = true;
    this.stop();
    this.networkMonitor.removeAllListeners();
  }

  async queueMessage(message: Message): Promise<void> {
    await this.syncUseCase.queueMessage(message);
    if (this.networkMonitor.isOnline()) {
      await this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isDestroyed || this.isProcessing || !this.networkMonitor.isOnline()) {
      return;
    }

    this.isProcessing = true;
    this.onSyncingChange?.(true);

    try {
      await this.syncUseCase.processQueue();
    } catch (error) {
      logger.error(`Failed to sync messages`, error as Error, "SyncEngine");
    } finally {
      this.isProcessing = false;
      this.onSyncingChange?.(false);
    }
  }

  async sync(): Promise<void> {
    if (this.isDestroyed || !this.networkMonitor.isOnline()) {
      return;
    }

    try {
      await this.syncUseCase.sync();
    } catch (error) {
      logger.error("Full sync error", error as Error, "SyncEngine");
    }
  }

  async retryFailed(): Promise<void> {
    await this.syncUseCase.retryFailed();
    await this.processQueue();
  }

  getStatus(): SyncStatus {
    return this.syncUseCase.getStatus();
  }

  isOnline(): boolean {
    return this.networkMonitor.isOnline();
  }
}

let syncEngineInstance: SyncEngine | null = null;

export function getSyncEngine(
  syncUseCase: SyncUseCase,
  chatUseCase: ChatUseCase,
  config?: Partial<SyncEngineConfig>
): SyncEngine {
  if (!syncEngineInstance) {
    syncEngineInstance = new SyncEngine(syncUseCase, chatUseCase, config);
  }
  return syncEngineInstance;
}

export function resetSyncEngine(): void {
  if (syncEngineInstance) {
    syncEngineInstance.destroy();
    syncEngineInstance = null;
  }
}
