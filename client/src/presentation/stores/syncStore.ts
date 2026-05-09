/**
 * Sync Store
 * Manages synchronization state and pending message queue
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MMKV } from "react-native-mmkv";
import type { SyncState, SyncActions, QueuedMessage, SyncStatus } from "./types";

const storage = new MMKV({ id: "sync-storage" });

const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};

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
      (set, get) => ({
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
        storage: createJSONStorage(() => mmkvStorage),
      }
    )
  )
);
