/**
 * Type definitions for the chat application
 * @module types
 */

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: string;
}

export interface MessageAttachment {
  type: "image" | "video" | "audio" | "document";
  uri: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
  fileSize?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  attachment?: MessageAttachment;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  replyTo?: string;
  reactions?: Record<string, string>;
  edited?: boolean;
  editedAt?: string;
}

export interface Chat {
  id: string;
  type: "private" | "group";
  participantId?: string;
  participants?: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  createdAt: string;
}

export interface GroupChat extends Chat {
  type: "group";
  name: string;
  description?: string;
  avatar?: string;
  adminIds: string[];
  createdBy: string;
  createdAt: string;
}

export interface Status {
  id: string;
  userId: string;
  imageUrl?: string;
  timestamp: string;
  viewed: boolean;
  expiresAt: string;
}

export interface Call {
  id: string;
  participantId: string;
  participantName: string;
  type: "audio" | "video";
  direction: "incoming" | "outgoing";
  status: "answered" | "missed" | "declined";
  timestamp: string;
  duration?: number;
}

export interface AppSettings {
  darkMode: boolean;
  wallpaper: string | null;
  fontSize: "small" | "medium" | "large";
  notifications: boolean;
  soundEnabled: boolean;
  blurredChatList: boolean;
}

export interface SyncState {
  lastSyncTimestamp: string | null;
  pendingMessages: Message[];
  syncStatus: "idle" | "syncing" | "error";
  error?: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export interface ChatListState {
  chats: Chat[];
  groupChats: GroupChat[];
  filteredChats: (Chat | GroupChat)[];
  searchQuery: string;
  isLoading: boolean;
}

export interface ChatState {
  messages: Message[];
  typingUsers: Record<string, boolean>;
  selectedMessage?: Message;
  replyingTo?: Message;
}
