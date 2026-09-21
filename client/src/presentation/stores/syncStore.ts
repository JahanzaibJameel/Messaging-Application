/**
 * Sync Store
 * Manages synchronization state and pending message queue
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { SyncState, SyncActions, QueuedMessage, SyncStatus } from "./types";
import { createSecureStorageAdapterWithKeys } from "../../lib/secureStorageAdapter";

const STORAGE_KEYS = ["sync-storage"];

const secureStorage = createSecureStorageAdapterWithKeys("sync-storage", STORAGE_KEYS);

type SyncStore = SyncState & SyncActions;

const initialState: SyncState = {
  status: "idle",
  lastSyncAt: null,
  pendingMessages: [],
  failedMessages: [],
  error: null,
};

export const useSyncStore = create<SyncStore>()(
  immer(
    persist(
      (set, _get) => ({
        ...initialState,

        setStatus: (status: SyncStatus) => {
          set((state: SyncState) => {
            state.status = status;
          });
        },

        setLastSync: (timestamp: string) => {
          set((state: SyncState) => {
            state.lastSyncAt = timestamp;
          });
        },

        queueMessage: (messageId: string, chatId: string) => {
          set((state: SyncState) => {
            const exists = state.pendingMessages.some(
              (m: QueuedMessage) => m.messageId === messageId
            );
            if (!exists) {
              state.pendingMessages.push({
                id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                messageId,
                chatId,
                retryCount: 0,
                lastAttempt: new Date().toISOString(),
                priority: "normal",
              });
            }
          });
        },

        removeFromQueue: (messageId: string) => {
          set((state: SyncState) => {
            state.pendingMessages = state.pendingMessages.filter(
              (m: QueuedMessage) => m.messageId !== messageId
            );
          });
        },

        markAsFailed: (messageId: string) => {
          set((state: SyncState) => {
            const message = state.pendingMessages.find(
              (m: QueuedMessage) => m.messageId === messageId
            );
            if (message) {
              state.failedMessages.push(message);
              state.pendingMessages = state.pendingMessages.filter(
                (m: QueuedMessage) => m.messageId !== messageId
              );
            }
          });
        },

        retryMessage: (messageId: string) => {
          set((state: SyncState) => {
            const message = state.failedMessages.find(
              (m: QueuedMessage) => m.messageId === messageId
            );
            if (message) {
              message.retryCount = 0;
              message.lastAttempt = new Date().toISOString();
              state.pendingMessages.push(message);
              state.failedMessages = state.failedMessages.filter(
                (m: QueuedMessage) => m.messageId !== messageId
              );
            }
          });
        },

        clearFailed: () => {
          set((state: SyncState) => {
            state.failedMessages = [];
          });
        },

        setError: (error: string | null) => {
          set((state: SyncState) => {
            state.error = error;
          });
        },
      }),
      {
        name: "sync-storage",
        storage: createJSONStorage(() => secureStorage),
      }
    )
  )
);
