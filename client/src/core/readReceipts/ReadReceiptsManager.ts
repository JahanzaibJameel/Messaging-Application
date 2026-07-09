/**
 * Read Receipts Manager
 * Handles tracking and managing read receipts for messages
 */

import { useMessageStore, useChatStore } from "../../presentation/stores";
import { AppError } from "../errors";
import { logger } from "../logger";
import type { Message } from "../../domain/entities/Message";

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
  chatId: string;
}

export interface ReadReceiptsConfig {
  enableReadReceipts: boolean;
  autoMarkAsRead: boolean;
  readDelay: number; // Delay before marking as read (ms)
}

const DEFAULT_CONFIG: ReadReceiptsConfig = {
  enableReadReceipts: true,
  autoMarkAsRead: true,
  readDelay: 1000, // 1 second
};

export class ReadReceiptsManager {
  private config: ReadReceiptsConfig;
  private pendingReads: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isDestroyed = false;

  constructor(config: Partial<ReadReceiptsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Mark a message as read for a specific user
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    if (!this.config.enableReadReceipts || this.isDestroyed) {
      return;
    }

    try {
      const messageStore = useMessageStore.getState();
      const message = messageStore.getMessageById(messageId);

      if (!message) {
        logger.warn(`Message not found for read receipt: ${messageId}`, "ReadReceiptsManager");
        return;
      }

      // Don't mark own messages as read
      if (message.senderId === userId) {
        return;
      }

      // Don't mark if already read
      if (message.status === "read") {
        return;
      }

      // Update message status
      messageStore.updateMessage(messageId, { status: "read" });

      // Create read receipt record
      const readReceipt: ReadReceipt = {
        messageId,
        userId,
        readAt: new Date().toISOString(),
        chatId: message.chatId,
      };

      // Store read receipt (would be sent to server)
      await this.storeReadReceipt(readReceipt);

      // Update last read timestamp for chat (using metadata for now)
      const chatStore = useChatStore.getState();
      const existingChat = chatStore.getChatById(message.chatId);
      chatStore.updateChat(message.chatId, {
        metadata: {
          ...existingChat?.metadata,
          lastReadAt: readReceipt.readAt,
        },
      });

      logger.info(`Message marked as read: ${messageId} by ${userId}`, "ReadReceiptsManager");
    } catch (error) {
      logger.error("Failed to mark message as read", error as Error, "ReadReceiptsManager");
      throw AppError.network("Failed to mark message as read", error as Error);
    }
  }

  /**
   * Mark multiple messages as read (batch operation)
   */
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    if (!this.config.enableReadReceipts || this.isDestroyed) {
      return;
    }

    try {
      const messageStore = useMessageStore.getState();
      const chatStore = useChatStore.getState();

      // Get all messages
      const messages = messageIds
        .map((id) => messageStore.getMessageById(id))
        .filter(Boolean) as Message[];

      // Filter out own messages and already read messages
      const messagesToRead = messages.filter(
        (msg) => msg.senderId !== userId && msg.status !== "read"
      );

      if (messagesToRead.length === 0) {
        return;
      }

      // Update all message statuses
      for (const message of messagesToRead) {
        messageStore.updateMessage(message.id, { status: "read" });
      }

      // Create batch read receipts
      const readReceipts: ReadReceipt[] = messagesToRead.map((message) => ({
        messageId: message.id,
        userId,
        readAt: new Date().toISOString(),
        chatId: message.chatId,
      }));

      // Store batch read receipts
      await this.storeBatchReadReceipts(readReceipts);

      // Update chat last read timestamps
      const chatUpdates = new Map<string, { lastReadAt: string }>();
      for (const receipt of readReceipts) {
        const currentUpdate = chatUpdates.get(receipt.chatId);
        if (!currentUpdate || receipt.readAt > currentUpdate.lastReadAt) {
          chatUpdates.set(receipt.chatId, { lastReadAt: receipt.readAt });
        }
      }

      for (const [chatId, update] of chatUpdates) {
        const existingChat = chatStore.getChatById(chatId);
        chatStore.updateChat(chatId, {
          metadata: {
            ...existingChat?.metadata,
            ...update,
          },
        });
      }

      logger.info(
        `Marked ${messagesToRead.length} messages as read by ${userId}`,
        "ReadReceiptsManager"
      );
    } catch (error) {
      logger.error("Failed to mark messages as read", error as Error, "ReadReceiptsManager");
      throw AppError.network("Failed to mark messages as read", error as Error);
    }
  }

  /**
   * Auto-mark messages as read when chat is opened
   */
  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    if (!this.config.autoMarkAsRead || !this.config.enableReadReceipts) {
      return;
    }

    try {
      const messageStore = useMessageStore.getState();
      const chatStore = useChatStore.getState();

      // Get chat
      const chat = chatStore.getChatById(chatId);
      if (!chat) {
        return;
      }

      // Don't mark own chat as read (check if user is in participants)
      if (!chat.participantIds.includes(userId)) {
        return;
      }

      // Get unread messages
      const messages = messageStore.getMessagesByChatId(chatId);
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== userId && msg.status !== "read"
      );

      if (unreadMessages.length === 0) {
        return;
      }

      // Schedule read with delay
      const timerKey = `${chatId}_${userId}`;

      // Clear existing timer
      if (this.pendingReads.has(timerKey)) {
        clearTimeout(this.pendingReads.get(timerKey)!);
      }

      // Schedule new read
      const timer = setTimeout(() => {
        this.markMessagesAsRead(
          unreadMessages.map((m) => m.id),
          userId
        );
        this.pendingReads.delete(timerKey);
      }, this.config.readDelay);

      this.pendingReads.set(timerKey, timer);

      logger.info(
        `Scheduled read receipts for ${unreadMessages.length} messages in chat ${chatId}`,
        "ReadReceiptsManager"
      );
    } catch (error) {
      logger.error("Failed to mark chat as read", error as Error, "ReadReceiptsManager");
    }
  }

  /**
   * Cancel pending read receipts for a chat
   */
  cancelPendingReads(chatId: string, userId: string): void {
    const timerKey = `${chatId}_${userId}`;
    const timer = this.pendingReads.get(timerKey);

    if (timer) {
      clearTimeout(timer);
      this.pendingReads.delete(timerKey);
      logger.info(`Cancelled pending read receipts for chat ${chatId}`, "ReadReceiptsManager");
    }
  }

  /**
   * Get read receipt status for a message
   */
  getReadReceiptStatus(messageId: string): {
    isRead: boolean;
    readBy: string[];
    readAt?: string;
  } {
    const messageStore = useMessageStore.getState();
    const message = messageStore.getMessageById(messageId);

    if (!message) {
      return { isRead: false, readBy: [] };
    }

    // For simplicity, return basic status
    // In a real implementation, this would query the read receipts store
    return {
      isRead: message.status === "read",
      readBy: message.status === "read" ? ["recipient"] : [],
      readAt: message.status === "read" ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Get unread count for a chat
   */
  getUnreadCount(chatId: string, userId: string): number {
    const messageStore = useMessageStore.getState();
    const messages = messageStore.getMessagesByChatId(chatId);

    return messages.filter((msg) => msg.senderId !== userId && msg.status !== "read").length;
  }

  /**
   * Get total unread count across all chats
   */
  getTotalUnreadCount(userId: string): number {
    const chatStore = useChatStore.getState();
    const messageStore = useMessageStore.getState();

    let total = 0;
    const chats = chatStore.getAllChats();
    for (const chat of chats) {
      const messages = messageStore.getMessagesByChatId(chat.id);
      total += messages.filter((msg) => msg.senderId !== userId && msg.status !== "read").length;
    }

    return total;
  }

  /**
   * Store read receipt (would send to server)
   */
  private async storeReadReceipt(readReceipt: ReadReceipt): Promise<void> {
    // In a real implementation, this would send to server
    // For now, just log it
    logger.debug(
      `Storing read receipt: ${readReceipt.messageId} by ${readReceipt.userId}`,
      "ReadReceiptsManager"
    );
  }

  /**
   * Store batch read receipts (would send to server)
   */
  private async storeBatchReadReceipts(readReceipts: ReadReceipt[]): Promise<void> {
    // In a real implementation, this would send to server
    // For now, just log it
    logger.debug(
      `Storing batch read receipts: ${readReceipts.length} receipts`,
      "ReadReceiptsManager"
    );
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReadReceiptsConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info(
      `Read receipts config updated - enableReadReceipts: ${config.enableReadReceipts}, autoMarkAsRead: ${config.autoMarkAsRead}`,
      "ReadReceiptsManager"
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): ReadReceiptsConfig {
    return { ...this.config };
  }

  /**
   * Clear all pending read receipts
   */
  clearPendingReads(): void {
    for (const timer of this.pendingReads.values()) {
      clearTimeout(timer);
    }
    this.pendingReads.clear();
    logger.info("Cleared all pending read receipts", "ReadReceiptsManager");
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    this.isDestroyed = true;
    this.clearPendingReads();
    logger.info("Read receipts manager destroyed", "ReadReceiptsManager");
  }
}

// Singleton instance
let readReceiptsManagerInstance: ReadReceiptsManager | null = null;

export function getReadReceiptsManager(config?: Partial<ReadReceiptsConfig>): ReadReceiptsManager {
  if (!readReceiptsManagerInstance) {
    readReceiptsManagerInstance = new ReadReceiptsManager(config);
  }
  return readReceiptsManagerInstance;
}

export function resetReadReceiptsManager(): void {
  if (readReceiptsManagerInstance) {
    readReceiptsManagerInstance.destroy();
    readReceiptsManagerInstance = null;
  }
}

// Export convenience functions
export const markMessageAsRead = (messageId: string, userId: string) =>
  getReadReceiptsManager().markMessageAsRead(messageId, userId);

export const markChatAsRead = (chatId: string, userId: string) =>
  getReadReceiptsManager().markChatAsRead(chatId, userId);

export const getUnreadCount = (chatId: string, userId: string) =>
  getReadReceiptsManager().getUnreadCount(chatId, userId);

export const getTotalUnreadCount = (userId: string) =>
  getReadReceiptsManager().getTotalUnreadCount(userId);
