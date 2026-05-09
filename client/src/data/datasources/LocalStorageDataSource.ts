/**
 * Local Storage Data Source
 * Handles all local persistence using MMKV
 */

import { MMKV } from "react-native-mmkv";
import { AppError } from "@core/errors";
import type { ChatModel, MessageModel, UserModel } from "../models/MessageModel";

const storage = new MMKV({ id: "chatapp-local-storage" });

const STORAGE_KEYS = {
  CHATS: "chats",
  MESSAGES: "messages",
  USERS: "users",
  CURRENT_USER: "current_user",
  SETTINGS: "settings",
  SYNC_STATE: "sync_state",
} as const;

export class LocalStorageDataSource {
  private storage: MMKV;

  constructor() {
    this.storage = storage;
  }

  // Chat Operations
  async getChats(): Promise<ChatModel[]> {
    try {
      const data = this.storage.getString(STORAGE_KEYS.CHATS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      throw AppError.storage("Failed to get chats from local storage", error as Error);
    }
  }

  async saveChats(chats: ChatModel[]): Promise<void> {
    try {
      this.storage.set(STORAGE_KEYS.CHATS, JSON.stringify(chats));
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
  async getMessages(): Promise<MessageModel[]> {
    try {
      const data = this.storage.getString(STORAGE_KEYS.MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      throw AppError.storage("Failed to get messages from local storage", error as Error);
    }
  }

  async getMessagesByChatId(chatId: string): Promise<MessageModel[]> {
    try {
      const messages = await this.getMessages();
      return messages.filter((m) => m.chatId === chatId);
    } catch (error) {
      throw AppError.storage("Failed to get messages by chat id", error as Error);
    }
  }

  async saveMessages(messages: MessageModel[]): Promise<void> {
    try {
      this.storage.set(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      throw AppError.storage("Failed to save messages to local storage", error as Error);
    }
  }

  async saveMessage(message: MessageModel): Promise<void> {
    try {
      const messages = await this.getMessages();
      const index = messages.findIndex((m) => m.id === message.id);

      if (index >= 0) {
        messages[index] = message;
      } else {
        messages.push(message);
      }

      await this.saveMessages(messages);
    } catch (error) {
      throw AppError.storage("Failed to save message", error as Error);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messages = await this.getMessages();
      const filtered = messages.filter((m) => m.id !== messageId);
      await this.saveMessages(filtered);
    } catch (error) {
      throw AppError.storage("Failed to delete message", error as Error);
    }
  }

  async clearMessagesByChatId(chatId: string): Promise<void> {
    try {
      const messages = await this.getMessages();
      const filtered = messages.filter((m) => m.chatId !== chatId);
      await this.saveMessages(filtered);
    } catch (error) {
      throw AppError.storage("Failed to clear chat messages", error as Error);
    }
  }

  // User Operations
  async getUsers(): Promise<UserModel[]> {
    try {
      const data = this.storage.getString(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
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

      this.storage.set(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      throw AppError.storage("Failed to save user", error as Error);
    }
  }

  async saveUsers(users: UserModel[]): Promise<void> {
    try {
      this.storage.set(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      throw AppError.storage("Failed to save users", error as Error);
    }
  }

  // Current User
  async getCurrentUser(): Promise<UserModel | null> {
    try {
      const data = this.storage.getString(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw AppError.storage("Failed to get current user", error as Error);
    }
  }

  async saveCurrentUser(user: UserModel | null): Promise<void> {
    try {
      if (user) {
        this.storage.set(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        this.storage.delete(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (error) {
      throw AppError.storage("Failed to save current user", error as Error);
    }
  }

  // Settings
  async getSettings<T>(): Promise<T | null> {
    try {
      const data = this.storage.getString(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw AppError.storage("Failed to get settings", error as Error);
    }
  }

  async saveSettings<T>(settings: T): Promise<void> {
    try {
      this.storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      throw AppError.storage("Failed to save settings", error as Error);
    }
  }

  // Sync State
  async getSyncState<T>(): Promise<T | null> {
    try {
      const data = this.storage.getString(STORAGE_KEYS.SYNC_STATE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw AppError.storage("Failed to get sync state", error as Error);
    }
  }

  async saveSyncState<T>(state: T): Promise<void> {
    try {
      this.storage.set(STORAGE_KEYS.SYNC_STATE, JSON.stringify(state));
    } catch (error) {
      throw AppError.storage("Failed to save sync state", error as Error);
    }
  }

  // Clear All
  async clearAll(): Promise<void> {
    try {
      this.storage.clearAll();
    } catch (error) {
      throw AppError.storage("Failed to clear all data", error as Error);
    }
  }

  // Get all keys
  getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }
}

// Singleton instance
export const localStorageDataSource = new LocalStorageDataSource();
