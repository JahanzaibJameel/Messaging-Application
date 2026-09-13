import {
  type User,
  type InsertUser,
  type Chat,
  type Message,
  type ChatParticipant,
} from "../shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getChat(id: string): Promise<Chat | undefined>;
  createChat(chat: Omit<Chat, "id" | "createdAt" | "updatedAt">): Promise<Chat>;
  getMessages(chatId: string): Promise<Message[]>;
  createMessage(message: Omit<Message, "id" | "createdAt" | "updatedAt">): Promise<Message>;
  addParticipant(chatId: string, userId: string): Promise<void>;
  getParticipants(chatId: string): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, Message>;
  private participants: Map<string, Set<string>>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.participants = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async createChat(chat: Omit<Chat, "id" | "createdAt" | "updatedAt">): Promise<Chat> {
    const id = randomUUID();
    const now = new Date();
    const fullChat: Chat = { ...chat, id, createdAt: now, updatedAt: now };
    this.chats.set(id, fullChat);
    return fullChat;
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter((m) => m.chatId === chatId);
  }

  async createMessage(message: Omit<Message, "id" | "createdAt" | "updatedAt">): Promise<Message> {
    const id = randomUUID();
    const now = new Date();
    const fullMessage: Message = { ...message, id, createdAt: now, updatedAt: now };
    this.messages.set(id, fullMessage);
    return fullMessage;
  }

  async addParticipant(chatId: string, userId: string): Promise<void> {
    if (!this.participants.has(chatId)) {
      this.participants.set(chatId, new Set());
    }
    this.participants.get(chatId)!.add(userId);
  }

  async getParticipants(chatId: string): Promise<string[]> {
    return Array.from(this.participants.get(chatId) || []);
  }
}

export const storage = new MemStorage();
