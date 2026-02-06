export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface MessageAttachment {
  type: "image" | "video";
  uri: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
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
  reactions?: { [userId: string]: string };
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
}

export interface SyncState {
  lastSyncTimestamp: string | null;
  pendingMessages: Message[];
  syncStatus: "idle" | "syncing" | "error";
}
