/**
 * Store types and interfaces
 */

import type { User, UserSettings } from "@domain/entities/User";
import type { Chat, GroupChat } from "@domain/entities/Chat";
import type { Message } from "@domain/entities/Message";

// Normalized entity state
export interface EntityState<T> {
  ids: string[];
  entities: Record<string, T>;
}

// Auth Store
export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  clearError: () => void;
}

// Chat Store
export interface ChatState {
  chats: EntityState<Chat>;
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ChatActions {
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  unmuteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  unarchiveChat: (chatId: string) => void;
  markChatAsRead: (chatId: string) => void;
  updateLastMessage: (chatId: string, message: Message) => void;
  createGroup: (name: string, participantIds: string[]) => GroupChat;
  // Selectors
  getAllChats: () => Chat[];
  getChatById: (chatId: string) => Chat | undefined;
  getSortedChats: () => Chat[];
  getUnreadCount: () => number;
}

// Message Store
export interface MessageState {
  messages: EntityState<Message>;
  /**
   * Secondary index: chatId → ordered array of messageIds.
   * Maintained atomically alongside `messages` so that
   * getMessagesByChatId is O(1) instead of O(n).
   */
  messagesByChatId: Record<string, string[]>;
  typingUsers: Record<string, boolean>;
  replyingTo: Message | null;
  hasMoreMessages: Record<string, boolean>;
}

export interface MessageActions {
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setReplyingTo: (message: Message | null) => void;
  addReaction: (messageId: string, userId: string, emoji: string) => void;
  removeReaction: (messageId: string, userId: string) => void;
  // Selectors
  getMessagesByChatId: (chatId: string) => Message[];
  getMessageById: (messageId: string) => Message | undefined;
}

// User Store
export interface UserState {
  users: EntityState<User>;
  currentUserSettings: UserSettings | null;
}

export interface UserActions {
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  // Selectors
  getUserById: (userId: string) => User | undefined;
  getUsersByIds: (userIds: string[]) => User[];
}

// UI Store
export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface UIState {
  toasts: Toast[];
  isOnline: boolean;
  isSyncing: boolean;
  searchQuery: string;
  showSearch: boolean;
  typingIndicators?: Record<
    string,
    {
      users: any[];
      text: string;
      isAnyoneTyping: boolean;
    }
  >;
}

export interface UIActions {
  showToast: (toast: Omit<Toast, "id">) => void;
  hideToast: (toastId: string) => void;
  setOnline: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  setShowSearch: (value: boolean) => void;
  setTypingIndicators: (
    chatId: string,
    indicators: { users: any[]; text: string; isAnyoneTyping: boolean }
  ) => void;
}

// Sync Store
export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface QueuedMessage {
  id: string;
  messageId: string;
  chatId: string;
  retryCount: number;
  lastAttempt: string;
  priority: "high" | "normal" | "low";
}

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
