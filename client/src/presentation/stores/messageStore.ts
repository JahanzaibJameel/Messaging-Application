/**
 * Message Store
 *
 * Normalized state with a secondary chat index for O(1) per-chat lookups.
 *
 * State shape:
 *   messages.entities  — Record<messageId, Message>
 *   messages.ids       — ordered insertion list of all messageIds
 *   messagesByChatId   — Record<chatId, messageId[]>  ← secondary index
 *
 * The index is maintained atomically in every mutation that touches messages,
 * so getMessagesByChatId never has to scan the full message collection.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MMKV } from "react-native-mmkv";

import type { Message } from "@domain/entities/Message";
import type { MessageState, MessageActions, EntityState } from "./types";

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const storage = new MMKV({ id: "message-storage" });

const mmkvStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => storage.set(name, value),
  removeItem: (name: string): void => storage.delete(name),
};

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialEntityState: EntityState<Message> = {
  ids: [],
  entities: {},
};

const initialState: MessageState = {
  messages: initialEntityState,
  messagesByChatId: {},
  typingUsers: {},
  replyingTo: null,
  hasMoreMessages: {},
};

// ---------------------------------------------------------------------------
// Private helpers (pure, work on Immer drafts)
// ---------------------------------------------------------------------------

/** Appends a message to the normalized entities and the chat index. */
function _addToIndex(
  state: MessageState,
  message: Message
): void {
  // Entities
  if (!state.messages.entities[message.id]) {
    state.messages.ids.push(message.id);
  }
  state.messages.entities[message.id] = message;

  // Chat index
  if (!state.messagesByChatId[message.chatId]) {
    state.messagesByChatId[message.chatId] = [];
  }
  if (!state.messagesByChatId[message.chatId].includes(message.id)) {
    state.messagesByChatId[message.chatId].push(message.id);
  }
}

/** Removes a message from the normalized entities and the chat index. */
function _removeFromIndex(
  state: MessageState,
  messageId: string
): void {
  const message = state.messages.entities[messageId];
  if (!message) return;

  // Entities
  state.messages.ids = state.messages.ids.filter((id) => id !== messageId);
  delete state.messages.entities[messageId];

  // Chat index
  const chatIndex = state.messagesByChatId[message.chatId];
  if (chatIndex) {
    state.messagesByChatId[message.chatId] = chatIndex.filter((id) => id !== messageId);
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type MessageStore = MessageState & MessageActions;

export const useMessageStore = create<MessageStore>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,

        // ----------------------------------------------------------------
        // Mutations
        // ----------------------------------------------------------------

        /**
         * Bulk-load messages for a specific chat, e.g. when fetching from
         * the server. Existing messages with the same ID are overwritten.
         */
        setMessages: (chatId: string, messages: Message[]) => {
          set((state) => {
            messages.forEach((message) => _addToIndex(state, message));
          });
        },

        /** Add a single message (e.g. sent or received in real time). */
        addMessage: (message: Message) => {
          set((state) => {
            _addToIndex(state, message);
          });
        },

        /** Add multiple messages in one atomic update (e.g. sync batch). */
        addMessages: (messages: Message[]) => {
          set((state) => {
            messages.forEach((message) => _addToIndex(state, message));
          });
        },

        /** Update fields on an existing message (e.g. status change). */
        updateMessage: (messageId: string, updates: Partial<Message>) => {
          set((state) => {
            const existing = state.messages.entities[messageId];
            if (existing) {
              state.messages.entities[messageId] = { ...existing, ...updates };
            }
          });
        },

        /** Remove a message and clean up the chat index. */
        deleteMessage: (messageId: string) => {
          set((state) => {
            _removeFromIndex(state, messageId);
          });
        },

        /** Wipe all messages and the index (e.g. on logout). */
        clearMessages: () => {
          set((state) => {
            state.messages.ids = [];
            state.messages.entities = {};
            state.messagesByChatId = {};
          });
        },

        setTyping: (chatId: string, userId: string, isTyping: boolean) => {
          set((state) => {
            const key = `${chatId}:${userId}`;
            state.typingUsers[key] = isTyping;
          });
        },

        setReplyingTo: (message: Message | null) => {
          set((state) => {
            state.replyingTo = message;
          });
        },

        addReaction: (messageId: string, userId: string, emoji: string) => {
          set((state) => {
            const message = state.messages.entities[messageId];
            if (!message) return;
            const idx = message.reactions.findIndex((r) => r.userId === userId);
            if (idx >= 0) {
              message.reactions[idx].emoji = emoji;
            } else {
              message.reactions.push({ userId, emoji, createdAt: new Date() });
            }
          });
        },

        removeReaction: (messageId: string, userId: string) => {
          set((state) => {
            const message = state.messages.entities[messageId];
            if (message) {
              message.reactions = message.reactions.filter((r) => r.userId !== userId);
            }
          });
        },

        // ----------------------------------------------------------------
        // Selectors
        // ----------------------------------------------------------------

        /**
         * O(1) lookup via the chat index.
         * Sorts by timestamp ascending (oldest first) for display.
         */
        getMessagesByChatId: (chatId: string) => {
          const { messages, messagesByChatId } = get();
          const ids = messagesByChatId[chatId] ?? [];
          return ids
            .map((id) => messages.entities[id])
            .filter(Boolean) // guard against stale index entries
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        },

        getMessageById: (messageId: string) => {
          return get().messages.entities[messageId];
        },
      }),
      {
        name: "message-storage",
        storage: createJSONStorage(() => mmkvStorage),
        // Persist both the entity map and the index so the index
        // survives app restarts without needing a rebuild pass.
        partialize: (state) => ({
          messages: state.messages,
          messagesByChatId: state.messagesByChatId,
        }),
      }
    )
  )
);
