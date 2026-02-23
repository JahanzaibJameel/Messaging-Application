/**
 * Chat mapper
 * Converts between domain entities and data models
 */

import { ChatEntity, type Chat, type GroupChat } from '@/domain/entities/Chat';
import type { ChatModel } from '../models/MessageModel';
import { MessageMapper } from './MessageMapper';

export class ChatMapper {
  static toDomain(model: ChatModel): Chat {
    const baseChat = {
      id: model.id,
      type: model.type,
      participantIds: model.participantIds,
      lastMessage: model.lastMessage ? MessageMapper.toDomain(model.lastMessage) : undefined,
      unreadCount: model.unreadCount,
      isPinned: model.isPinned,
      isMuted: model.isMuted,
      isArchived: model.isArchived,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
    };

    if (model.type === 'group') {
      return {
        ...baseChat,
        type: 'group',
        name: model.name || 'Unnamed Group',
        description: model.description,
        avatar: model.avatar,
        adminIds: model.adminIds || [],
        createdBy: model.createdBy || '',
      } as GroupChat;
    }

    return baseChat as Chat;
  }

  static toModel(domain: Chat): ChatModel {
    const baseModel = {
      id: domain.id,
      type: domain.type,
      participantIds: domain.participantIds,
      lastMessage: domain.lastMessage ? MessageMapper.toModel(domain.lastMessage) : undefined,
      unreadCount: domain.unreadCount,
      isPinned: domain.isPinned,
      isMuted: domain.isMuted,
      isArchived: domain.isArchived,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };

    if (domain.type === 'group') {
      const groupChat = domain as GroupChat;
      return {
        ...baseModel,
        name: groupChat.name,
        description: groupChat.description,
        avatar: groupChat.avatar,
        adminIds: groupChat.adminIds,
        createdBy: groupChat.createdBy,
      };
    }

    return baseModel;
  }

  static toEntity(model: ChatModel): ChatEntity {
    return new ChatEntity(this.toDomain(model));
  }
}
