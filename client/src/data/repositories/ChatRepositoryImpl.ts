/**
 * Chat Repository Implementation
 * Combines local and remote data sources with sync logic
 */

import type { Chat, GroupChat } from '../../domain/entities/Chat';
import { ChatEntity } from '../../domain/entities/Chat';
import type { Message } from '../../domain/entities/Message';
import type { ChatRepository, PaginationOptions } from '../../domain/repositories/ChatRepository';
import { LocalStorageDataSource } from '../datasources/LocalStorageDataSource';
import { RemoteApiDataSource } from '../datasources/RemoteApiDataSource';
import { ChatMapper, MessageMapper } from '../mappers';

export class ChatRepositoryImpl implements ChatRepository {
  private localDataSource: LocalStorageDataSource;
  private remoteDataSource: RemoteApiDataSource;

  constructor(
    localDataSource: LocalStorageDataSource,
    remoteDataSource: RemoteApiDataSource
  ) {
    this.localDataSource = localDataSource;
    this.remoteDataSource = remoteDataSource;
  }

  // Queries
  async getAll(): Promise<Chat[]> {
    const chatModels = await this.localDataSource.getChats();
    return chatModels.map((model) => ChatMapper.toDomain(model));
  }

  async getById(id: string): Promise<Chat | null> {
    const chatModel = await this.localDataSource.getChatById(id);
    return chatModel ? ChatMapper.toDomain(chatModel) : null;
  }

  async getMessages(chatId: string, options?: PaginationOptions): Promise<Message[]> {
    const messageModels = await this.localDataSource.getMessagesByChatId(chatId);
    
    let messages = messageModels.map((model) => MessageMapper.toDomain(model));
    
    // Apply pagination if options provided
    if (options) {
      if (options.before) {
        messages = messages.filter((m) => m.timestamp < options.before!);
      }
      if (options.after) {
        messages = messages.filter((m) => m.timestamp > options.after!);
      }
      if (options.limit) {
        messages = messages.slice(0, options.limit);
      }
    }
    
    return messages;
  }

  async getUnreadCount(): Promise<number> {
    const chats = await this.getAll();
    return chats.reduce((total, chat) => total + chat.unreadCount, 0);
  }

  // Commands
  async save(chat: Chat): Promise<void> {
    const chatModel = ChatMapper.toModel(chat);
    await this.localDataSource.saveChat(chatModel);
    
    // Try to sync with remote if online
    try {
      await this.remoteDataSource.updateChat(chat.id, chatModel);
    } catch {
      // Will be synced later
    }
  }

  async saveMessage(message: Message): Promise<void> {
    const messageModel = MessageMapper.toModel(message);
    await this.localDataSource.saveMessage(messageModel);
    
    // Update chat's last message
    const chat = await this.getById(message.chatId);
    if (chat) {
      chat.lastMessage = message;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  async updateMessage(message: Message): Promise<void> {
    const messageModel = MessageMapper.toModel(message);
    await this.localDataSource.saveMessage(messageModel);
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.localDataSource.deleteMessage(messageId);
    
    try {
      await this.remoteDataSource.deleteMessage(messageId);
    } catch {
      // Will be synced later
    }
  }

  async markAsRead(chatId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat) {
      chat.unreadCount = 0;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  // Group Operations
  async createGroup(name: string, participantIds: string[], createdBy: string): Promise<GroupChat> {
    // Create locally first
    const groupChat = ChatEntity.createGroup(name, participantIds, createdBy);
    await this.save(groupChat);
    
    // Try to create on remote
    try {
      const remoteGroup = await this.remoteDataSource.createGroup(name, participantIds);
      // Update with server-generated ID if different
      if (remoteGroup.id !== groupChat.id) {
        await this.delete(groupChat.id);
        const updatedGroup = ChatMapper.toDomain(remoteGroup);
        await this.save(updatedGroup);
        return updatedGroup as GroupChat;
      }
    } catch {
      // Queue for sync - will be handled by sync engine
      console.log('Queue for sync:', groupChat.id);
    }
    
    return groupChat as GroupChat;
  }

  async addParticipant(chatId: string, userId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat && chat.type === 'group') {
      const groupChat = chat as GroupChat;
      if (!groupChat.participantIds.includes(userId)) {
        groupChat.participantIds.push(userId);
        await this.save(groupChat);
      }
    }
    
    try {
      await this.remoteDataSource.addParticipant(chatId, userId);
    } catch {
      // Will be synced later
    }
  }

  async removeParticipant(chatId: string, userId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat && chat.type === 'group') {
      const groupChat = chat as GroupChat;
      groupChat.participantIds = groupChat.participantIds.filter((id) => id !== userId);
      groupChat.adminIds = groupChat.adminIds.filter((id) => id !== userId);
      await this.save(groupChat);
    }
    
    try {
      await this.remoteDataSource.removeParticipant(chatId, userId);
    } catch {
      // Will be synced later
    }
  }

  async makeAdmin(chatId: string, userId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat && chat.type === 'group') {
      const groupChat = chat as GroupChat;
      if (!groupChat.adminIds.includes(userId)) {
        groupChat.adminIds.push(userId);
        await this.save(groupChat);
      }
    }
    
    try {
      await this.remoteDataSource.makeAdmin(chatId, userId);
    } catch {
      // Will be synced later
    }
  }

  async removeAdmin(chatId: string, userId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat && chat.type === 'group') {
      const groupChat = chat as GroupChat;
      groupChat.adminIds = groupChat.adminIds.filter((id) => id !== userId);
      await this.save(groupChat);
    }
    
    try {
      await this.remoteDataSource.removeAdmin(chatId, userId);
    } catch {
      // Will be synced later
    }
  }

  async updateGroupInfo(chatId: string, updates: Partial<GroupChat>): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat && chat.type === 'group') {
      Object.assign(chat, updates);
      await this.save(chat);
    }
  }

  // Chat Management
  async pin(chatId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat) {
      chat.isPinned = true;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  async unpin(chatId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat) {
      chat.isPinned = false;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  async mute(chatId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat) {
      chat.isMuted = true;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  async unmute(chatId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat) {
      chat.isMuted = false;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  async archive(chatId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat) {
      chat.isArchived = true;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  async unarchive(chatId: string): Promise<void> {
    const chat = await this.getById(chatId);
    if (chat) {
      chat.isArchived = false;
      chat.updatedAt = new Date();
      await this.save(chat);
    }
  }

  async delete(chatId: string): Promise<void> {
    await this.localDataSource.deleteChat(chatId);
    
    try {
      await this.remoteDataSource.deleteChat(chatId);
    } catch {
      // Will be synced later
    }
  }

  async clearHistory(chatId: string): Promise<void> {
    await this.localDataSource.clearMessagesByChatId(chatId);
    
    const chat = await this.getById(chatId);
    if (chat) {
      chat.lastMessage = undefined;
      await this.save(chat);
    }
  }

  // Sync Operations
  async syncWithRemote(lastSyncTimestamp?: string): Promise<{
    messages: Message[];
    chats: Chat[];
    timestamp: string;
  }> {
    const syncResult = await this.remoteDataSource.syncMessages(lastSyncTimestamp);
    
    // Save to local storage
    for (const chatModel of syncResult.chats) {
      await this.localDataSource.saveChat(chatModel);
    }
    
    for (const messageModel of syncResult.messages) {
      await this.localDataSource.saveMessage(messageModel);
    }
    
    return {
      messages: syncResult.messages.map((m) => MessageMapper.toDomain(m)),
      chats: syncResult.chats.map((c) => ChatMapper.toDomain(c)),
      timestamp: syncResult.timestamp,
    };
  }
}

// Singleton instance
export const chatRepository = new ChatRepositoryImpl(
  new LocalStorageDataSource(),
  new RemoteApiDataSource()
);
