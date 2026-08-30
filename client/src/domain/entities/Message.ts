/**
 * Message domain entity
 * Represents a chat message with full lifecycle
 *
 * @example
 * ```typescript
 * const message: Message = {
 *   id: 'msg-123',
 *   chatId: 'chat-456',
 *   senderId: 'user-789',
 *   content: {
 *     type: 'text',
 *     text: 'Hello World'
 *   },
 *   timestamp: new Date(),
 *   status: 'sent',
 *   reactions: [
 *     {
 *       userId: 'user-123',
 *       emoji: '👍',
 *       createdAt: new Date()
 *     }
 *   ]
 * };
 * ```
 */

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed" | "error";
export type MessageType = "text" | "image" | "video" | "audio" | "document" | "location";

/**
 * Represents a file attachment in a message
 * @interface MessageAttachment
 * @property {MessageType} type - Type of the attachment
 * @property {string} uri - URI to the attachment file
 * @property {string} [thumbnail] - URI to thumbnail image (for media files)
 * @property {number} [width] - Width of the media (for images/videos)
 * @property {number} [height] - Height of the media (for images/videos)
 * @property {number} [duration] - Duration in seconds (for audio/video)
 * @property {string} [fileName] - Original filename
 * @property {number} [fileSize] - File size in bytes
 * @property {string} [mimeType] - MIME type of the file
 */
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

/**
 * Represents a reaction to a message
 * @interface MessageReaction
 * @property {string} userId - ID of the user who reacted
 * @property {string} emoji - Emoji character used for reaction
 * @property {Date} createdAt - When the reaction was added
 */
export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

/**
 * Main message entity interface
 * @interface Message
 * @property {string} id - Unique identifier for the message
 * @property {string} chatId - ID of the chat this message belongs to
 * @property {string} senderId - ID of the user who sent the message
 * @property {MessageContent} content - Message content (text, media, etc.)
 * @property {Date} timestamp - When the message was created
 * @property {MessageStatus} status - Current delivery status
 * @property {MessageReaction[]} [reactions] - Array of message reactions
 * @property {boolean} [isEdited] - Whether message has been edited
 * @property {Date} [editedAt] - When message was last edited
 * @property {string} [replyToId] - ID of message this replies to
 * @property {MessageAttachment[]} [attachments] - File attachments
 * @property {Record<string, unknown>} [metadata] - Additional metadata
 */
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

  constructor(props: Partial<Message> & Pick<Message, "id" | "chatId" | "senderId" | "type">) {
    this.id = props.id;
    this.chatId = props.chatId;
    this.senderId = props.senderId;
    this.type = props.type;
    this.text = props.text;
    this.attachment = props.attachment;
    this.timestamp =
      props.timestamp instanceof Date ? props.timestamp : new Date(props.timestamp ?? Date.now());
    this.status = props.status ?? "sending";
    this.replyTo = props.replyTo;
    this.reactions = (props.reactions ?? []).map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
    }));
    this.edited = props.edited ?? false;
    this.editedAt =
      props.editedAt instanceof Date
        ? props.editedAt
        : props.editedAt
          ? new Date(props.editedAt)
          : undefined;
    this.metadata = props.metadata;
    this.localOnly = props.localOnly ?? false;
    this.retryCount = props.retryCount ?? 0;
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
      status: "sending",
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

  isFromUser(userId: string): boolean {
    return this.isOwn(userId);
  }

  isTextMessage(): boolean {
    return this.type === "text";
  }

  isMediaMessage(): boolean {
    return this.type === "image" || this.type === "video" || this.type === "audio";
  }

  isImageMessage(): boolean {
    return this.type === "image";
  }

  isVideoMessage(): boolean {
    return this.type === "video";
  }

  isAudioMessage(): boolean {
    return this.type === "audio";
  }

  isDocumentMessage(): boolean {
    return this.type === "document";
  }

  isSent(): boolean {
    return this.status === "sent";
  }

  isDelivered(): boolean {
    return this.status === "delivered";
  }

  isRead(): boolean {
    return this.status === "read";
  }

  isFailed(): boolean {
    return this.status === "failed" || this.status === "error";
  }

  isEdited(): boolean {
    return this.edited;
  }

  hasReactionFromUser(userId: string): boolean {
    return this.reactions.some((reaction) => reaction.userId === userId);
  }

  /**
   * Age of the message in milliseconds relative to `now` (default: current
   * time). Never negative.
   */
  getAge(now: Date | string = new Date()): number {
    const reference = now instanceof Date ? now : new Date(now);
    return Math.max(0, reference.getTime() - this.timestamp.getTime());
  }

  /** Plain-text representation used in chat bubbles and notifications. */
  toDisplayText(): string {
    return this.getPreviewText();
  }

  /** Serializes the entity to a plain JSON-compatible object. */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      chatId: this.chatId,
      senderId: this.senderId,
      type: this.type,
      text: this.text,
      attachment: this.attachment,
      timestamp: this.timestamp.toISOString(),
      status: this.status,
      replyTo: this.replyTo,
      reactions: this.reactions.map((r) => ({
        userId: r.userId,
        emoji: r.emoji,
        createdAt: r.createdAt.toISOString(),
      })),
      edited: this.edited,
      editedAt: this.editedAt ? this.editedAt.toISOString() : undefined,
      metadata: this.metadata,
      localOnly: this.localOnly,
      retryCount: this.retryCount,
    };
  }

  hasAttachment(): boolean {
    return this.type !== "text" && !!this.attachment;
  }

  canEdit(): boolean {
    return this.status !== "failed" && !this.localOnly;
  }

  canDelete(): boolean {
    return true;
  }

  addReaction(userId: string, emoji: string): void {
    const existingIndex = this.reactions.findIndex((r) => r.userId === userId);
    if (existingIndex >= 0) {
      this.reactions[existingIndex].emoji = emoji;
    } else {
      this.reactions.push({ userId, emoji, createdAt: new Date() });
    }
  }

  removeReaction(userId: string): void {
    this.reactions = this.reactions.filter((r) => r.userId !== userId);
  }

  markAsSent(): void {
    this.status = "sent";
    this.localOnly = false;
  }

  markAsDelivered(): void {
    this.status = "delivered";
  }

  markAsRead(): void {
    this.status = "read";
  }

  markAsFailed(): void {
    this.status = "failed";
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
        image: "Image",
        video: "Video",
        audio: "Voice message",
        document: "Document",
        location: "Location",
        text: "",
      };
      return typeLabels[this.type] || "Attachment";
    }
    return "";
  }
}
