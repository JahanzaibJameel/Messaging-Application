/**
 * Sync Engine
 * Manages offline-first synchronization with conflict resolution
 */

import { useSyncStore, useMessageStore, useChatStore, useUIStore } from '../../presentation/stores';
import { chatRepository } from '../../data/repositories';
import { NetworkMonitor } from './NetworkMonitor';
import { AppError } from '../errors';
import { logger } from '../logger';
import type { Message } from '../../domain/entities/Message';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncEngineConfig {
  syncInterval: number;
  retryAttempts: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: SyncEngineConfig = {
  syncInterval: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
};

export class SyncEngine {
  private config: SyncEngineConfig;
  private networkMonitor: NetworkMonitor;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;

  constructor(config: Partial<SyncEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.networkMonitor = new NetworkMonitor();
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    this.networkMonitor.addListener((isOnline: boolean) => {
      const syncStore = useSyncStore.getState();
      
      if (isOnline) {
        syncStore.setStatus('idle');
        this.processQueue();
      } else {
        syncStore.setStatus('offline');
      }
    });
  }

  /**
   * Start periodic sync
   */
  start(): void {
    this.stop();
    
    this.syncTimer = setInterval(() => {
      this.sync();
    }, this.config.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Queue a message for sending
   */
  queueMessage(message: Message): void {
    const syncStore = useSyncStore.getState();
    const messageStore = useMessageStore.getState();

    // Add to message store
    messageStore.addMessage(message);

    // Add to sync queue
    syncStore.queueMessage(message.id, message.chatId);

    // Try to process immediately if online
    if (this.networkMonitor.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.networkMonitor.isOnline()) {
      return;
    }

    this.isProcessing = true;
    const syncStore = useSyncStore.getState();
    const messageStore = useMessageStore.getState();
    const uiStore = useUIStore.getState();

    syncStore.setStatus('syncing');
    uiStore.setSyncing(true);

    try {
      const { pendingMessages } = syncStore;

      for (const queuedMessage of pendingMessages) {
        const message = messageStore.getMessageById(queuedMessage.messageId);
        
        if (!message) {
          syncStore.removeFromQueue(queuedMessage.messageId);
          continue;
        }

        // Skip if already sent
        if (message.status === 'sent' || message.status === 'read') {
          syncStore.removeFromQueue(queuedMessage.messageId);
          continue;
        }

        try {
          // Update status to sending
          messageStore.updateMessage(message.id, { status: 'sending' });

          // Send via repository
          await chatRepository.saveMessage(message);

          // Mark as sent
          messageStore.updateMessage(message.id, { 
            status: 'sent',
            localOnly: false,
          });

          // Remove from queue
          syncStore.removeFromQueue(queuedMessage.messageId);
        } catch (error) {
          logger.error(`Failed to sync message ${message.id}`, error as Error, 'SyncEngine');
          
          // Increment retry count
          const retryCount = queuedMessage.retryCount + 1;
          
          if (retryCount >= this.config.retryAttempts) {
            // Mark as failed
            syncStore.markAsFailed(queuedMessage.messageId);
            messageStore.updateMessage(message.id, { status: 'error' });
          }
        }
      }

      // Update last sync time
      syncStore.setLastSync(new Date().toISOString());
      syncStore.setStatus('idle');
    } catch (error) {
      logger.error('Sync error', error as Error, 'SyncEngine');
      syncStore.setStatus('error');
      syncStore.setError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      this.isProcessing = false;
      uiStore.setSyncing(false);
    }
  }

  /**
   * Full sync with server
   */
  async sync(): Promise<void> {
    if (!this.networkMonitor.isOnline()) {
      return;
    }

    const syncStore = useSyncStore.getState();
    const chatStore = useChatStore.getState();
    const messageStore = useMessageStore.getState();

    syncStore.setStatus('syncing');

    try {
      const lastSync = syncStore.lastSyncAt;
      
      // Sync with remote
      const result = await chatRepository.syncWithRemote(lastSync || undefined);

      // Update stores
      for (const chat of result.chats) {
        chatStore.updateChat(chat.id, chat);
      }

      for (const message of result.messages) {
        messageStore.addMessage(message);
      }

      syncStore.setLastSync(result.timestamp);
      syncStore.setStatus('idle');
    } catch (error) {
      logger.error('Full sync error', error as Error, 'SyncEngine');
      syncStore.setStatus('error');
    }
  }

  /**
   * Retry failed messages
   */
  async retryFailed(): Promise<void> {
    const syncStore = useSyncStore.getState();
    const { failedMessages } = syncStore;

    for (const failed of failedMessages) {
      syncStore.retryMessage(failed.messageId);
    }

    await this.processQueue();
  }

  /**
   * Get sync status
   */
  getStatus(): SyncStatus {
    return useSyncStore.getState().status;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.networkMonitor.isOnline();
  }
}

// Singleton instance
let syncEngineInstance: SyncEngine | null = null;

export function getSyncEngine(config?: Partial<SyncEngineConfig>): SyncEngine {
  if (!syncEngineInstance) {
    syncEngineInstance = new SyncEngine(config);
  }
  return syncEngineInstance;
}

export function resetSyncEngine(): void {
  if (syncEngineInstance) {
    syncEngineInstance.stop();
    syncEngineInstance = null;
  }
}
