/**
 * Local Storage Data Source
 * Handles all local persistence using encrypted MMKV via secureStorage
 * Stores messages per-chat for efficient retrieval
 */

import { AppError } from "@/core/errors";
import type { ChatModel, MessageModel, UserModel } from "../models/MessageModel";
import { secureGetJSON, secureSetJSON, secureDelete, secureClear } from "@/security/secureStorage";

const STORAGE_KEYS = {
  CHATS: "chats",
  USERS: "users",
  CURRENT_USER: "current_user",
  SETTINGS: "settings",
  SYNC_STATE: "sync_state",
} as const;

const MESSAGE_KEY_PREFIX = "messages_";

function messageKey(chatId: string): string {
  return `${MESSAGE_KEY_PREFIX}${chatId}`;
}

export class LocalStorageDataSource {
  private safeGetJSON<T>(key: string, defaultValue: T): Promise<T> {
    return secureGetJSON<T>(key)
      .then((data) => data ?? defaultValue)
      .catch((error) => {
        // Handle JSON parsing errors gracefully (SyntaxError from JSON.parse)
        // Let other errors (storage failures) propagate
        if (error instanceof SyntaxError) {
          return defaultValue;
        }
        throw error;
      });
  }

  private safeGetJSONNull<T>(key: string): Promise<T | null> {
    return secureGetJSON<T>(key)
      .then((data) => data ?? null)
      .catch((error) => {
        if (error instanceof SyntaxError) {
          return null;
        }
        throw error;
      });
  }

  // Chat Operations
  async getChats(): Promise<ChatModel[]> {
    try {
      return await this.safeGetJSON<ChatModel[]>(STORAGE_KEYS.CHATS, []);
    } catch (error) {
      throw AppError.storage("Failed to get chats from local storage", error as Error);
    }
  }

  async saveChats(chats: ChatModel[]): Promise<void> {
    try {
      await secureSetJSON(STORAGE_KEYS.CHATS, chats);
    } catch (error) {
      throw AppError.storage("Failed to save chats to local storage", error as Error);
    }
  }

  async getChatById(chatId: string): Promise<ChatModel | null> {
    try {
      const chats = await this.getChats();
      return chats.find((c) => c.id === chatId) || null;
    } catch (error) {
      throw AppError.storage("Failed to get chat by id", error as Error);
    }
  }

  async saveChat(chat: ChatModel): Promise<void> {
    try {
      const chats = await this.getChats();
      const index = chats.findIndex((c) => c.id === chat.id);

      if (index >= 0) {
        chats[index] = chat;
      } else {
        chats.push(chat);
      }

      await this.saveChats(chats);
    } catch (error) {
      throw AppError.storage("Failed to save chat", error as Error);
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      const chats = await this.getChats();
      const filtered = chats.filter((c) => c.id !== chatId);
      await this.saveChats(filtered);
    } catch (error) {
      throw AppError.storage("Failed to delete chat", error as Error);
    }
  }

  // Message Operations
  async getMessages(chatId: string): Promise<MessageModel[]> {
    try {
      const key = messageKey(chatId);
      return await this.safeGetJSON<MessageModel[]>(key, []);
    } catch (error) {
      throw AppError.storage("Failed to get messages from local storage", error as Error);
    }
  }

  async getMessagesByChatId(chatId: string): Promise<MessageModel[]> {
    return this.getMessages(chatId);
  }

  async saveMessages(chatId: string, messages: MessageModel[]): Promise<void> {
    try {
      const key = messageKey(chatId);
      await secureSetJSON(key, messages);
    } catch (error) {
      throw AppError.storage("Failed to save messages to local storage", error as Error);
    }
  }

  async saveMessage(message: MessageModel): Promise<void> {
    try {
      const { chatId } = message;
      const messages = await this.getMessages(chatId);
      const index = messages.findIndex((m) => m.id === message.id);

      if (index >= 0) {
        messages[index] = message;
      } else {
        messages.push(message);
      }

      await this.saveMessages(chatId, messages);
    } catch (error) {
      throw AppError.storage("Failed to save message", error as Error);
    }
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    try {
      const messages = await this.getMessages(chatId);
      const filtered = messages.filter((m) => m.id !== messageId);
      await this.saveMessages(chatId, filtered);
    } catch (error) {
      throw AppError.storage("Failed to delete message", error as Error);
    }
  }

  async clearMessagesByChatId(chatId: string): Promise<void> {
    try {
      const key = messageKey(chatId);
      await secureDelete(key);
    } catch (error) {
      throw AppError.storage("Failed to clear chat messages", error as Error);
    }
  }

  // User Operations
  async getUsers(): Promise<UserModel[]> {
    try {
      return await this.safeGetJSON<UserModel[]>(STORAGE_KEYS.USERS, []);
    } catch (error) {
      throw AppError.storage("Failed to get users from local storage", error as Error);
    }
  }

  async getUserById(userId: string): Promise<UserModel | null> {
    try {
      const users = await this.getUsers();
      return users.find((u) => u.id === userId) || null;
    } catch (error) {
      throw AppError.storage("Failed to get user by id", error as Error);
    }
  }

  async saveUser(user: UserModel): Promise<void> {
    try {
      const users = await this.getUsers();
      const index = users.findIndex((u) => u.id === user.id);

      if (index >= 0) {
        users[index] = user;
      } else {
        users.push(user);
      }

      await secureSetJSON(STORAGE_KEYS.USERS, users);
    } catch (error) {
      throw AppError.storage("Failed to save user", error as Error);
    }
  }

  async saveUsers(users: UserModel[]): Promise<void> {
    try {
      await secureSetJSON(STORAGE_KEYS.USERS, users);
    } catch (error) {
      throw AppError.storage("Failed to save users", error as Error);
    }
  }

  // Current User
  async getCurrentUser(): Promise<UserModel | null> {
    try {
      return await this.safeGetJSONNull<UserModel>(STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      throw AppError.storage("Failed to get current user", error as Error);
    }
  }

  async saveCurrentUser(user: UserModel | null): Promise<void> {
    try {
      if (user) {
        await secureSetJSON(STORAGE_KEYS.CURRENT_USER, user);
      } else {
        await secureDelete(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (error) {
      throw AppError.storage("Failed to save current user", error as Error);
    }
  }

  // Settings
  async getSettings<T>(): Promise<T | null> {
    try {
      return await this.safeGetJSONNull<T>(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      throw AppError.storage("Failed to get settings", error as Error);
    }
  }

  async saveSettings<T>(settings: T): Promise<void> {
    try {
      await secureSetJSON(STORAGE_KEYS.SETTINGS, settings);
    } catch (error) {
      throw AppError.storage("Failed to save settings", error as Error);
    }
  }

  // Sync State
  async getSyncState<T>(): Promise<T | null> {
    try {
      return await this.safeGetJSONNull<T>(STORAGE_KEYS.SYNC_STATE);
    } catch (error) {
      throw AppError.storage("Failed to get sync state", error as Error);
    }
  }

  async saveSyncState<T>(state: T): Promise<void> {
    try {
      await secureSetJSON(STORAGE_KEYS.SYNC_STATE, state);
    } catch (error) {
      throw AppError.storage("Failed to save sync state", error as Error);
    }
  }

  // Clear All
  async clearAll(): Promise<void> {
    try {
      await secureClear();
    } catch (error) {
      throw AppError.storage("Failed to clear all data", error as Error);
    }
  }

  // Get all keys - not directly available in secureStorage, return empty array
  getAllKeys(): string[] {
    return [];
  }
}

// Singleton instance
export const localStorageDataSource = new LocalStorageDataSource();
