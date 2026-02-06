import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Chat, Message, Status, Call, AppSettings, GroupChat, MessageAttachment, SyncState } from "./types";
import {
  mockUsers,
  mockChats,
  mockMessages,
  mockStatuses,
  mockCalls,
  mockGroupChats,
  autoReplies,
} from "./mockData";

interface ChatState {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  chats: Chat[];
  groupChats: GroupChat[];
  messages: Message[];
  statuses: Status[];
  calls: Call[];
  settings: AppSettings;
  syncState: SyncState;
  isLoading: boolean;
  typingUsers: Record<string, boolean>;

  login: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadPersistedState: () => Promise<void>;

  getMessagesForChat: (chatId: string) => Message[];
  sendMessage: (chatId: string, text?: string, attachment?: MessageAttachment, replyTo?: string) => void;
  deleteMessage: (messageId: string) => void;
  markChatAsRead: (chatId: string) => void;
  getUserById: (userId: string) => User | undefined;
  getChatById: (chatId: string) => Chat | GroupChat | undefined;
  getAllChats: () => (Chat | GroupChat)[];
  
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  unmuteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  
  createGroup: (name: string, participantIds: string[]) => GroupChat;
  addToGroup: (groupId: string, userId: string) => void;
  removeFromGroup: (groupId: string, userId: string) => void;
  leaveGroup: (groupId: string) => void;
  makeAdmin: (groupId: string, userId: string) => void;
  removeAdmin: (groupId: string, userId: string) => void;
  updateGroupInfo: (groupId: string, name?: string, description?: string) => void;

  addReaction: (messageId: string, reaction: string) => void;
  removeReaction: (messageId: string) => void;

  toggleDarkMode: () => void;
  setWallpaper: (wallpaper: string | null) => void;
  setFontSize: (size: "small" | "medium" | "large") => void;
  clearChatHistory: () => Promise<void>;

  setTyping: (chatId: string, isTyping: boolean) => void;
  
  syncMessages: () => Promise<void>;
  retryMessage: (messageId: string) => void;
}

const STORAGE_KEY = "@chatapp_state";

export const useChatStore = create<ChatState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  users: mockUsers,
  chats: mockChats,
  groupChats: mockGroupChats,
  messages: mockMessages,
  statuses: mockStatuses,
  calls: mockCalls,
  settings: {
    darkMode: false,
    wallpaper: null,
    fontSize: "medium",
    notifications: true,
  },
  syncState: {
    lastSyncTimestamp: null,
    pendingMessages: [],
    syncStatus: "idle",
  },
  isLoading: true,
  typingUsers: {},

  loadPersistedState: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          currentUser: parsed.currentUser || null,
          isAuthenticated: parsed.isAuthenticated || false,
          messages: parsed.messages || mockMessages,
          chats: parsed.chats || mockChats,
          groupChats: parsed.groupChats || mockGroupChats,
          settings: parsed.settings || { darkMode: false, wallpaper: null, fontSize: "medium", notifications: true },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to load persisted state:", error);
      set({ isLoading: false });
    }
  },

  login: async (phone: string) => {
    const user: User = {
      id: "currentUser",
      name: "You",
      phone,
      isOnline: true,
    };
    set({ currentUser: user });
  },

  verifyOtp: async (otp: string) => {
    if (otp.length === 6) {
      const { currentUser, messages, chats, groupChats, settings } = get();
      set({ isAuthenticated: true });
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentUser,
          isAuthenticated: true,
          messages,
          chats,
          groupChats,
          settings,
        })
      );
      return true;
    }
    return false;
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      currentUser: null,
      isAuthenticated: false,
      messages: mockMessages,
      chats: mockChats,
      groupChats: mockGroupChats,
    });
  },

  getMessagesForChat: (chatId: string) => {
    return get().messages.filter((m) => m.chatId === chatId);
  },

  sendMessage: (chatId: string, text?: string, attachment?: MessageAttachment, replyTo?: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: "currentUser",
      text,
      attachment,
      timestamp: new Date().toISOString(),
      status: "sending",
      replyTo,
    };

    const { messages, chats, groupChats } = get();
    const updatedMessages = [...messages, newMessage];
    
    const updatedChats = chats.map((chat) =>
      chat.id === chatId ? { ...chat, lastMessage: newMessage } : chat
    );
    
    const updatedGroupChats = groupChats.map((chat) =>
      chat.id === chatId ? { ...chat, lastMessage: newMessage } : chat
    );

    set({ messages: updatedMessages, chats: updatedChats, groupChats: updatedGroupChats });

    const { currentUser, isAuthenticated, settings } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentUser,
        isAuthenticated,
        messages: updatedMessages,
        chats: updatedChats,
        groupChats: updatedGroupChats,
        settings,
      })
    );

    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === newMessage.id ? { ...m, status: "sent" } : m
        ),
      }));
    }, 500);

    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === newMessage.id ? { ...m, status: "delivered" } : m
        ),
      }));
    }, 1000);

    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === newMessage.id ? { ...m, status: "read" } : m
        ),
      }));
    }, 2000);

    const chat = chats.find((c) => c.id === chatId);
    if (chat && chat.type === "private" && chat.participantId) {
      setTimeout(() => {
        set((state) => ({
          typingUsers: { ...state.typingUsers, [chat.participantId!]: true },
        }));
      }, 1500);

      setTimeout(() => {
        const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        const replyMessage: Message = {
          id: `msg_${Date.now()}_reply`,
          chatId,
          senderId: chat.participantId!,
          text: replyText,
          timestamp: new Date().toISOString(),
          status: "read",
        };

        set((state) => {
          const newMessages = [...state.messages, replyMessage];
          const newChats = state.chats.map((c) =>
            c.id === chatId
              ? { ...c, lastMessage: replyMessage, unreadCount: c.unreadCount + 1 }
              : c
          );
          return {
            messages: newMessages,
            chats: newChats,
            typingUsers: { ...state.typingUsers, [chat.participantId!]: false },
          };
        });
      }, 3500);
    }
  },

  deleteMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  markChatAsRead: (chatId: string) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
      groupChats: state.groupChats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  getUserById: (userId: string) => {
    return get().users.find((u) => u.id === userId);
  },

  getChatById: (chatId: string) => {
    const { chats, groupChats } = get();
    return chats.find((c) => c.id === chatId) || groupChats.find((c) => c.id === chatId);
  },

  getAllChats: () => {
    const { chats, groupChats } = get();
    return [...chats, ...groupChats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.timestamp || "";
      const bTime = b.lastMessage?.timestamp || "";
      return bTime.localeCompare(aTime);
    });
  },

  pinChat: (chatId: string) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, isPinned: true } : c
      ),
      groupChats: state.groupChats.map((c) =>
        c.id === chatId ? { ...c, isPinned: true } : c
      ),
    }));
  },

  unpinChat: (chatId: string) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, isPinned: false } : c
      ),
      groupChats: state.groupChats.map((c) =>
        c.id === chatId ? { ...c, isPinned: false } : c
      ),
    }));
  },

  muteChat: (chatId: string) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, isMuted: true } : c
      ),
      groupChats: state.groupChats.map((c) =>
        c.id === chatId ? { ...c, isMuted: true } : c
      ),
    }));
  },

  unmuteChat: (chatId: string) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, isMuted: false } : c
      ),
      groupChats: state.groupChats.map((c) =>
        c.id === chatId ? { ...c, isMuted: false } : c
      ),
    }));
  },

  archiveChat: (chatId: string) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, isArchived: true } : c
      ),
      groupChats: state.groupChats.map((c) =>
        c.id === chatId ? { ...c, isArchived: true } : c
      ),
    }));
  },

  createGroup: (name: string, participantIds: string[]) => {
    const newGroup: GroupChat = {
      id: `group_${Date.now()}`,
      type: "group",
      name,
      participants: ["currentUser", ...participantIds],
      adminIds: ["currentUser"],
      createdBy: "currentUser",
      createdAt: new Date().toISOString(),
      unreadCount: 0,
    };
    
    set((state) => ({
      groupChats: [...state.groupChats, newGroup],
    }));
    
    return newGroup;
  },

  addToGroup: (groupId: string, userId: string) => {
    set((state) => ({
      groupChats: state.groupChats.map((g) =>
        g.id === groupId
          ? { ...g, participants: [...(g.participants || []), userId] }
          : g
      ),
    }));
  },

  removeFromGroup: (groupId: string, userId: string) => {
    set((state) => ({
      groupChats: state.groupChats.map((g) =>
        g.id === groupId
          ? {
              ...g,
              participants: (g.participants || []).filter((p) => p !== userId),
              adminIds: g.adminIds.filter((a) => a !== userId),
            }
          : g
      ),
    }));
  },

  leaveGroup: (groupId: string) => {
    const { groupChats } = get();
    const group = groupChats.find((g) => g.id === groupId);
    
    if (group) {
      if (group.adminIds.length === 1 && group.adminIds[0] === "currentUser") {
        const newAdmin = group.participants?.find((p) => p !== "currentUser");
        if (newAdmin) {
          set((state) => ({
            groupChats: state.groupChats.map((g) =>
              g.id === groupId
                ? {
                    ...g,
                    participants: (g.participants || []).filter((p) => p !== "currentUser"),
                    adminIds: [newAdmin],
                  }
                : g
            ),
          }));
        }
      } else {
        set((state) => ({
          groupChats: state.groupChats.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  participants: (g.participants || []).filter((p) => p !== "currentUser"),
                  adminIds: g.adminIds.filter((a) => a !== "currentUser"),
                }
              : g
          ),
        }));
      }
    }
  },

  makeAdmin: (groupId: string, userId: string) => {
    set((state) => ({
      groupChats: state.groupChats.map((g) =>
        g.id === groupId && !g.adminIds.includes(userId)
          ? { ...g, adminIds: [...g.adminIds, userId] }
          : g
      ),
    }));
  },

  removeAdmin: (groupId: string, userId: string) => {
    set((state) => ({
      groupChats: state.groupChats.map((g) =>
        g.id === groupId
          ? { ...g, adminIds: g.adminIds.filter((a) => a !== userId) }
          : g
      ),
    }));
  },

  updateGroupInfo: (groupId: string, name?: string, description?: string) => {
    set((state) => ({
      groupChats: state.groupChats.map((g) =>
        g.id === groupId
          ? { ...g, ...(name && { name }), ...(description !== undefined && { description }) }
          : g
      ),
    }));
  },

  addReaction: (messageId: string, reaction: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, reactions: { ...(m.reactions || {}), currentUser: reaction } }
          : m
      ),
    }));
  },

  removeReaction: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id === messageId && m.reactions) {
          const { currentUser, ...rest } = m.reactions;
          return { ...m, reactions: Object.keys(rest).length > 0 ? rest : undefined };
        }
        return m;
      }),
    }));
  },

  toggleDarkMode: () => {
    set((state) => ({
      settings: { ...state.settings, darkMode: !state.settings.darkMode },
    }));
  },

  setWallpaper: (wallpaper: string | null) => {
    set((state) => ({
      settings: { ...state.settings, wallpaper },
    }));
  },

  setFontSize: (fontSize: "small" | "medium" | "large") => {
    set((state) => ({
      settings: { ...state.settings, fontSize },
    }));
  },

  clearChatHistory: async () => {
    set({ messages: [], chats: mockChats.map((c) => ({ ...c, lastMessage: undefined, unreadCount: 0 })) });
    const { currentUser, isAuthenticated, settings, groupChats } = get();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentUser,
        isAuthenticated,
        messages: [],
        chats: mockChats.map((c) => ({ ...c, lastMessage: undefined, unreadCount: 0 })),
        groupChats,
        settings,
      })
    );
  },

  setTyping: (chatId: string, isTyping: boolean) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [chatId]: isTyping },
    }));
  },

  syncMessages: async () => {
    set((state) => ({
      syncState: { ...state.syncState, syncStatus: "syncing" },
    }));

    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    set((state) => ({
      syncState: {
        ...state.syncState,
        syncStatus: "idle",
        lastSyncTimestamp: new Date().toISOString(),
        pendingMessages: [],
      },
    }));
  },

  retryMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, status: "sending" } : m
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, status: "sent" } : m
        ),
      }));
    }, 1000);
  },
}));
