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
  name?: string;
  description?: string;
  avatar?: string;
  adminIds?: string[];
  createdBy?: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  lastActivity?: Date;
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
  lastActivity?: Date;
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
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
  // Group-only fields
  name?: string;
  description?: string;
  avatar?: string;
  adminIds?: string[];
  createdBy?: string;
  // Private-chat convenience field
  participantId?: string;

  constructor(props: Partial<Chat> & Pick<Chat, "id" | "type" | "participantIds">) {
    this.id = props.id;
    this.type = props.type;
    this.participantIds = props.participantIds;
    this.lastMessage = props.lastMessage;
    this.unreadCount = props.unreadCount ?? 0;
    this.isPinned = props.isPinned ?? false;
    this.isMuted = props.isMuted ?? false;
    this.isArchived = props.isArchived ?? false;
    this.lastActivity = props.lastActivity ?? new Date();
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.metadata = props.metadata;

    if (this.type === "group") {
      const group = props as Partial<GroupChat>;
      this.name = group.name;
      this.description = group.description;
      this.avatar = group.avatar;
      this.adminIds = group.adminIds ?? [];
      this.createdBy = group.createdBy ?? this.participantIds[0];
    } else {
      const priv = props as Partial<PrivateChat>;
      // For private chats the "other" participant defaults to the second id
      this.participantId = priv.participantId ?? this.participantIds[1];
    }
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
      lastActivity: now,
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
      lastActivity: now,
      createdAt: now,
      updatedAt: now,
    } as ChatEntity & GroupChat;
  }

  updateLastMessage(message: Message): void {
    this.lastMessage = message;
    this.lastActivity = new Date();
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
