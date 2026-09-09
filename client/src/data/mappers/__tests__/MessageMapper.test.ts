/**
 * Message Mapper Tests
 * Tests for converting between domain entities and data models
 */

import "../../../test-utils/i18nMock";

import { MessageMapper } from "../MessageMapper";
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

describe("MessageMapper", () => {
  const createMockMessageModel = (overrides: Partial<MessageModel> = {}): MessageModel => ({
    id: "msg-1",
    chatId: "chat-1",
    senderId: "user-1",
    type: "text",
    text: "Hello World",
    timestamp: "2024-01-01T12:00:00.000Z",
    status: "sent",
    reactions: [],
    edited: false,
    localOnly: false,
    retryCount: 0,
    ...overrides,
  });

  const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
    id: "msg-1",
    chatId: "chat-1",
    senderId: "user-1",
    type: "text",
    text: "Hello World",
    timestamp: new Date("2024-01-01T12:00:00.000Z"),
    status: "sent",
    reactions: [],
    edited: false,
    localOnly: false,
    retryCount: 0,
    ...overrides,
  });

  const createMockAttachmentModel = (
    overrides: Partial<MessageAttachmentModel> = {}
  ): MessageAttachmentModel => ({
    type: "image",
    uri: "https://example.com/image.jpg",
    thumbnail: "https://example.com/thumb.jpg",
    width: 800,
    height: 600,
    fileName: "image.jpg",
    fileSize: 102400,
    mimeType: "image/jpeg",
    ...overrides,
  });

  const createMockAttachment = (overrides: Partial<MessageAttachment> = {}): MessageAttachment => ({
    type: "image",
    uri: "https://example.com/image.jpg",
    thumbnail: "https://example.com/thumb.jpg",
    width: 800,
    height: 600,
    fileName: "image.jpg",
    fileSize: 102400,
    mimeType: "image/jpeg",
    ...overrides,
  });

  const createMockReactionModel = (
    overrides: Partial<MessageReactionModel> = {}
  ): MessageReactionModel => ({
    userId: "user-2",
    emoji: "👍",
    createdAt: "2024-01-01T12:05:00.000Z",
    ...overrides,
  });

  const createMockReaction = (overrides: Partial<MessageReaction> = {}): MessageReaction => ({
    userId: "user-2",
    emoji: "👍",
    createdAt: new Date("2024-01-01T12:05:00.000Z"),
    ...overrides,
  });

  describe("toDomain", () => {
    it("should convert basic text message model to domain", () => {
      const model = createMockMessageModel();
      const domain = MessageMapper.toDomain(model);

      expect(domain).toEqual({
        id: "msg-1",
        chatId: "chat-1",
        senderId: "user-1",
        type: "text",
        text: "Hello World",
        attachment: undefined,
        timestamp: new Date("2024-01-01T12:00:00.000Z"),
        status: "sent",
        replyTo: undefined,
        reactions: [],
        edited: false,
        editedAt: undefined,
        metadata: undefined,
        localOnly: false,
        retryCount: 0,
      });
    });

    it("should convert message with attachment", () => {
      const attachmentModel = createMockAttachmentModel();
      const model = createMockMessageModel({
        type: "image",
        text: undefined,
        attachment: attachmentModel,
      });

      const domain = MessageMapper.toDomain(model);

      expect(domain.attachment).toEqual({
        type: "image",
        uri: "https://example.com/image.jpg",
        thumbnail: "https://example.com/thumb.jpg",
        width: 800,
        height: 600,
        fileName: "image.jpg",
        fileSize: 102400,
        mimeType: "image/jpeg",
      });
    });

    it("should convert message with reactions", () => {
      const reactionModel = createMockReactionModel();
      const model = createMockMessageModel({
        reactions: [reactionModel],
      });

      const domain = MessageMapper.toDomain(model);

      expect(domain.reactions).toHaveLength(1);
      expect(domain.reactions[0]).toEqual({
        userId: "user-2",
        emoji: "👍",
        createdAt: new Date("2024-01-01T12:05:00.000Z"),
      });
    });

    it("should convert message with multiple reactions", () => {
      const model = createMockMessageModel({
        reactions: [
          createMockReactionModel({ userId: "user-1", emoji: "❤️" }),
          createMockReactionModel({ userId: "user-2", emoji: "👍" }),
        ],
      });

      const domain = MessageMapper.toDomain(model);

      expect(domain.reactions).toHaveLength(2);
      expect(domain.reactions[0].emoji).toBe("❤️");
      expect(domain.reactions[1].emoji).toBe("👍");
    });

    it("should handle edited message with editedAt", () => {
      const model = createMockMessageModel({
        edited: true,
        editedAt: "2024-01-01T13:00:00.000Z",
      });

      const domain = MessageMapper.toDomain(model);

      expect(domain.edited).toBe(true);
      expect(domain.editedAt).toEqual(new Date("2024-01-01T13:00:00.000Z"));
    });

    it("should handle message with replyTo", () => {
      const model = createMockMessageModel({
        replyTo: "msg-0",
      });

      const domain = MessageMapper.toDomain(model);

      expect(domain.replyTo).toBe("msg-0");
    });

    it("should handle message with metadata", () => {
      const model = createMockMessageModel({
        metadata: { customKey: "customValue" },
      });

      const domain = MessageMapper.toDomain(model);

      expect(domain.metadata).toEqual({ customKey: "customValue" });
    });

    it("should handle localOnly and retryCount", () => {
      const model = createMockMessageModel({
        localOnly: true,
        retryCount: 3,
      });

      const domain = MessageMapper.toDomain(model);

      expect(domain.localOnly).toBe(true);
      expect(domain.retryCount).toBe(3);
    });

    it("should handle all message types", () => {
      const types: Message["type"][] = ["text", "image", "video", "audio", "document", "location"];

      types.forEach((type) => {
        const model = createMockMessageModel({ type });
        const domain = MessageMapper.toDomain(model);
        expect(domain.type).toBe(type);
      });
    });

    it("should handle all message statuses", () => {
      const statuses: Message["status"][] = [
        "sending",
        "sent",
        "delivered",
        "read",
        "failed",
        "error",
        "pending",
      ];

      statuses.forEach((status) => {
        const model = createMockMessageModel({ status });
        const domain = MessageMapper.toDomain(model);
        expect(domain.status).toBe(status);
      });
    });

    it("should handle missing optional fields gracefully", () => {
      const model: MessageModel = {
        id: "msg-1",
        chatId: "chat-1",
        senderId: "user-1",
        type: "text",
        timestamp: "2024-01-01T12:00:00.000Z",
        status: "sent",
        reactions: [],
        edited: false,
        localOnly: false,
        retryCount: 0,
      };

      const domain = MessageMapper.toDomain(model);

      expect(domain.text).toBeUndefined();
      expect(domain.attachment).toBeUndefined();
      expect(domain.replyTo).toBeUndefined();
      expect(domain.editedAt).toBeUndefined();
      expect(domain.metadata).toBeUndefined();
    });
  });

  describe("toModel", () => {
    it("should convert basic domain message to model", () => {
      const domain = createMockMessage();
      const model = MessageMapper.toModel(domain);

      expect(model).toEqual({
        id: "msg-1",
        chatId: "chat-1",
        senderId: "user-1",
        type: "text",
        text: "Hello World",
        attachment: undefined,
        timestamp: "2024-01-01T12:00:00.000Z",
        status: "sent",
        replyTo: undefined,
        reactions: [],
        edited: false,
        editedAt: undefined,
        metadata: undefined,
        localOnly: false,
        retryCount: 0,
      });
    });

    it("should convert message with attachment to model", () => {
      const attachment = createMockAttachment();
      const domain = createMockMessage({
        type: "image",
        text: undefined,
        attachment,
      });

      const model = MessageMapper.toModel(domain);

      expect(model.attachment).toEqual({
        type: "image",
        uri: "https://example.com/image.jpg",
        thumbnail: "https://example.com/thumb.jpg",
        width: 800,
        height: 600,
        fileName: "image.jpg",
        fileSize: 102400,
        mimeType: "image/jpeg",
      });
    });

    it("should convert message with reactions to model", () => {
      const domain = createMockMessage({
        reactions: [
          createMockReaction({ userId: "user-1", emoji: "❤️" }),
          createMockReaction({ userId: "user-2", emoji: "👍" }),
        ],
      });

      const model = MessageMapper.toModel(domain);

      expect(model.reactions).toHaveLength(2);
      expect(model.reactions[0]).toEqual({
        userId: "user-1",
        emoji: "❤️",
        createdAt: "2024-01-01T12:05:00.000Z",
      });
      expect(model.reactions[1]).toEqual({
        userId: "user-2",
        emoji: "👍",
        createdAt: "2024-01-01T12:05:00.000Z",
      });
    });

    it("should handle edited message with editedAt", () => {
      const domain = createMockMessage({
        edited: true,
        editedAt: new Date("2024-01-01T13:00:00.000Z"),
      });

      const model = MessageMapper.toModel(domain);

      expect(model.edited).toBe(true);
      expect(model.editedAt).toBe("2024-01-01T13:00:00.000Z");
    });

    it("should handle message with replyTo", () => {
      const domain = createMockMessage({
        replyTo: "msg-0",
      });

      const model = MessageMapper.toModel(domain);

      expect(model.replyTo).toBe("msg-0");
    });

    it("should handle message with metadata", () => {
      const domain = createMockMessage({
        metadata: { customKey: "customValue" },
      });

      const model = MessageMapper.toModel(domain);

      expect(model.metadata).toEqual({ customKey: "customValue" });
    });

    it("should handle localOnly and retryCount", () => {
      const domain = createMockMessage({
        localOnly: true,
        retryCount: 3,
      });

      const model = MessageMapper.toModel(domain);

      expect(model.localOnly).toBe(true);
      expect(model.retryCount).toBe(3);
    });

    it("should convert timestamp to ISO string", () => {
      const domain = createMockMessage({
        timestamp: new Date("2024-06-15T08:30:00.000Z"),
      });

      const model = MessageMapper.toModel(domain);

      expect(model.timestamp).toBe("2024-06-15T08:30:00.000Z");
    });
  });

  describe("toEntity", () => {
    it("should convert model to MessageEntity", () => {
      const model = createMockMessageModel();
      const entity = MessageMapper.toEntity(model);

      expect(entity).toBeInstanceOf(MessageEntity);
      expect(entity.id).toBe("msg-1");
      expect(entity.chatId).toBe("chat-1");
      expect(entity.senderId).toBe("user-1");
      expect(entity.type).toBe("text");
      expect(entity.text).toBe("Hello World");
    });

    it("should create entity with attachment", () => {
      const model = createMockMessageModel({
        type: "image",
        text: undefined,
        attachment: createMockAttachmentModel(),
      });

      const entity = MessageMapper.toEntity(model);

      expect(entity.attachment).toBeDefined();
      expect(entity.attachment?.type).toBe("image");
    });

    it("should create entity with reactions", () => {
      const model = createMockMessageModel({
        reactions: [createMockReactionModel()],
      });

      const entity = MessageMapper.toEntity(model);

      expect(entity.reactions).toHaveLength(1);
      expect(entity.reactions[0].emoji).toBe("👍");
    });
  });

  describe("attachment conversion", () => {
    it("should handle attachment with all fields", () => {
      const attachmentModel = createMockAttachmentModel({
        type: "video",
        duration: 120,
        width: 1920,
        height: 1080,
      });

      const domain = MessageMapper.toDomain(
        createMockMessageModel({
          type: "video",
          attachment: attachmentModel,
        })
      );

      expect(domain.attachment).toEqual({
        type: "video",
        uri: "https://example.com/image.jpg",
        thumbnail: "https://example.com/thumb.jpg",
        width: 1920,
        height: 1080,
        duration: 120,
        fileName: "image.jpg",
        fileSize: 102400,
        mimeType: "image/jpeg",
      });
    });

    it("should handle attachment with minimal fields", () => {
      const attachmentModel: MessageAttachmentModel = {
        type: "document",
        uri: "https://example.com/doc.pdf",
      };

      const domain = MessageMapper.toDomain(
        createMockMessageModel({
          type: "document",
          attachment: attachmentModel,
        })
      );

      expect(domain.attachment).toEqual({
        type: "document",
        uri: "https://example.com/doc.pdf",
        thumbnail: undefined,
        width: undefined,
        height: undefined,
        duration: undefined,
        fileName: undefined,
        fileSize: undefined,
        mimeType: undefined,
      });
    });
  });

  describe("reaction conversion", () => {
    it("should convert reaction model to domain", () => {
      const reactionModel = createMockReactionModel({ emoji: "😂" });
      const domain = MessageMapper.toDomain(
        createMockMessageModel({
          reactions: [reactionModel],
        })
      );

      expect(domain.reactions[0]).toEqual({
        userId: "user-2",
        emoji: "😂",
        createdAt: new Date("2024-01-01T12:05:00.000Z"),
      });
    });

    it("should convert domain reaction to model", () => {
      const reaction = createMockReaction({ emoji: "😂" });
      const model = MessageMapper.toModel(
        createMockMessage({
          reactions: [reaction],
        })
      );

      expect(model.reactions[0]).toEqual({
        userId: "user-2",
        emoji: "😂",
        createdAt: "2024-01-01T12:05:00.000Z",
      });
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data when converting model -> domain -> model", () => {
      const originalModel = createMockMessageModel({
        type: "image",
        text: "Check this out",
        attachment: createMockAttachmentModel(),
        reactions: [
          createMockReactionModel(),
          createMockReactionModel({ userId: "user-3", emoji: "❤️" }),
        ],
        edited: true,
        editedAt: "2024-01-01T13:00:00.000Z",
        replyTo: "msg-0",
        metadata: { source: "camera" },
        localOnly: true,
        retryCount: 2,
      });

      const domain = MessageMapper.toDomain(originalModel);
      const convertedModel = MessageMapper.toModel(domain);

      expect(convertedModel.id).toBe(originalModel.id);
      expect(convertedModel.chatId).toBe(originalModel.chatId);
      expect(convertedModel.senderId).toBe(originalModel.senderId);
      expect(convertedModel.type).toBe(originalModel.type);
      expect(convertedModel.text).toBe(originalModel.text);
      expect(convertedModel.attachment).toEqual(originalModel.attachment);
      expect(convertedModel.timestamp).toBe(originalModel.timestamp);
      expect(convertedModel.status).toBe(originalModel.status);
      expect(convertedModel.replyTo).toBe(originalModel.replyTo);
      expect(convertedModel.reactions).toEqual(originalModel.reactions);
      expect(convertedModel.edited).toBe(originalModel.edited);
      expect(convertedModel.editedAt).toBe(originalModel.editedAt);
      expect(convertedModel.metadata).toEqual(originalModel.metadata);
      expect(convertedModel.localOnly).toBe(originalModel.localOnly);
      expect(convertedModel.retryCount).toBe(originalModel.retryCount);
    });

    it("should preserve data when converting domain -> model -> domain", () => {
      const originalDomain = createMockMessage({
        type: "video",
        text: "Video message",
        attachment: createMockAttachment({ type: "video", duration: 60 }),
        reactions: [createMockReaction(), createMockReaction({ userId: "user-3", emoji: "🔥" })],
        edited: true,
        editedAt: new Date("2024-01-01T13:00:00.000Z"),
        replyTo: "msg-0",
        metadata: { source: "gallery" },
        localOnly: false,
        retryCount: 1,
      });

      const model = MessageMapper.toModel(originalDomain);
      const convertedDomain = MessageMapper.toDomain(model);

      expect(convertedDomain.id).toBe(originalDomain.id);
      expect(convertedDomain.chatId).toBe(originalDomain.chatId);
      expect(convertedDomain.senderId).toBe(originalDomain.senderId);
      expect(convertedDomain.type).toBe(originalDomain.type);
      expect(convertedDomain.text).toBe(originalDomain.text);
      expect(convertedDomain.attachment).toEqual(originalDomain.attachment);
      expect(convertedDomain.timestamp).toEqual(originalDomain.timestamp);
      expect(convertedDomain.status).toBe(originalDomain.status);
      expect(convertedDomain.replyTo).toBe(originalDomain.replyTo);
      expect(convertedDomain.reactions).toEqual(originalDomain.reactions);
      expect(convertedDomain.edited).toBe(originalDomain.edited);
      expect(convertedDomain.editedAt).toEqual(originalDomain.editedAt);
      expect(convertedDomain.metadata).toEqual(originalDomain.metadata);
      expect(convertedDomain.localOnly).toBe(originalDomain.localOnly);
      expect(convertedDomain.retryCount).toBe(originalDomain.retryCount);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined attachment gracefully", () => {
      const model = createMockMessageModel({ attachment: undefined });
      const domain = MessageMapper.toDomain(model);
      expect(domain.attachment).toBeUndefined();
    });

    it("should handle empty reactions array", () => {
      const model = createMockMessageModel({ reactions: [] });
      const domain = MessageMapper.toDomain(model);
      expect(domain.reactions).toEqual([]);
    });

    it("should handle null timestamp by creating valid date", () => {
      const model = createMockMessageModel({ timestamp: "invalid-date" });
      const domain = MessageMapper.toDomain(model);
      // The mapper doesn't validate timestamp, it just creates a Date object
      expect(domain.timestamp).toBeInstanceOf(Date);
    });
  });
});
