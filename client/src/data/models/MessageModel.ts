/**
 * Message data model for storage
 * Serializable representation of Message entity
 */

import type { MessageStatus, MessageType } from "@/domain/entities/Message";

export interface MessageAttachmentModel {
  type: MessageType;
  uri: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface MessageReactionModel {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface MessageModel {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  attachment?: MessageAttachmentModel;
  timestamp: string;
  status: MessageStatus;
  replyTo?: string;
  reactions: MessageReactionModel[];
  edited: boolean;
  editedAt?: string;
  metadata?: Record<string, unknown>;
  localOnly?: boolean;
  retryCount?: number;
}

export interface ChatModel {
  id: string;
  type: "private" | "group";
  participantIds: string[];
  lastMessage?: MessageModel;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  // Group specific
  name?: string;
  description?: string;
  avatar?: string;
  adminIds?: string[];
  createdBy?: string;
}

export interface UserModel {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}
