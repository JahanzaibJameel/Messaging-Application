/**
 * User Mapper Tests
 * Tests for converting between domain entities and data models
 */

import "../../../test-utils/i18nMock";

import { UserMapper } from "../UserMapper";
import { UserEntity, type User } from "@/domain/entities/User";
import type { UserModel } from "../models/MessageModel";

describe("UserMapper", () => {
  const createMockUserModel = (overrides: Partial<UserModel> = {}): UserModel => ({
    id: "user-1",
    name: "John Doe",
    phone: "+1234567890",
    avatar: "https://example.com/avatar.jpg",
    isOnline: true,
    lastSeen: "2024-01-01T12:00:00.000Z",
    status: "Available",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T11:00:00.000Z",
    ...overrides,
  });

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: "user-1",
    name: "John Doe",
    phone: "+1234567890",
    avatar: "https://example.com/avatar.jpg",
    isOnline: true,
    lastSeen: new Date("2024-01-01T12:00:00.000Z"),
    status: "Available",
    createdAt: new Date("2024-01-01T10:00:00.000Z"),
    updatedAt: new Date("2024-01-01T11:00:00.000Z"),
    ...overrides,
  });

  describe("toDomain", () => {
    it("should convert basic user model to domain", () => {
      const model = createMockUserModel();
      const domain = UserMapper.toDomain(model);

      expect(domain).toEqual({
        id: "user-1",
        name: "John Doe",
        phone: "+1234567890",
        avatar: "https://example.com/avatar.jpg",
        isOnline: true,
        lastSeen: new Date("2024-01-01T12:00:00.000Z"),
        status: "Available",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T11:00:00.000Z"),
      });
    });

    it("should handle user without avatar", () => {
      const model = createMockUserModel({ avatar: undefined });
      const domain = UserMapper.toDomain(model);

      expect(domain.avatar).toBeUndefined();
    });

    it("should handle user without lastSeen", () => {
      const model = createMockUserModel({ lastSeen: undefined });
      const domain = UserMapper.toDomain(model);

      expect(domain.lastSeen).toBeUndefined();
    });

    it("should handle user without status", () => {
      const model = createMockUserModel({ status: undefined });
      const domain = UserMapper.toDomain(model);

      expect(domain.status).toBeUndefined();
    });

    it("should handle user offline", () => {
      const model = createMockUserModel({
        isOnline: false,
        lastSeen: "2024-01-01T10:00:00.000Z",
      });
      const domain = UserMapper.toDomain(model);

      expect(domain.isOnline).toBe(false);
      expect(domain.lastSeen).toEqual(new Date("2024-01-01T10:00:00.000Z"));
    });

    it("should handle user with only required fields", () => {
      const model: UserModel = {
        id: "user-1",
        name: "Jane",
        phone: "+0987654321",
        isOnline: true,
        createdAt: "2024-01-01T10:00:00.000Z",
        updatedAt: "2024-01-01T10:00:00.000Z",
      };

      const domain = UserMapper.toDomain(model);

      expect(domain.id).toBe("user-1");
      expect(domain.name).toBe("Jane");
      expect(domain.phone).toBe("+0987654321");
      expect(domain.isOnline).toBe(true);
      expect(domain.avatar).toBeUndefined();
      expect(domain.lastSeen).toBeUndefined();
      expect(domain.status).toBeUndefined();
      expect(domain.createdAt).toEqual(new Date("2024-01-01T10:00:00.000Z"));
      expect(domain.updatedAt).toEqual(new Date("2024-01-01T10:00:00.000Z"));
    });
  });

  describe("toModel", () => {
    it("should convert basic domain user to model", () => {
      const domain = createMockUser();
      const model = UserMapper.toModel(domain);

      expect(model).toEqual({
        id: "user-1",
        name: "John Doe",
        phone: "+1234567890",
        avatar: "https://example.com/avatar.jpg",
        isOnline: true,
        lastSeen: "2024-01-01T12:00:00.000Z",
        status: "Available",
        createdAt: "2024-01-01T10:00:00.000Z",
        updatedAt: "2024-01-01T11:00:00.000Z",
      });
    });

    it("should handle user without avatar", () => {
      const domain = createMockUser({ avatar: undefined });
      const model = UserMapper.toModel(domain);

      expect(model.avatar).toBeUndefined();
    });

    it("should handle user without lastSeen", () => {
      const domain = createMockUser({ lastSeen: undefined });
      const model = UserMapper.toModel(domain);

      expect(model.lastSeen).toBeUndefined();
    });

    it("should handle user without status", () => {
      const domain = createMockUser({ status: undefined });
      const model = UserMapper.toModel(domain);

      expect(model.status).toBeUndefined();
    });

    it("should handle user offline", () => {
      const domain = createMockUser({
        isOnline: false,
        lastSeen: new Date("2024-01-01T10:00:00.000Z"),
      });
      const model = UserMapper.toModel(domain);

      expect(model.isOnline).toBe(false);
      expect(model.lastSeen).toBe("2024-01-01T10:00:00.000Z");
    });

    it("should convert dates to ISO strings", () => {
      const domain = createMockUser({
        createdAt: new Date("2024-06-15T08:30:00.000Z"),
        updatedAt: new Date("2024-06-15T09:45:00.000Z"),
      });
      const model = UserMapper.toModel(domain);

      expect(model.createdAt).toBe("2024-06-15T08:30:00.000Z");
      expect(model.updatedAt).toBe("2024-06-15T09:45:00.000Z");
    });
  });

  describe("toEntity", () => {
    it("should convert model to UserEntity", () => {
      const model = createMockUserModel();
      const entity = UserMapper.toEntity(model);

      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.id).toBe("user-1");
      expect(entity.name).toBe("John Doe");
      expect(entity.phone).toBe("+1234567890");
      expect(entity.avatar).toBe("https://example.com/avatar.jpg");
      expect(entity.isOnline).toBe(true);
      expect(entity.lastSeen).toEqual(new Date("2024-01-01T12:00:00.000Z"));
      expect(entity.status).toBe("Available");
      expect(entity.createdAt).toEqual(new Date("2024-01-01T10:00:00.000Z"));
      expect(entity.updatedAt).toEqual(new Date("2024-01-01T11:00:00.000Z"));
    });

    it("should create entity without optional fields", () => {
      const model: UserModel = {
        id: "user-2",
        name: "Jane",
        phone: "+0987654321",
        isOnline: false,
        createdAt: "2024-01-01T10:00:00.000Z",
        updatedAt: "2024-01-01T10:00:00.000Z",
      };

      const entity = UserMapper.toEntity(model);

      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.id).toBe("user-2");
      expect(entity.name).toBe("Jane");
      expect(entity.avatar).toBeUndefined();
      expect(entity.lastSeen).toBeUndefined();
      expect(entity.status).toBeUndefined();
    });

    it("should preserve UserEntity methods", () => {
      const model = createMockUserModel({
        isOnline: false,
        lastSeen: "2024-01-01T10:00:00.000Z",
      });

      const entity = UserMapper.toEntity(model);

      expect(entity.getDisplayName()).toBe("John Doe");
      expect(entity.isActive()).toBe(false); // Offline and lastSeen > 5 min ago
    });

    it("should return true for isActive when recently seen", () => {
      const recentTime = new Date(Date.now() - 2 * 60 * 1000).toISOString(); // 2 minutes ago
      const model = createMockUserModel({
        isOnline: false,
        lastSeen: recentTime,
      });

      const entity = UserMapper.toEntity(model);

      expect(entity.isActive()).toBe(true);
    });

    it("should return true for isActive when online", () => {
      const model = createMockUserModel({
        isOnline: true,
        lastSeen: undefined,
      });

      const entity = UserMapper.toEntity(model);

      expect(entity.isActive()).toBe(true);
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data when converting model -> domain -> model", () => {
      const originalModel = createMockUserModel({
        avatar: "https://example.com/avatar.png",
        lastSeen: "2024-01-01T12:00:00.000Z",
        status: "Busy",
      });

      const domain = UserMapper.toDomain(originalModel);
      const convertedModel = UserMapper.toModel(domain);

      expect(convertedModel.id).toBe(originalModel.id);
      expect(convertedModel.name).toBe(originalModel.name);
      expect(convertedModel.phone).toBe(originalModel.phone);
      expect(convertedModel.avatar).toBe(originalModel.avatar);
      expect(convertedModel.isOnline).toBe(originalModel.isOnline);
      expect(convertedModel.lastSeen).toBe(originalModel.lastSeen);
      expect(convertedModel.status).toBe(originalModel.status);
      expect(convertedModel.createdAt).toBe(originalModel.createdAt);
      expect(convertedModel.updatedAt).toBe(originalModel.updatedAt);
    });

    it("should preserve data when converting domain -> model -> domain", () => {
      const originalDomain = createMockUser({
        avatar: "https://example.com/avatar.png",
        lastSeen: new Date("2024-01-01T12:00:00.000Z"),
        status: "Busy",
      });

      const model = UserMapper.toModel(originalDomain);
      const convertedDomain = UserMapper.toDomain(model);

      expect(convertedDomain.id).toBe(originalDomain.id);
      expect(convertedDomain.name).toBe(originalDomain.name);
      expect(convertedDomain.phone).toBe(originalDomain.phone);
      expect(convertedDomain.avatar).toBe(originalDomain.avatar);
      expect(convertedDomain.isOnline).toBe(originalDomain.isOnline);
      expect(convertedDomain.lastSeen).toEqual(originalDomain.lastSeen);
      expect(convertedDomain.status).toBe(originalDomain.status);
      expect(convertedDomain.createdAt).toEqual(originalDomain.createdAt);
      expect(convertedDomain.updatedAt).toEqual(originalDomain.updatedAt);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string avatar", () => {
      const model = createMockUserModel({ avatar: "" });
      const domain = UserMapper.toDomain(model);
      expect(domain.avatar).toBe("");
    });

    it("should handle empty string status", () => {
      const model = createMockUserModel({ status: "" });
      const domain = UserMapper.toDomain(model);
      expect(domain.status).toBe("");
    });

    it("should handle different date formats", () => {
      const model = createMockUserModel({
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-12-31T23:59:59.999Z",
      });
      const domain = UserMapper.toDomain(model);

      expect(domain.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
      expect(domain.updatedAt).toEqual(new Date("2024-12-31T23:59:59.999Z"));
    });
  });
});
