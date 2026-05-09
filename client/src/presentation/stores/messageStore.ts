/**
 * Message store
 * Manages chat messages with normalized state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MMKV } from "react-native-mmkv";

import type { Message } from "@domain/entities/Message";
import { MessageEntity } from "@domain/entities/Message";
import type { MessageState, MessageActions, EntityState } from "./types";

const storage = new MMKV({ id: "message-storage" });

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

type MessageStore = MessageState & MessageActions;

const initialEntityState: EntityState<Message> = {
  ids: [],
  entities: {},
};

const initialState: MessageState = {
  messages: initialEntityState,
  typingUsers: {},
  replyingTo: null,
  hasMoreMessages: {},
};

export const useMessageStore = create<MessageStore>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,

        setMessages: (chatId: string, messages: Message[]) => {
          set((state) => {
            messages.forEach((message) => {
              if (!state.messages.entities[message.id]) {
                state.messages.ids.push(message.id);
              }
              state.messages.entities[message.id] = message;
            });
          });
        },

        addMessage: (message: Message) => {
          set((state) => {
            if (!state.messages.entities[message.id]) {
              state.messages.ids.push(message.id);
            }
            state.messages.entities[message.id] = message;
          });
        },

        updateMessage: (messageId: string, updates: Partial<Message>) => {
          set((state) => {
            const message = state.messages.entities[messageId];
            if (message) {
              state.messages.entities[messageId] = { ...message, ...updates };
            }
          });
        },

        deleteMessage: (messageId: string) => {
          set((state) => {
            state.messages.ids = state.messages.ids.filter((id) => id !== messageId);
            delete state.messages.entities[messageId];
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
            if (message) {
              const existingIndex = message.reactions.findIndex((r) => r.userId === userId);
              if (existingIndex >= 0) {
                message.reactions[existingIndex].emoji = emoji;
              } else {
                message.reactions.push({ userId, emoji, createdAt: new Date() });
              }
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

        // Selectors
        getMessagesByChatId: (chatId: string) => {
          const { messages } = get();
          return messages.ids
            .map((id) => messages.entities[id])
            .filter((message) => message.chatId === chatId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        },

        getMessageById: (messageId: string) => {
          return get().messages.entities[messageId];
        },
      }),
      {
        name: "message-storage",
        storage: createJSONStorage(() => mmkvStorage),
        partialize: (state) => ({
          messages: state.messages,
        }),
      }
    )
  )
);
