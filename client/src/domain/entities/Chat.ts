/**
 * Chat domain entity
 * Represents a conversation between users
 */

import type { Message } from "./Message";

export type ChatType = "private" | "group";

export interface Chat {
  id: string;
  type: ChatType;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface GroupChat extends Chat {
  type: "group";
  name: string;
  description?: string;
  avatar?: string;
  adminIds: string[];
  createdBy: string;
}

export interface PrivateChat extends Chat {
  type: "private";
  participantId: string;
}

export interface ChatParticipant {
  userId: string;
  role: "admin" | "member";
  joinedAt: Date;
  lastReadMessageId?: string;
}

export class ChatEntity implements Chat {
  id: string;
  type: ChatType;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;

  constructor(props: Chat) {
    this.id = props.id;
    this.type = props.type;
    this.participantIds = props.participantIds;
    this.lastMessage = props.lastMessage;
    this.unreadCount = props.unreadCount;
    this.isPinned = props.isPinned;
    this.isMuted = props.isMuted;
    this.isArchived = props.isArchived;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.metadata = props.metadata;
  }

  static createPrivate(participantId: string, currentUserId: string): ChatEntity {
    const now = new Date();
    return new ChatEntity({
      id: `chat_${participantId}_${currentUserId}`,
      type: "private",
      participantIds: [currentUserId, participantId],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createGroup(
    name: string,
    participantIds: string[],
    createdBy: string
  ): ChatEntity & GroupChat {
    const now = new Date();
    return {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "group",
      name,
      description: "",
      participantIds: [...new Set([createdBy, ...participantIds])],
      adminIds: [createdBy],
      createdBy,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    } as ChatEntity & GroupChat;
  }

  updateLastMessage(message: Message): void {
    this.lastMessage = message;
    this.updatedAt = new Date();
  }

  incrementUnread(): void {
    this.unreadCount += 1;
    this.updatedAt = new Date();
  }

  markAsRead(): void {
    this.unreadCount = 0;
    this.updatedAt = new Date();
  }

  pin(): void {
    this.isPinned = true;
    this.updatedAt = new Date();
  }

  unpin(): void {
    this.isPinned = false;
    this.updatedAt = new Date();
  }

  mute(): void {
    this.isMuted = true;
    this.updatedAt = new Date();
  }

  unmute(): void {
    this.isMuted = false;
    this.updatedAt = new Date();
  }

  archive(): void {
    this.isArchived = true;
    this.updatedAt = new Date();
  }

  unarchive(): void {
    this.isArchived = false;
    this.updatedAt = new Date();
  }

  isGroup(): this is GroupChat {
    return this.type === "group";
  }

  isPrivate(): this is PrivateChat {
    return this.type === "private";
  }

  getOtherParticipantId(currentUserId: string): string | undefined {
    if (this.isPrivate()) {
      return this.participantIds.find((id) => id !== currentUserId);
    }
    return undefined;
  }

  getSortKey(): number {
    const pinPriority = this.isPinned ? Number.MAX_SAFE_INTEGER : 0;
    const timestamp = this.lastMessage?.timestamp.getTime() || this.updatedAt.getTime();
    return pinPriority + timestamp;
  }
}
