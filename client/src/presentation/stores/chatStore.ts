/**
 * Chat store
 * Manages chat conversations with normalized state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MMKV } from "react-native-mmkv";

import type { Chat, GroupChat } from "@domain/entities/Chat";
import { ChatEntity } from "@domain/entities/Chat";
import type { Message } from "@domain/entities/Message";
import type { ChatState, ChatActions, EntityState } from "./types";

const storage = new MMKV({ id: "chat-storage" });

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

type ChatStore = ChatState & ChatActions;

const initialEntityState: EntityState<Chat> = {
  ids: [],
  entities: {},
};

const initialState: ChatState = {
  chats: initialEntityState,
  activeChatId: null,
  isLoading: false,
  error: null,
};

export const useChatStore = create<ChatStore>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,

        setChats: (chats: Chat[]) => {
          set((state) => {
            state.chats.ids = chats.map((c) => c.id);
            state.chats.entities = chats.reduce(
              (acc, chat) => {
                acc[chat.id] = chat;
                return acc;
              },
              {} as Record<string, Chat>
            );
          });
        },

        addChat: (chat: Chat) => {
          set((state) => {
            if (!state.chats.entities[chat.id]) {
              state.chats.ids.push(chat.id);
            }
            state.chats.entities[chat.id] = chat;
          });
        },

        updateChat: (chatId: string, updates: Partial<Chat>) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              state.chats.entities[chatId] = { ...chat, ...updates, updatedAt: new Date() };
            }
          });
        },

        removeChat: (chatId: string) => {
          set((state) => {
            state.chats.ids = state.chats.ids.filter((id) => id !== chatId);
            delete state.chats.entities[chatId];
          });
        },

        setActiveChat: (chatId: string | null) => {
          set((state) => {
            state.activeChatId = chatId;
          });
        },

        pinChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.isPinned = true;
              chat.updatedAt = new Date();
            }
          });
        },

        unpinChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.isPinned = false;
              chat.updatedAt = new Date();
            }
          });
        },

        muteChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.isMuted = true;
              chat.updatedAt = new Date();
            }
          });
        },

        unmuteChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.isMuted = false;
              chat.updatedAt = new Date();
            }
          });
        },

        archiveChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.isArchived = true;
              chat.updatedAt = new Date();
            }
          });
        },

        unarchiveChat: (chatId: string) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.isArchived = false;
              chat.updatedAt = new Date();
            }
          });
        },

        markChatAsRead: (chatId: string) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.unreadCount = 0;
              chat.updatedAt = new Date();
            }
          });
        },

        updateLastMessage: (chatId: string, message: Message) => {
          set((state) => {
            const chat = state.chats.entities[chatId];
            if (chat) {
              chat.lastMessage = message;
              chat.updatedAt = new Date();
            }
          });
        },

        createGroup: (name: string, participantIds: string[]) => {
          const currentUserId = "currentUser"; // Get from auth store in real implementation
          const groupChat = ChatEntity.createGroup(name, participantIds, currentUserId);

          set((state) => {
            state.chats.ids.push(groupChat.id);
            state.chats.entities[groupChat.id] = groupChat;
          });

          return groupChat as GroupChat;
        },

        // Selectors
        getAllChats: () => {
          const { chats } = get();
          return chats.ids.map((id) => chats.entities[id]);
        },

        getChatById: (chatId: string) => {
          return get().chats.entities[chatId];
        },

        getSortedChats: () => {
          const { chats } = get();
          return chats.ids
            .map((id) => chats.entities[id])
            .filter((chat) => !chat.isArchived)
            .sort((a, b) => {
              // Pinned chats first
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;

              // Then by last message timestamp
              const aTime = a.lastMessage?.timestamp.getTime() || a.updatedAt.getTime();
              const bTime = b.lastMessage?.timestamp.getTime() || b.updatedAt.getTime();
              return bTime - aTime;
            });
        },

        getUnreadCount: () => {
          const { chats } = get();
          return chats.ids.reduce((total, id) => {
            const chat = chats.entities[id];
            return chat && !chat.isMuted ? total + chat.unreadCount : total;
          }, 0);
        },
      }),
      {
        name: "chat-storage",
        storage: createJSONStorage(() => mmkvStorage),
        partialize: (state) => ({
          chats: state.chats,
        }),
      }
    )
  )
);
