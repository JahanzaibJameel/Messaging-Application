/**
 * Message mapper
 * Converts between domain entities and data models
 */

import {
  MessageEntity,
  type Message,
  type MessageAttachment,
  type MessageReaction,
} from "@/domain/entities/Message";
import type {
  MessageModel,
  MessageAttachmentModel,
  MessageReactionModel,
} from "../models/MessageModel";

export class MessageMapper {
  static toDomain(model: MessageModel): Message {
    return {
      id: model.id,
      chatId: model.chatId,
      senderId: model.senderId,
      type: model.type,
      text: model.text,
      attachment: model.attachment ? MessageMapper.attachmentToDomain(model.attachment) : undefined,
      timestamp: new Date(model.timestamp),
      status: model.status,
      replyTo: model.replyTo,
      reactions: model.reactions.map((r) => MessageMapper.reactionToDomain(r)),
      edited: model.edited,
      editedAt: model.editedAt ? new Date(model.editedAt) : undefined,
      metadata: model.metadata,
      localOnly: model.localOnly,
      retryCount: model.retryCount,
    };
  }

  static toModel(domain: Message): MessageModel {
    return {
      id: domain.id,
      chatId: domain.chatId,
      senderId: domain.senderId,
      type: domain.type,
      text: domain.text,
      attachment: domain.attachment
        ? MessageMapper.attachmentToModel(domain.attachment)
        : undefined,
      timestamp: domain.timestamp.toISOString(),
      status: domain.status,
      replyTo: domain.replyTo,
      reactions: domain.reactions.map((r) => MessageMapper.reactionToModel(r)),
      edited: domain.edited,
      editedAt: domain.editedAt?.toISOString(),
      metadata: domain.metadata,
      localOnly: domain.localOnly,
      retryCount: domain.retryCount,
    };
  }

  static toEntity(model: MessageModel): MessageEntity {
    return new MessageEntity(this.toDomain(model));
  }

  private static attachmentToDomain(model: MessageAttachmentModel): MessageAttachment {
    return {
      type: model.type,
      uri: model.uri,
      thumbnail: model.thumbnail,
      width: model.width,
      height: model.height,
      duration: model.duration,
      fileName: model.fileName,
      fileSize: model.fileSize,
      mimeType: model.mimeType,
    };
  }

  private static attachmentToModel(domain: MessageAttachment): MessageAttachmentModel {
    return {
      type: domain.type,
      uri: domain.uri,
      thumbnail: domain.thumbnail,
      width: domain.width,
      height: domain.height,
      duration: domain.duration,
      fileName: domain.fileName,
      fileSize: domain.fileSize,
      mimeType: domain.mimeType,
    };
  }

  private static reactionToDomain(model: MessageReactionModel): MessageReaction {
    return {
      userId: model.userId,
      emoji: model.emoji,
      createdAt: new Date(model.createdAt),
    };
  }

  private static reactionToModel(domain: MessageReaction): MessageReactionModel {
    return {
      userId: domain.userId,
      emoji: domain.emoji,
      createdAt: domain.createdAt.toISOString(),
    };
  }
}
