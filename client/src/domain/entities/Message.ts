/**
 * Message domain entity
 * Represents a chat message with full lifecycle
 */

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'error';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';

export interface MessageAttachment {
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

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  attachment?: MessageAttachment;
  timestamp: Date;
  status: MessageStatus;
  replyTo?: string;
  reactions: MessageReaction[];
  edited: boolean;
  editedAt?: Date;
  metadata?: Record<string, unknown>;
  localOnly?: boolean;
  retryCount?: number;
}

export interface CreateMessageInput {
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  attachment?: MessageAttachment;
  replyTo?: string;
}

export class MessageEntity implements Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  attachment?: MessageAttachment;
  timestamp: Date;
  status: MessageStatus;
  replyTo?: string;
  reactions: MessageReaction[];
  edited: boolean;
  editedAt?: Date;
  metadata?: Record<string, unknown>;
  localOnly?: boolean;
  retryCount?: number;

  constructor(props: Message) {
    this.id = props.id;
    this.chatId = props.chatId;
    this.senderId = props.senderId;
    this.type = props.type;
    this.text = props.text;
    this.attachment = props.attachment;
    this.timestamp = props.timestamp;
    this.status = props.status;
    this.replyTo = props.replyTo;
    this.reactions = props.reactions || [];
    this.edited = props.edited || false;
    this.editedAt = props.editedAt;
    this.metadata = props.metadata;
    this.localOnly = props.localOnly;
    this.retryCount = props.retryCount || 0;
  }

  static create(input: CreateMessageInput): MessageEntity {
    return new MessageEntity({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId: input.chatId,
      senderId: input.senderId,
      type: input.type,
      text: input.text,
      attachment: input.attachment,
      timestamp: new Date(),
      status: 'sending',
      replyTo: input.replyTo,
      reactions: [],
      edited: false,
      localOnly: true,
      retryCount: 0,
    });
  }

  isOwn(userId: string): boolean {
    return this.senderId === userId;
  }

  hasAttachment(): boolean {
    return this.type !== 'text' && !!this.attachment;
  }

  canEdit(): boolean {
    return this.status !== 'failed' && !this.localOnly;
  }

  canDelete(): boolean {
    return true;
  }

  addReaction(userId: string, emoji: string): void {
    const existingIndex = this.reactions.findIndex(r => r.userId === userId);
    if (existingIndex >= 0) {
      this.reactions[existingIndex].emoji = emoji;
    } else {
      this.reactions.push({ userId, emoji, createdAt: new Date() });
    }
  }

  removeReaction(userId: string): void {
    this.reactions = this.reactions.filter(r => r.userId !== userId);
  }

  markAsSent(): void {
    this.status = 'sent';
    this.localOnly = false;
  }

  markAsDelivered(): void {
    this.status = 'delivered';
  }

  markAsRead(): void {
    this.status = 'read';
  }

  markAsFailed(): void {
    this.status = 'failed';
  }

  incrementRetry(): void {
    this.retryCount = (this.retryCount || 0) + 1;
  }

  edit(newText: string): void {
    this.text = newText;
    this.edited = true;
    this.editedAt = new Date();
  }

  getPreviewText(): string {
    if (this.text) return this.text;
    if (this.attachment) {
      const typeLabels: Record<MessageType, string> = {
        image: 'Image',
        video: 'Video',
        audio: 'Voice message',
        document: 'Document',
        location: 'Location',
        text: '',
      };
      return typeLabels[this.type] || 'Attachment';
    }
    return '';
  }
}
