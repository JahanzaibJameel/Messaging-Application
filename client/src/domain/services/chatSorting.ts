/**
 * Domain service for chat sorting and filtering utilities.
 * Pure functions without external dependencies.
 */

import type { Chat } from "../entities/Chat";

/**
 * Sort chats by the timestamp of their last message in descending order (most recent first).
 * Chats with the same timestamp maintain their relative order.
 * Chats without a last message timestamp are pushed to the end.
 */
export function sortChatsByLastMessage(chats: Chat[]): Chat[] {
  if (!chats || chats.length === 0) {
    return [];
  }

  return [...chats].sort((a, b) => {
    const dateA = getLastMessageTimestamp(a);
    const dateB = getLastMessageTimestamp(b);

    // Chats with no timestamp go last
    if (!dateA && dateB) return 1;
    if (dateA && !dateB) return -1;
    if (!dateA && !dateB) return 0;

    // Descending order (newest first)
    return dateB!.getTime() - dateA!.getTime();
  });
}

function getLastMessageTimestamp(chat: Chat): Date | null {
  if (chat.lastMessage && chat.lastMessage.timestamp) {
    return chat.lastMessage.timestamp instanceof Date
      ? chat.lastMessage.timestamp
      : new Date(chat.lastMessage.timestamp);
  }
  if (chat.updatedAt) {
    return chat.updatedAt instanceof Date ? chat.updatedAt : new Date(chat.updatedAt);
  }
  return null;
}

/**
 * Calculate the total number of unread messages across all non-muted chats.
 */
export function calculateUnreadCount(chats: Chat[]): number {
  if (!chats || chats.length === 0) {
    return 0;
  }

  return chats.reduce((total, chat) => {
    // Skip muted chats
    if (chat.isMuted) {
      return total;
    }

    // If unreadCount is already set, use it
    if (chat.unreadCount && chat.unreadCount > 0) {
      return total + chat.unreadCount;
    }

    // Otherwise calculate from last message
    const lastRead = getLastReadTimestamp(chat);
    const messages = chat.lastMessage ? [chat.lastMessage] : [];

    const unreadMessages = messages.filter((message) => {
      const messageTime =
        message.timestamp instanceof Date
          ? message.timestamp.getTime()
          : new Date(message.timestamp).getTime();

      return lastRead === null || messageTime > lastRead;
    });

    return total + unreadMessages.length;
  }, 0);
}

function getLastReadTimestamp(chat: Chat): number | null {
  // Chats don't have a lastReadAt field in the current interface
  // Use the updatedAt as a fallback for "last read"
  if (chat.lastActivity) {
    return chat.lastActivity instanceof Date
      ? chat.lastActivity.getTime()
      : new Date(chat.lastActivity).getTime();
  }
  if (chat.updatedAt) {
    return chat.updatedAt instanceof Date
      ? chat.updatedAt.getTime()
      : new Date(chat.updatedAt).getTime();
  }
  return null;
}
