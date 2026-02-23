/**
 * Chat repository interface
 * Defines the contract for chat data access
 */

import type { Chat, GroupChat, PrivateChat } from '../entities/Chat';
import type { Message } from '../entities/Message';

export interface ChatRepository {
  // Queries
  getAll(): Promise<Chat[]>;
  getById(id: string): Promise<Chat | null>;
  getMessages(chatId: string, options?: PaginationOptions): Promise<Message[]>;
  getUnreadCount(): Promise<number>;
  
  // Commands
  save(chat: Chat): Promise<void>;
  saveMessage(message: Message): Promise<void>;
  updateMessage(message: Message): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  markAsRead(chatId: string): Promise<void>;
  
  // Group operations
  createGroup(name: string, participantIds: string[], createdBy: string): Promise<GroupChat>;
  addParticipant(chatId: string, userId: string): Promise<void>;
  removeParticipant(chatId: string, userId: string): Promise<void>;
  makeAdmin(chatId: string, userId: string): Promise<void>;
  removeAdmin(chatId: string, userId: string): Promise<void>;
  updateGroupInfo(chatId: string, updates: Partial<GroupChat>): Promise<void>;
  
  // Chat management
  pin(chatId: string): Promise<void>;
  unpin(chatId: string): Promise<void>;
  mute(chatId: string): Promise<void>;
  unmute(chatId: string): Promise<void>;
  archive(chatId: string): Promise<void>;
  unarchive(chatId: string): Promise<void>;
  delete(chatId: string): Promise<void>;
  clearHistory(chatId: string): Promise<void>;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  before?: Date;
  after?: Date;
}

export interface ChatFilter {
  archived?: boolean;
  muted?: boolean;
  pinned?: boolean;
  searchQuery?: string;
}
