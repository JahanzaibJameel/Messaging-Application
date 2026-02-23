/**
 * User mapper
 * Converts between domain entities and data models
 */

import { UserEntity, type User } from '@/domain/entities/User';
import type { UserModel } from '../models/MessageModel';

export class UserMapper {
  static toDomain(model: UserModel): User {
    return {
      id: model.id,
      name: model.name,
      phone: model.phone,
      avatar: model.avatar,
      isOnline: model.isOnline,
      lastSeen: model.lastSeen ? new Date(model.lastSeen) : undefined,
      status: model.status,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
    };
  }

  static toModel(domain: User): UserModel {
    return {
      id: domain.id,
      name: domain.name,
      phone: domain.phone,
      avatar: domain.avatar,
      isOnline: domain.isOnline,
      lastSeen: domain.lastSeen?.toISOString(),
      status: domain.status,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  static toEntity(model: UserModel): UserEntity {
    return new UserEntity(this.toDomain(model));
  }
}
