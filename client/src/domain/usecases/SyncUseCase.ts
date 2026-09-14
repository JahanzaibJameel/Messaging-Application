import type { Message } from "../entities/Message";
import type { SyncStatus, QueuedMessage } from "../../presentation/stores/types";

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  pendingMessages: QueuedMessage[];
  failedMessages: QueuedMessage[];
  error: string | null;
}

export interface SyncActions {
  setStatus: (status: SyncStatus) => void;
  setLastSync: (timestamp: string) => void;
  queueMessage: (messageId: string, chatId: string) => void;
  removeFromQueue: (messageId: string) => void;
  markAsFailed: (messageId: string) => void;
  retryMessage: (messageId: string) => void;
  clearFailed: () => void;
  setError: (error: string | null) => void;
}

export interface SyncRepository {
  saveMessage(message: Message): Promise<void>;
  syncWithRemote(lastSyncTimestamp?: string): Promise<{
    messages: Message[];
    chats: unknown[];
    timestamp: string;
  }>;
}

export class SyncUseCase {
  private syncState: SyncState = {
    status: "idle",
    lastSyncAt: null,
    pendingMessages: [],
    failedMessages: [],
    error: null,
  };
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isProcessing = false;
  private isDestroyed = false;
  private syncInterval: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    private syncRepository: SyncRepository,
    config?: { syncInterval?: number; retryAttempts?: number; retryDelay?: number }
  ) {
    this.syncInterval = config?.syncInterval ?? 30000;
    this.retryAttempts = config?.retryAttempts ?? 3;
    this.retryDelay = config?.retryDelay ?? 5000;
  }

  getState(): SyncState {
    return { ...this.syncState };
  }

  async queueMessage(message: Message): Promise<void> {
    this.syncState.pendingMessages.push({
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId: message.id,
      chatId: message.chatId,
      retryCount: 0,
      lastAttempt: new Date().toISOString(),
      priority: "normal",
    });

    if (this.isOnline()) {
      await this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isDestroyed || this.isProcessing || !this.isOnline()) {
      return;
    }

    this.isProcessing = true;
    this.syncState.status = "syncing";

    try {
      const pending = [...this.syncState.pendingMessages];

      for (const queued of pending) {
        if (this.isDestroyed) break;

        const message = this.syncState.pendingMessages.find(
          (m) => m.messageId === queued.messageId
        );

        if (!message) {
          this.syncState.pendingMessages = this.syncState.pendingMessages.filter(
            (m) => m.messageId !== queued.messageId
          );
          continue;
        }

        try {
          await this.syncRepository.saveMessage({} as Message);
          this.syncState.pendingMessages = this.syncState.pendingMessages.filter(
            (m) => m.messageId !== queued.messageId
          );
        } catch {
          const retryCount = queued.retryCount + 1;
          if (retryCount >= this.retryAttempts) {
            this.syncState.pendingMessages = this.syncState.pendingMessages.filter(
              (m) => m.messageId !== queued.messageId
            );
            this.syncState.failedMessages.push(queued);
          } else {
            const timerId = setTimeout(() => {
              this.syncState.pendingMessages.push(queued);
              this.retryTimers.delete(queued.messageId);
            }, this.retryDelay);
            this.retryTimers.set(queued.messageId, timerId);
          }
        }
      }

      this.syncState.lastSyncAt = new Date().toISOString();
      this.syncState.status = "idle";
    } catch (error) {
      this.syncState.status = "error";
      this.syncState.error = error instanceof Error ? error.message : "Sync failed";
    } finally {
      this.isProcessing = false;
    }
  }

  async sync(): Promise<void> {
    if (this.isDestroyed || !this.isOnline()) {
      return;
    }

    this.syncState.status = "syncing";

    try {
      const lastSync = this.syncState.lastSyncAt;
      const result = await this.syncRepository.syncWithRemote(lastSync || undefined);
      this.syncState.lastSyncAt = result.timestamp;
      this.syncState.status = "idle";
    } catch (error) {
      this.syncState.status = "error";
      this.syncState.error = error instanceof Error ? error.message : "Sync failed";
    }
  }

  async retryFailed(): Promise<void> {
    const failed = [...this.syncState.failedMessages];
    this.syncState.failedMessages = [];
    for (const failedMsg of failed) {
      this.syncState.pendingMessages.push(failedMsg);
    }
    await this.processQueue();
  }

  getStatus(): SyncStatus {
    return this.syncState.status;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  start(): void {
    if (this.isDestroyed) return;
    this.stop();
    this.syncTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.sync();
      }
    }, this.syncInterval);
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
  }
}
